import type { JsExtensionsLoader } from './index';
import type ObjectsEditorService from '../ObjectEditor/ObjectsEditorService';
import type ObjectsRenderingService from '../ObjectsRendering/ObjectsRenderingService';

type MakeExtensionsLoaderArguments = {
  gd: any;
  objectsEditorService: typeof ObjectsEditorService;
  objectsRenderingService: typeof ObjectsRenderingService;
  filterExamples: boolean;
  onFindGDJS?: (() => Promise<{ gdjsRoot: string }>) | null | undefined;
};

declare function makeExtensionsLoader(
  args: MakeExtensionsLoaderArguments
): JsExtensionsLoader;

export = makeExtensionsLoader;
