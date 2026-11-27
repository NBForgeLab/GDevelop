import type { JsExtensionsLoader } from './index';

type ObjectsEditorServiceLike = {
  registerEditorConfiguration: (
    objectType: string,
    editorConfiguration: any
  ) => void;
  editorConfigurations: Record<string, any>;
};

type ObjectsRenderingServiceLike = {
  renderers: Record<string, any>;
  renderers3D: Record<string, any>;
};

type MakeExtensionsLoaderArguments = {
  gd: any;
  objectsEditorService: ObjectsEditorServiceLike | null;
  objectsRenderingService: ObjectsRenderingServiceLike | null;
  filterExamples: boolean;
  onFindGDJS?: (() => Promise<{ gdjsRoot: string }>) | null | undefined;
};

declare function makeExtensionsLoader(
  args: MakeExtensionsLoaderArguments
): JsExtensionsLoader;

export = makeExtensionsLoader;
