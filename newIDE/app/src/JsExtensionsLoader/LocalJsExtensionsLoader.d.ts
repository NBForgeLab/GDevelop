import type {
  JsExtensionObjectsEditorService,
  JsExtensionObjectsRenderingService,
  JsExtensionsLoader,
} from './index';

type MakeExtensionsLoaderArguments = {
  gd: libGDevelop;
  objectsEditorService: JsExtensionObjectsEditorService | null;
  objectsRenderingService: JsExtensionObjectsRenderingService | null;
  filterExamples: boolean;
  onFindGDJS?: (() => Promise<{ gdjsRoot: string }>) | null | undefined;
};

declare function makeExtensionsLoader(
  args: MakeExtensionsLoaderArguments
): JsExtensionsLoader;

export = makeExtensionsLoader;
