import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type AiGeneratedEvent } from '../Utils/GDevelopServices/Generation';
import {
  type JsCodeExcerpt,
  type ScopeSummary,
} from '../EventsSheet/EventsTree/TextRenderer/EventScriptSourceView';
import {
  type SimplifiedBehavior,
  type SimplifiedVariable,
} from './SimplifiedProject/SimplifiedProject';
import { type AttachmentsForResources } from './AttachmentResources';
import type {
  SceneEventsOutsideEditorChanges,
  ExtensionsOutsideEditorChanges,
  WillDeleteExtensionItemChanges,
  InstancesOutsideEditorChanges,
  ObjectsOutsideEditorChanges,
  ObjectGroupsOutsideEditorChanges,
  ProjectItemRenamedOutsideEditorChanges,
  WillDeleteSceneChanges,
  WillDeleteGameplayTestChanges,
  WillDeleteObjectChanges,
} from './OutsideEditorChanges';
import {
  type AssetShortHeader,
  type EffectTarget,
} from '../Utils/GDevelopServices/Asset';
import { type ExampleShortHeader } from '../Utils/GDevelopServices/Example';
import { type EnsureExtensionInstalledOptions } from '../AiGeneration/UseEnsureExtensionInstalled';
import { type ObjectSizeInfo } from './Utils';
import { type ToolScope } from './Scope';

export type HintEntry = {
  code: string;
  message: string;
  objectNames: Array<string>;
};

export type EditorFunctionCall = {
  name: string;
  arguments: string;
  call_id: string;
};

export type EditorFunctionCallResult =
  | {
      status: 'working';
      call_id: string;
    }
  | {
      status: 'finished';
      call_id: string;
      success: boolean;
      output: any;
      didModifyProject?: true;
    }
  | {
      status: 'aborted';
      call_id: string;
    };

export type ResourceSearchAndInstallOptions = {
  resources: Array<{
    resourceName: string;
    resourceKind: string;
  }>;
};

export type SingleResourceSearchAndInstallResult = {
  resourceName: string;
  resourceKind: string;
  status:
    | 'resource-installed'
    | 'nothing-found'
    | 'resource-already-exists'
    | 'error';
  error?: string;
};

export type ResourceSearchAndInstallResult = {
  results: Array<SingleResourceSearchAndInstallResult>;
};

export type EditorFunctionGenericOutput = {
  success: boolean;
  meta?: {
    newSceneNames?: Array<string>;
    newExternalLayoutNames?: Array<string>;
    createdProject?: gdProject;
    didModifyProject?: boolean;
  };
  functionCallRecords?: Array<Record<string, any>>;
  consoleLogs?: Array<string>;
  returnValue?: any;
  error?: {
    message: string;
    lineNumber: number | null;
    lastCalledFunctionName: string | null;
  } | null;
  message?: string;
  result?: any;
  status?: string;
  testName?: string;
  framesExecuted?: number;
  durationMs?: number;
  gameTimeMs?: number;
  assertions?: Array<Record<string, any>>;
  errors?: Array<string>;
  eventLog?: Array<Record<string, any>>;
  finalState?: Record<string, any> | null;
  screenshots?: Array<Record<string, any>>;
  performance?: Record<string, any> | null;
  nothingChanged?: boolean;
  eventsAsText?: string;
  eventsRenderingErrors?: Array<{ path: string; message: string }>;
  objectName?: string;
  behaviorName?: string;
  isSynchronizedOverNetwork?: boolean;
  properties?: any;
  sharedProperties?: any;
  instances?: any;
  layers?: any;
  effects?: any;
  sceneNames?: Array<string>;
  resources?: any;
  resourcesSummary?: any;
  behaviors?: Array<SimplifiedBehavior>;
  addedBehaviors?: Array<{
    objectName: string;
    behaviorName: string;
    behaviorType: string;
  }>;
  tests?: Array<{ test_name: string; description: string }>;
  variables?: Array<SimplifiedVariable>;
  extension?: Record<string, any>;
  customObject?: Record<string, any>;
  customBehavior?: Record<string, any>;
  functionDeclaration?: Record<string, any>;
  variant?: Record<string, any>;
  extensionName?: string;
  customObjectName?: string;
  objectType?: string;
  variantNames?: Array<string>;
  customBehaviorName?: string;
  behaviorType?: string;
  functionType?: string;
  callForms?: Array<string>;
  reminder?: string;
  animationNames?: string;
  rawJson?: Record<string, any>;
  frameImageSizes?: {
    [imageName: string]: { width: number; height: number };
  };
  modelAnimationSources?: Array<string>;
  eventScript?: string;
  selectedEventIds?: Array<string>;
  jsCodeExcerpt?: JsCodeExcerpt;
  editedEventSnippets?: Array<{
    eventId: string;
    replacements: string;
    snippet: string;
  }>;
  truncated?: boolean;
  notes?: Array<string>;
  generatedEventsErrorDiagnostics?: string;
  aiGeneratedEventId?: string;
  warnings?: string;
  initializedProject?: boolean;
  initializedFromTemplateSlug?: string;
  eventsAsTextByScene?: { [key: string]: string };
  eventsForSceneNamed?: string;
  eventsForExternalEventsNamed?: string;
  eventsForScopeLabel?: string;
  functionName?: string;
  scopeSummary?: ScopeSummary;
  instancesForSceneNamed?: string;
  instancesOnlyForObjectsNamed?: string;
  propertiesLayersEffectsForSceneNamed?: string;
  objectPropertiesDeduplicationKey?: string;
  instancesForExternalLayoutNamed?: string;
  instancesForScopeLabel?: string;
  propertiesLayersEffectsForScopeLabel?: string;
  movedInstancesCount?: number;
  movedInstancesCountByObjectName?: { [objectName: string]: number };
  isDefaultVariant?: boolean;
  area?: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
  objectGroups?: Array<{
    objectGroupName: string;
    objectNames: Array<string>;
  }>;
  assetStoreAssetId?: string;
  newlyAddedResources?: Array<SingleResourceSearchAndInstallResult>;
  objectSizeInfo?: { [key: string]: ObjectSizeInfo | null };
  positionSemantics?: string;
  hints?: Array<HintEntry>;
  aborted?: true;
};

export type EventsGenerationResult =
  | {
      generationCompleted: true;
      aiGeneratedEvent: AiGeneratedEvent;
    }
  | {
      generationCompleted: false;
      errorMessage: string;
    }
  | {
      generationAborted: true;
    };

export type EventBatch = {
  eventsDescription: string;
  eventScript: string | null;
  placementRelation: string;
  placementTargetEventId: string | null;
  placementExpectedParentEventId: string | null;
  placementRationale: string | null;
  expectedEventSource: string | null;
  placementTargetEventSource: string | null;
  isEventScriptFromEdits: boolean;
};

export type EventsGenerationOptions = {
  scope: ToolScope;
  functionName: string | null;
  sceneName: string;
  eventsDescription: string | null;
  eventBatches: Array<EventBatch> | null;
  extensionNamesList: string;
  objectsList: string;
  existingEventsJson: string | null;
  placementHint: string | null;
  relatedAiRequestId: string | null;
  estimatedComplexity: number | null;
};

export type AssetSearchAndInstallResult = {
  status: 'asset-installed' | 'nothing-found' | 'error';
  message: string;
  createdObjects: Array<gdObject>;
  assetShortHeader: AssetShortHeader | null;
  isTheFirstOfItsTypeInProject: boolean;
};

export type AssetSearchAndInstallOptions = {
  objectsContainer: gdObjectsContainer;
  objectName: string;
  objectType: string | null;
  searchTerms: string;
  description: string;
  twoDimensionalViewKind: string;
  exactOrPartialAssetId?: string | null;
  relatedAiRequestId?: string | null;
  lastUserMessage?: string | null;
  lastAssistantMessages?: string[];
};

export type EffectAssetSearchAndInstallOptions = {
  effectsContainer: gdEffectsContainer;
  effectTarget: EffectTarget;
  effectName: string;
  effectType: string | null;
  exactOrPartialAssetId: string;
  relatedAiRequestId?: string | null;
  lastUserMessage?: string | null;
  lastAssistantMessages?: string[];
};

export type EffectAssetSearchAndInstallResult = {
  status: 'asset-installed' | 'nothing-found' | 'error';
  message: string;
  effect: gdEffect | null;
  assetShortHeader: AssetShortHeader | null;
};

export type EditorCallbacks = {
  onOpenLayout: (
    sceneName: string,
    options: {
      openEventsEditor: boolean;
      openSceneEditor: boolean;
      focusWhenOpened:
        | 'scene-or-events-otherwise'
        | 'scene'
        | 'events'
        | 'none';
    }
  ) => void;
  onOpenExternalLayout: (externalLayoutName: string) => void;
  onCreateProject: (options: {
    name: string;
    exampleSlug: string | null;
    projectFileUrl?: string | null;
  }) => Promise<{
    createdProject: gdProject | null;
    exampleSlug: string | null;
  }>;
  onOpenEventsFunctionsExtension: (
    extensionName: string,
    options: {
      functionName?: string;
      behaviorName?: string;
      objectName?: string;
    }
  ) => void;
  onOpenCustomObjectEditor: (
    extensionName: string,
    objectName: string,
    variantName: string
  ) => void;
};

export type ToolOptions = {
  includeEventsJson?: boolean;
  [key: string]: any;
};

export type RenderForEditorOptions = {
  project: gdProject | null | undefined;
  args: any;
  editorCallbacks: EditorCallbacks;
  shouldShowDetails: boolean;
  editorFunctionCallResultOutput: any;
  exampleShortHeaders?: Array<ExampleShortHeader> | null;
};

export type RelatedAiRequestLastMessages = {
  lastUserMessage: string | null;
  lastAssistantMessages: string[];
};

export type LaunchFunctionOptionsWithoutProject = {
  PixiResourcesLoader: any;
  args: any;
  editorCallbacks: EditorCallbacks;
  toolOptions: ToolOptions | null;
  toolsVersion?: string | null;
  runScriptReadOnly?: boolean;
  readonly isCalledFromScript?: boolean;
  i18n: I18nType;
  relatedAiRequestId: string | null;
  getRelatedAiRequestLastMessages: () => RelatedAiRequestLastMessages;
  generateEvents: (
    options: EventsGenerationOptions
  ) => Promise<EventsGenerationResult>;
  onSceneEventsModifiedOutsideEditor: (
    changes: SceneEventsOutsideEditorChanges
  ) => void;
  onInstancesModifiedOutsideEditor: (
    changes: InstancesOutsideEditorChanges
  ) => void;
  onObjectsModifiedOutsideEditor: (
    changes: ObjectsOutsideEditorChanges
  ) => void;
  onEffectsModifiedOutsideEditor: () => void;
  onObjectGroupsModifiedOutsideEditor: (
    changes: ObjectGroupsOutsideEditorChanges
  ) => void;
  onProjectItemRenamedOutsideEditor: (
    changes: ProjectItemRenamedOutsideEditorChanges
  ) => void;
  onWillDeleteScene: (changes: WillDeleteSceneChanges) => Promise<void>;
  onWillDeleteGameplayTest: (
    changes: WillDeleteGameplayTestChanges
  ) => Promise<void>;
  onWillDeleteObject: (changes: WillDeleteObjectChanges) => void;
  sendChangesToEditor: () => void;
  onExtensionsModifiedOutsideEditor: (
    changes: ExtensionsOutsideEditorChanges
  ) => void;
  ensureExtensionsUpToDate: () => Promise<void>;
  reloadExtensionMetadata: (extensionName: string) => void;
  onWillDeleteExtensionItem: (
    changes: WillDeleteExtensionItemChanges
  ) => Promise<void>;
  ensureExtensionInstalled: (
    options: EnsureExtensionInstalledOptions
  ) => Promise<void>;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  searchAndInstallAsset: (
    options: AssetSearchAndInstallOptions
  ) => Promise<AssetSearchAndInstallResult>;
  searchAndInstallEffectAsset: (
    options: EffectAssetSearchAndInstallOptions
  ) => Promise<EffectAssetSearchAndInstallResult>;
  searchAndInstallResources: (
    options: ResourceSearchAndInstallOptions
  ) => Promise<ResourceSearchAndInstallResult>;
  attachmentsForResources: AttachmentsForResources;
  getAssetStoreTagForNewObject: (objectType: string) => string | null;
};

export type LaunchFunctionCollaborators = Omit<
  LaunchFunctionOptionsWithoutProject,
  'args'
>;

export type LaunchFunctionOptionsWithProject =
  LaunchFunctionOptionsWithoutProject & {
    project: gdProject;
  };

export type EditorFunction = {
  renderForEditor?: (options: RenderForEditorOptions) => {
    text: React.ReactNode;
    details?: React.ReactNode | null;
    hasDetailsToShow?: boolean;
  };
  launchFunction: (
    options: LaunchFunctionOptionsWithProject
  ) => Promise<EditorFunctionGenericOutput>;
  modifiesProject: boolean;
  getModifiesProject?: (args: any) => boolean;
};

export type EditorFunctionWithoutProject = {
  renderForEditor?: (options: RenderForEditorOptions) => {
    text: React.ReactNode;
    details?: React.ReactNode | null;
    hasDetailsToShow?: boolean;
  };
  launchFunction: (
    options: LaunchFunctionOptionsWithoutProject
  ) => Promise<EditorFunctionGenericOutput>;
  modifiesProject: boolean;
  getModifiesProject?: (args: any) => boolean;
};

export declare const getPropertyValue: (options: {
  properties: gdMapStringPropertyDescriptor | null;
  propertyName: string;
}) => string | null;

export declare const noEventsInSceneText: string;

export declare const noEventsInFunctionText: string;

export declare const editorFunctions: Record<string, EditorFunction>;

export declare const editorFunctionsWithoutProject: Record<
  string,
  EditorFunctionWithoutProject
>;
