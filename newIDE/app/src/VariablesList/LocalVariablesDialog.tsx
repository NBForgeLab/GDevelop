import * as React from 'react';
import { Trans } from '@lingui/macro';
import VariablesEditorDialog, {
  type VariableDialogOpeningProps,
} from './VariablesEditorDialog';
import { ProjectScopedContainersAccessor } from '../InstructionOrExpression/EventsScope';

type Props = {
  open: boolean;
  project: gdProject;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  variablesContainer: gdVariablesContainer;
  loopIndexVariableName?: string | null;
  onRenameLoopIndexVariable?: (newName: string) => void;
  onRemoveLoopIndexVariable?: () => void;
  onApply: (selectedVariableName: string | null) => void;
  onCancel: () => void;
  initiallySelectedVariable: VariableDialogOpeningProps | null;
  isListLocked: boolean;
};

const LocalVariablesDialog = ({
  project,
  projectScopedContainersAccessor,
  variablesContainer,
  loopIndexVariableName,
  onRenameLoopIndexVariable,
  onRemoveLoopIndexVariable,
  open,
  onCancel,
  onApply,
  initiallySelectedVariable,
  isListLocked,
}: Props): React.ReactNode => {
  const tabs = React.useMemo(
    () => [
      {
        id: 'local-variables',
        label: '',
        variablesContainer,
        onComputeAllVariableNames: () => [],
        loopIndexVariableName: loopIndexVariableName || '',
        onRenameLoopIndexVariable,
        onRemoveLoopIndexVariable,
      },
    ],
    [
      variablesContainer,
      loopIndexVariableName,
      onRenameLoopIndexVariable,
      onRemoveLoopIndexVariable,
    ]
  );

  return (
    <VariablesEditorDialog
      project={project}
      projectScopedContainersAccessor={projectScopedContainersAccessor}
      open={open}
      onCancel={onCancel}
      onApply={onApply}
      title={<Trans>Local variables</Trans>}
      tabs={tabs}
      helpPagePath={'/all-features/variables/local-variables'}
      id="local-variables-dialog"
      initiallySelectedVariable={initiallySelectedVariable}
      hotReloadPreviewButtonProps={null}
      isListLocked={isListLocked}
    />
  );
};

export default LocalVariablesDialog;
