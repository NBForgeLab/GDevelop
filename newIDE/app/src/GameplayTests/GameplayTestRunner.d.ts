export type GameplayTestScope =
  | { type: 'project' }
  | { type: 'extension'; extensionName: string };

export declare const projectGameplayTestScope: GameplayTestScope;

export declare const getGameplayTestScopeDescription: (
  scope: GameplayTestScope
) => string;

export type GameplayTestAssertion = {
  message: string;
  passed: boolean;
};

export type GameplayTestScreenshot = {
  label: string;
  frame: number;
  width?: number;
  height?: number;
  jpegBase64: string;
  pngBase64?: string;
};

export type GameplayTestResult = {
  testName: string;
  status:
    | 'passed'
    | 'failed'
    | 'error'
    | 'stopped'
    | 'timeout'
    | 'paused'
    | 'unavailable';
  framesExecuted: number;
  durationMs: number;
  loadingMs: number;
  timeoutMs: number;
  hiddenStallMs: number;
  gameTimeMs: number;
  assertions: Array<GameplayTestAssertion>;
  errors: Array<string>;
  warnings: Array<string>;
  consoleLogs: Array<{ level: 'log' | 'warn' | 'error'; message: string }>;
  eventLog: Array<Record<string, any>>;
  finalState: Record<string, any> | null;
  screenshots: Array<GameplayTestScreenshot>;
  screenshotsTakenCount?: number;
  droppedScreenshots?: Array<{ label: string; frame: number }>;
  profiles: Array<Record<string, any>>;
  performance: Record<string, any> | null;
};

export type GameplayTestToRun = {
  scope: GameplayTestScope;
  testName: string;
  source?: string;
};

export type GameplayTestRunOptions = {
  timeoutMs?: number;
  loadingTimeoutMs?: number;
  screenshots?: 'off' | 'on';
  speedFactor?: number;
  closeFrameWhenFinished?: boolean;
  onTestStarted?: (test: GameplayTestToRun) => void;
  onProgress?: (test: GameplayTestToRun, frame: number) => void;
};

export type GameplayTestsCallbacks = {
  onOpenGameplayTest: (scope: GameplayTestScope, testName: string) => void;
  onRenameGameplayTest: (
    scope: GameplayTestScope,
    oldName: string,
    newName: string
  ) => void;
  onDeleteGameplayTest: (scope: GameplayTestScope, test: gdTest) => void;
  onRunGameplayTest: (
    scope: GameplayTestScope,
    testName: string
  ) => void | Promise<void>;
};

export declare const getIsGameplayTestRunInProgress: () => boolean;
export declare const useIsGameplayTestRunInProgress: () => boolean;
export declare const makeGameplayTestResultReadableOutput: (
  result: GameplayTestResult
) => Record<string, any>;
export declare const getTestsContainer: (
  project: gdProject,
  scope: GameplayTestScope
) => gdTestsContainer | null;
export declare const getGameplayTestProjectItemName: (
  scope: GameplayTestScope,
  testName: string
) => string;
export declare const updateTestLastRun: (
  project: gdProject,
  test: GameplayTestToRun,
  result: GameplayTestResult
) => void;
export declare const runProjectGameplayTests: (options: {
  project: gdProject;
  tests: Array<GameplayTestToRun>;
  options: GameplayTestRunOptions;
}) => Promise<Array<GameplayTestResult>>;
export declare const stopRunningProjectGameplayTest: () => void;
