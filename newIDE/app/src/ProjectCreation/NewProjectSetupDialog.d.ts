import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type StorageProvider, type SaveAsLocation } from '../ProjectsStorage';
import { type ExampleShortHeader } from '../Utils/GDevelopServices/Example';
import { type WindowSizeType } from '../UI/Responsive/ResponsiveWindowMeasurer';

export declare const getItemsColumns: (
  windowSize: WindowSizeType,
  isMediumScreen?: boolean
) => number;

export declare const generateProjectName: (
  nameToAppend?: string | null
) => string;

export type NewProjectCreationSource =
  | 'default'
  | 'ai-agent-request'
  | 'mcp'
  | 'course-chapter'
  | 'in-app-tutorial';

export type NewProjectSetup = {
  storageProvider: StorageProvider;
  saveAsLocation: SaveAsLocation | null | undefined;
  projectName?: string;
  height?: number;
  width?: number;
  orientation?: 'landscape' | 'portrait' | 'default';
  optimizeForPixelArt?: boolean;
  forceOpenAskAiEditor?: boolean;
  creationSource: NewProjectCreationSource;
  projectFileUrl?: string | null;
};

export type ExampleProjectSetup = {
  exampleShortHeader: ExampleShortHeader;
  newProjectSetup: NewProjectSetup;
  i18n: I18nType;
};

declare const NewProjectSetupDialog: React.ComponentType<any>;

export default NewProjectSetupDialog;
