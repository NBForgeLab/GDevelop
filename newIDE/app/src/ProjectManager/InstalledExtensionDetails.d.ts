import * as React from 'react';
import type { ExtensionShortHeader } from '../Utils/GDevelopServices/Extension';

export declare const useInstallExtensionWithDependencies: () => (options: {
  project: gdProject;
  extensionShortHeader: ExtensionShortHeader;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
}) => Promise<boolean>;

export type Props = {
  project: gdProject;
  onClose: () => void;
  extensionShortHeader: ExtensionShortHeader;
  extensionName: string;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  onOpenEventsFunctionsExtension: (extensionName: string) => void;
};

declare const InstalledExtensionDetails: React.ComponentType<Props>;
export default InstalledExtensionDetails;
