import { type I18n as I18nType } from '@lingui/core';
import {
  type ExtensionShortHeader,
  type BehaviorShortHeader,
  type SerializedExtension,
  type ExtensionDependency,
} from '../../Utils/GDevelopServices/Extension';
import { type EventsFunctionsExtensionsState } from '../../EventsFunctionsExtensionsLoader/EventsFunctionsExtensionsContext';
import { type ObjectAsset } from '../../Utils/GDevelopServices/Asset';

export type RequiredExtensionInstallation = {
  requiredExtensionShortHeaders: Array<ExtensionShortHeader>;
  missingExtensionShortHeaders: Array<ExtensionShortHeader>;
  outOfDateExtensionShortHeaders: Array<ExtensionShortHeader>;
  breakingChangesExtensionShortHeaders: Array<ExtensionShortHeader>;
  incompatibleWithIdeExtensionShortHeaders: Array<ExtensionShortHeader>;
  safeToUpdateExtensions: Array<ExtensionShortHeader>;
  unknownExtensionDependencies: Array<ExtensionDependency>;
  isGDevelopUpdateNeeded: boolean;
};

export type RequiredExtensionOwners =
  | Array<ObjectAsset>
  | Array<ExtensionShortHeader>
  | Array<BehaviorShortHeader>
  | Array<SerializedExtension>;

export type InstallRequiredExtensionsArgs = {
  requiredExtensionInstallation: RequiredExtensionInstallation;
  shouldUpdateExtension: boolean;
  eventsFunctionsExtensionsState: EventsFunctionsExtensionsState;
  project: gdProject;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  importedSerializedExtensions?: Array<SerializedExtension>;
};

export declare const ensureExtensionsRegistryLoaded: (extensionShortHeadersByName: {
  [name: string]: ExtensionShortHeader;
}) => Promise<{ [name: string]: ExtensionShortHeader }>;

export declare const getExtensionHeader: (
  extensionShortHeadersByName: { [name: string]: ExtensionShortHeader },
  extensionName: string
) => ExtensionShortHeader | null;

export declare const checkRequiredExtensionsUpdate: (options: {
  requiredExtensions: Array<ExtensionDependency>;
  project: gdProject;
  extensionShortHeadersByName: { [name: string]: ExtensionShortHeader };
  shouldAllowUnknownExtension?: boolean;
}) => Promise<RequiredExtensionInstallation>;

export declare const useExtensionUpdateAlertDialog: () => (options: {
  outOfDateExtensionShortHeaders: Array<ExtensionShortHeader>;
  project: gdProject;
  reason: 'asset' | 'extension' | 'behavior';
}) => Promise<string>;

export declare const getRequiredExtensions: (
  requiredExtensionOwners: RequiredExtensionOwners
) => Array<ExtensionDependency>;

export declare const useInstallExtension: () => (options: {
  importedSerializedExtensions: Array<SerializedExtension>;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  project: gdProject;
  reason: 'asset' | 'extension' | 'behavior';
  requiredExtensionInstallation: RequiredExtensionInstallation;
  updateMode: 'all' | 'safeOnly';
}) => Promise<boolean>;

export declare const installRequiredExtensions: (
  args: InstallRequiredExtensionsArgs
) => Promise<void>;

export declare const addSerializedExtensionsToProject: (
  eventsFunctionsExtensionsState: EventsFunctionsExtensionsState,
  project: gdProject,
  serializedExtensions: Array<SerializedExtension>,
  fromStoreExtensionNames: Array<string>
) => Promise<void>;

export declare const useImportExtension: () => (options: {
  i18n: I18nType;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  project: gdProject;
  filePaths?: Array<string>;
  skipUserPrompts?: boolean;
}) => Promise<Array<string>>;
