export type EnumeratedBehaviorMetadata = {
  extension: gdPlatformExtension;
  behaviorMetadata: gdBehaviorMetadata;
  type: string;
  objectType: string;
  defaultName: string;
  fullName: string;
  description: string;
  previewIconUrl: string;
  category: string;
  tags: Array<string>;
};

export declare const enumerateBehaviorsMetadata: (
  platform: gdPlatform,
  project: gdProject,
  eventsFunctionsExtension: gdEventsFunctionsExtension | null
) => Array<EnumeratedBehaviorMetadata>;

export declare const filterEnumeratedBehaviorMetadata: (
  list: Array<EnumeratedBehaviorMetadata>,
  searchText: string
) => Array<EnumeratedBehaviorMetadata>;

export declare const isBehaviorDefaultCapability: (
  behaviorMetadata: gdBehaviorMetadata
) => boolean;
