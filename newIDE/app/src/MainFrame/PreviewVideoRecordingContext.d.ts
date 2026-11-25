import * as React from 'react';

export type PreviewVideoRecording = {
  currentProjectGameId: string | null | undefined;
  onRecordPreviewVideo: () => Promise<void>;
};

declare const PreviewVideoRecordingContext: React.Context<PreviewVideoRecording>;

export default PreviewVideoRecordingContext;
