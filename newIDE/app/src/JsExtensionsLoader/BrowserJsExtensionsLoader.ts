import {
  type JsExtensionsLoader,
  type JsExtensionObjectsEditorService,
  type JsExtensionObjectsRenderingService,
  type ExtensionLoadingResult,
  type TranslationFunction,
  loadExtension,
} from '.';
const gd: libGDevelop = global.gd;

// The list of "JsExtension.js" files to be bundled in the webapp, keyed by their extension name.
const jsExtensions = [
  {
    name: 'AdMob',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/AdMob/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'AdvancedWindow',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/AdvancedWindow/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'FacebookInstantGames',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/FacebookInstantGames/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'DeviceSensors',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/DeviceSensors/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'DeviceVibration',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/DeviceVibration/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'SaveState',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/SaveState/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'DebuggerTools',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/DebuggerTools/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Physics2',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Physics2Behavior/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Physics3D',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Physics3DBehavior/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'ExampleJsExtension',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/ExampleJsExtension/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Tween',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/TweenBehavior/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Video',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Video/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'FileSystem',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/FileSystem/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Firebase',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Firebase/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Leaderboards',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Leaderboards/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'PlayerAuthentication',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/PlayerAuthentication/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Multiplayer',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Multiplayer/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'DialogueTree',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/DialogueTree/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'BBText',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/BBText/JsExtension.js'),
    objectsRenderingServiceModules: {
      'pixi-multistyle-text/dist/pixi-multistyle-text.umd': require('GDJS-for-web-app-only/Runtime/Extensions/BBText/pixi-multistyle-text/dist/pixi-multistyle-text.umd'),
    },
  },
  {
    name: 'TileMap',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/TileMap/JsExtension.js'),
    objectsRenderingServiceModules: {
      'pixi-tilemap/dist/pixi-tilemap.umd': require('GDJS-for-web-app-only/Runtime/Extensions/TileMap/pixi-tilemap/dist/pixi-tilemap.umd'),
      'helper/TileMapHelper': require('GDJS-for-web-app-only/Runtime/Extensions/TileMap/helper/TileMapHelper.js'),
      'pako/dist/pako.min': require('GDJS-for-web-app-only/Runtime/Extensions/TileMap/pako/dist/pako.min'),
    },
  },
  {
    name: 'Effects',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Effects/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'P2P',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/P2P/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Lighting',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Lighting/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'SpatialSound',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/SpatialSound/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'BitmapText',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/BitmapText/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Screenshot',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Screenshot/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'TextInput',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/TextInput/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Scene3D',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/3D/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'SpineObject',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Spine/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'Steamworks',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/Steamworks/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
  {
    name: 'NavMeshPathfinding',
    extensionModule: require('GDJS-for-web-app-only/Runtime/Extensions/NavMeshPathfinding/JsExtension.js'),
    objectsRenderingServiceModules: {},
  },
];

const getExpectedNumberOfJSExtensionModules = ({
  filterExamples,
}: {
  filterExamples: boolean;
}): number => {
  return jsExtensions.filter(
    ({ name }) => !filterExamples || !name.includes('Example')
  ).length;
};

type MakeExtensionsLoaderArguments = {
  objectsEditorService: JsExtensionObjectsEditorService | null;
  objectsRenderingService: JsExtensionObjectsRenderingService | null;
  filterExamples: boolean;
};

/**
 * Loader that load all JS extensions required in this file.
 * Extensions are usually auto-discovered when declared in Extensions/xxx/JsExtension.js, but not
 * for the web-app where everything must be bundled.
 */
export default function makeExtensionsLoader({
  objectsEditorService,
  objectsRenderingService,
  filterExamples,
}: MakeExtensionsLoaderArguments): JsExtensionsLoader {
  return {
    loadAllExtensions(_: TranslationFunction): Promise<{
      results: Array<{
        extensionModulePath: string;
        result: ExtensionLoadingResult;
      }>;
      expectedNumberOfJSExtensionModulesLoaded: number;
    }> {
      const results = jsExtensions
        .filter(({ name }) => !filterExamples || !name.includes('Example'))
        .map(({ name, extensionModule, objectsRenderingServiceModules }) => {
          if (
            objectsEditorService &&
            extensionModule.registerEditorConfigurations
          ) {
            extensionModule.registerEditorConfigurations(objectsEditorService);
          }

          if (objectsRenderingService) {
            if (objectsRenderingServiceModules) {
              const modules: Record<string, any> =
                objectsRenderingServiceModules;
              for (const requirePath in modules) {
                objectsRenderingService.registerModule(
                  requirePath,
                  modules[requirePath]
                );
              }
            }
            if (extensionModule.registerInstanceRenderers) {
              extensionModule.registerInstanceRenderers(
                objectsRenderingService
              );
            }
            if (extensionModule.registerClearCache) {
              extensionModule.registerClearCache(objectsRenderingService);
            }
          }

          return {
            extensionModulePath: 'internal-extension://' + name,
            result: loadExtension(_, gd, gd.JsPlatform.get(), extensionModule),
          };
        });
      const expectedNumberOfJSExtensionModulesLoaded =
        getExpectedNumberOfJSExtensionModules({
          filterExamples,
        });

      return Promise.resolve({
        results,
        expectedNumberOfJSExtensionModulesLoaded,
      });
    },
  };
}
