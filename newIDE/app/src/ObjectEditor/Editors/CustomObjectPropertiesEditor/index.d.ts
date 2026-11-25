import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';

export declare const ChildrenOverridingDepreciationAlert: React.ComponentType<
  Record<string, never>
>;

export declare const getVariantName: (
  eventBasedObject: gdEventsBasedObject | null,
  customObjectConfiguration: gdCustomObjectConfiguration
) => string;

export declare const isVariantEditable: (
  customObjectConfiguration: gdCustomObjectConfiguration | null,
  eventsBasedObject: gdEventsBasedObject | null,
  eventsFunctionsExtension: gdEventsFunctionsExtension | null
) => boolean;

export declare const duplicateVariant: (
  newName: string,
  customObjectConfiguration: gdCustomObjectConfiguration | null,
  eventsBasedObject: gdEventsBasedObject | null,
  eventsFunctionsExtension: gdEventsFunctionsExtension | null,
  project: gdProject,
  i18n: I18nType
) => void;

export declare const deleteVariant: (
  customObjectConfiguration: gdCustomObjectConfiguration | null,
  eventsBasedObject: gdEventsBasedObject | null,
  eventsFunctionsExtension: gdEventsFunctionsExtension | null,
  project: gdProject,
  onDeleteEventsBasedObjectVariant:
    | ((
        eventsFunctionsExtension: gdEventsFunctionsExtension,
        eventBasedObject: gdEventsBasedObject,
        variant: gdEventsBasedObjectVariant
      ) => void)
    | null
    | undefined,
  variant: gdEventsBasedObjectVariant | null,
  variantName: string,
  eventsBasedObjectVariantName: string | null
) => void;

declare const CustomObjectPropertiesEditor: React.ComponentType<any>;

export default CustomObjectPropertiesEditor;
