export type ElectronUpdateStatus = {
  message: string;
  status:
    | 'checking-for-update'
    | 'update-available'
    | 'update-not-available'
    | 'error'
    | 'download-progress'
    | 'update-downloaded'
    | 'unknown';
  info?: { version?: string };
};
