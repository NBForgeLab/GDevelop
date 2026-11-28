import { Trans } from '@lingui/macro';
import * as React from 'react';
import Dialog, { DialogPrimaryButton } from '../UI/Dialog';
import FlatButton from '../UI/FlatButton';
import { Line } from '../UI/Grid';
import Text from '../UI/Text';
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderColumn,
  TableRow,
  TableRowColumn,
} from '../UI/Table';
import { ColumnStackLayout } from '../UI/Layout';
import LinearProgress from '../UI/LinearProgress';

export type GenericRetryableProcessWithProgressResults = {
  erroredResources: Array<{
    resourceName: string;
    error: Error;
  }>;
};

type GenericRetryableProcessWithProgressProps = {
  progress: number;
  result: GenericRetryableProcessWithProgressResults | null | undefined;
  onAbandon: (() => void) | null | undefined;
  onRetry: (() => void) | null | undefined;
  genericError: Error | null | undefined;
  /** Defaults to "Importing project resources". */
  title?: React.ReactNode;
  /** Displayed above the progress bar while there is no error. */
  message?: React.ReactNode;
  /** Display a cancel button while the process is running. */
  onCancel?: (() => void) | null;
};

const styles: { tableCell: React.CSSProperties } = {
  tableCell: {
    // Avoid long filenames breaking the design.
    wordBreak: 'break-word',
  },
};

export const GenericRetryableProcessWithProgressDialog = ({
  progress,
  result,
  onAbandon,
  onRetry,
  genericError,
  title,
  message,
  onCancel,
}: GenericRetryableProcessWithProgressProps): React.ReactNode => {
  const hasErrors =
    (result && result.erroredResources.length > 0) || !!genericError;

  return (
    <Dialog
      title={title || <Trans>Importing project resources</Trans>}
      actions={[
        onCancel ? (
          <FlatButton
            label={<Trans>Cancel</Trans>}
            onClick={onCancel}
            key="cancel"
          />
        ) : null,
        onAbandon ? (
          <FlatButton
            label={<Trans>Retry</Trans>}
            primary
            onClick={onRetry}
            key="retry"
          />
        ) : null,
        onRetry ? (
          <DialogPrimaryButton
            label={<Trans>Ignore and continue</Trans>}
            primary
            disabled={!onAbandon}
            onClick={onAbandon}
            key="close"
          />
        ) : null,
      ]}
      cannotBeDismissed={!hasErrors}
      fullscreen="never-even-on-mobile"
      open
      maxWidth="sm"
    >
      <ColumnStackLayout noMargin expand>
        <Text>
          {hasErrors ? (
            <Trans>
              There were errors when importing resources for the project. You
              can retry (recommended) or continue despite the errors. In this
              case, the project might be missing some resources.
            </Trans>
          ) : (
            message || null
          )}
        </Text>
        <Line noMargin expand>
          <LinearProgress
            variant={progress > 0 ? 'determinate' : 'indeterminate'}
            value={progress}
          />
        </Line>
        {hasErrors ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderColumn>
                  <Trans>Resource name</Trans>
                </TableHeaderColumn>
                <TableHeaderColumn>
                  <Trans>Error</Trans>
                </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result
                ? result.erroredResources.map(({ resourceName, error }) => (
                    <TableRow key={resourceName}>
                      <TableRowColumn style={styles.tableCell}>
                        {resourceName}
                      </TableRowColumn>
                      <TableRowColumn style={styles.tableCell}>
                        {error.toString()}
                      </TableRowColumn>
                    </TableRow>
                  ))
                : null}
              {genericError ? (
                <TableRow>
                  <TableRowColumn style={styles.tableCell}>-</TableRowColumn>
                  <TableRowColumn style={styles.tableCell}>
                    {genericError.toString()}
                  </TableRowColumn>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        ) : null}
      </ColumnStackLayout>
    </Dialog>
  );
};

type UseGenericRetryableProcessWithProgressOutput<DoProcessOptions> = {
  /**
   * Launch the process.
   */
  ensureProcessIsDone: (options: DoProcessOptions) => Promise<void>;
  /**
   * Render, if needed, the dialog that will show the progress of the process.
   */
  renderProcessDialog: () => React.ReactNode;
};

type RetryOrAbandonCallback = () => void;

/**
 * Hook allowing to launch a process, displaying its progress, and allowing to retry
 * if errors happened.
 */
export const useGenericRetryableProcessWithProgress = <DoProcessOptions,>({
  onDoProcess,
}: {
  onDoProcess: (
    options: DoProcessOptions,
    onProgress: (count: number, total: number) => void
  ) => Promise<GenericRetryableProcessWithProgressResults>;
}): UseGenericRetryableProcessWithProgressOutput<DoProcessOptions> => {
  const [progress, setProgress] = React.useState(0);
  const [processedCount, setProcessedCount] = React.useState<{
    count: number;
    total: number;
  } | null>(null);
  const [genericError, setGenericError] = React.useState<Error | null>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [result, setResult] =
    React.useState<GenericRetryableProcessWithProgressResults | null>(null);
  const [onRetry, setOnRetry] = React.useState<RetryOrAbandonCallback | null>(
    null
  );
  const [onAbandon, setOnAbandon] =
    React.useState<RetryOrAbandonCallback | null>(null);

  const ensureProcessIsDone = React.useCallback(
    async (options: DoProcessOptions): Promise<void> => {
      setProgress(0);
      setProcessedCount(null);
      setOnRetry(null);
      setOnAbandon(null);
      setResult(null);
      setGenericError(null);

      // This will display the dialog:
      setIsFetching(true);

      let newResult: GenericRetryableProcessWithProgressResults | null = null;
      try {
        newResult = await onDoProcess(options, (count, total) => {
          setProgress((count / total) * 100);
          setProcessedCount({ count, total });
        });

        setProgress(100);
        if (newResult.erroredResources.length === 0) {
          // No error happened: finish normally, closing the dialog.
          setIsFetching(false);
          setGenericError(null);
          setResult(null);
          return;
        }
      } catch (genericError) {
        setGenericError(genericError as Error);
      }

      // An error happened. Store the errors and offer a way to
      // retry.
      return new Promise<void>((resolve) => {
        setOnRetry((): RetryOrAbandonCallback => () => {
          // Launch the fetch again, and solve the promise once
          // this new fetch resolve itself.
          resolve(ensureProcessIsDone(options));
        });
        setOnAbandon((): RetryOrAbandonCallback => () => {
          // Abandon: resolve immediately, closing the dialog
          setIsFetching(false);
          setGenericError(null);
          setResult(null);
          resolve();
        });

        // Display the errors to the user:
        setResult(newResult);
        setIsFetching(false);
      });
    },
    [onDoProcess]
  );

  const renderProcessDialog = React.useCallback(() => {
    const hasErrors =
      (result && result.erroredResources.length >= 0) || !!genericError;
    if (!isFetching && !hasErrors) return null;

    return (
      <GenericRetryableProcessWithProgressDialog
        progress={progress}
        message={
          processedCount ? (
            <Trans>
              Resources: {processedCount.count}/{processedCount.total}
            </Trans>
          ) : null
        }
        result={result}
        genericError={genericError}
        onAbandon={onAbandon}
        onRetry={onRetry}
      />
    );
  }, [
    isFetching,
    progress,
    processedCount,
    result,
    onAbandon,
    onRetry,
    genericError,
  ]);

  return React.useMemo(
    () => ({
      ensureProcessIsDone,
      renderProcessDialog,
    }),
    [ensureProcessIsDone, renderProcessDialog]
  );
};
