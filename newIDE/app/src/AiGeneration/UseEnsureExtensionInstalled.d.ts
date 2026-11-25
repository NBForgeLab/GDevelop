import { type I18n as I18nType } from '@lingui/core';

export type EnsureExtensionInstalledOptions = {
  extensionName: string;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
};

export declare const useEnsureExtensionInstalled: (options: {
  project: gdProject | null | undefined;
  i18n: I18nType;
}) => {
  ensureExtensionInstalled: (
    options: EnsureExtensionInstalledOptions
  ) => Promise<void>;
};
