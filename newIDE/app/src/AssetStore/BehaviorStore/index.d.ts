import * as React from 'react';
import { type BehaviorShortHeader } from '../../Utils/GDevelopServices/Extension';

type Props = {
  isInstalling: boolean;
  project: gdProject;
  objectType: string;
  objectBehaviorsTypes: Array<string>;
  isChildObject: boolean;
  installedBehaviorMetadataList: Array<BehaviorShortHeader>;
  deprecatedBehaviorMetadataList: Array<BehaviorShortHeader>;
  onInstall: (behaviorShortHeader: BehaviorShortHeader) => Promise<boolean>;
  onChoose: (behaviorType: string) => void;
  shouldCheckCapabilityBehaviors: boolean;
};

export declare const useExtensionUpdateAlertDialog: () => (
  project: gdProject,
  behaviorShortHeader: BehaviorShortHeader
) => Promise<boolean>;

export declare const BehaviorStore: React.ComponentType<Props>;
