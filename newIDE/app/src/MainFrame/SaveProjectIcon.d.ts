import * as React from 'react';
import { type FileMetadata } from '../ProjectsStorage';

type Props = {
  onSave: (options?: {
    skipNewVersionWarning: boolean;
  }) => Promise<FileMetadata | null | undefined>;
  canSave: boolean;
  id: string;
};

declare const SaveProjectIcon: React.ComponentType<Props>;

export default SaveProjectIcon;
