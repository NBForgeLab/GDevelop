type WarningOptions = {
  delayToNextTick: boolean;
};

type ErrorArgs = {
  message: string;
  rawError: Error | Record<string, any> | null | undefined;
  errorId: string;
  doNotReport?: boolean;
};

export declare const showMessageBox: (message: string) => void;
export declare const showWarningBox: (
  message: string,
  options?: WarningOptions
) => void;
export declare const showErrorBox: (args: ErrorArgs) => void;
