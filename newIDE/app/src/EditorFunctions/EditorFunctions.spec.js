// @flow
import { fakeAssetShortHeader1 } from '../fixtures/GDevelopServicesTestData';
import { PixiResourcesLoaderMock } from '../fixtures/TestPixiResourcesLoader';
import {
  editorFunctions,
  type EditorFunctionGenericOutput,
  type LaunchFunctionOptionsWithProject,
} from './index';

const gd: libGDevelop = global.gd;

// $FlowFixMe[incompatible-type]
// $FlowFixMe[missing-local-annot]
// $FlowFixMe[cannot-resolve-name]
const makeFakeI18n = (fakeI18n): I18nType => ({
  ...fakeI18n,
  _: message => message.id,
});

describe('editorFunctions', () => {
  const makeFakeLaunchFunctionOptionsWithProject = (
    project: gdProject
  ): LaunchFunctionOptionsWithProject => ({
    project,
    args: {},
    i18n: makeFakeI18n(),
    editorCallbacks: {
      onOpenLayout: vi.fn(),
      onCreateProject: vi.fn(),
    },
    relatedAiRequestId: 'fake-ai-request-id',
    getRelatedAiRequestLastMessages: () => ({
      lastUserMessage: null,
      lastAssistantMessages: [],
    }),
    generateEvents: vi.fn(),
    onInstancesModifiedOutsideEditor: vi.fn(),
    onObjectGroupsModifiedOutsideEditor: vi.fn(),
    onSceneEventsModifiedOutsideEditor: vi.fn(),
    toolOptions: {
      includeEventsJson: true,
    },
    ensureExtensionInstalled: vi.fn(),
    searchAndInstallAsset: async ({
      objectsContainer,
      objectName,
      objectType,
    }) => {
      const fakeFoundObjectType = objectType || 'Sprite';
      const isTheFirstOfItsTypeInProject = !gd.UsedObjectTypeFinder.scanProject(
        project,
        fakeFoundObjectType
      );
      const object = objectsContainer.insertNewObject(
        project,
        fakeFoundObjectType,
        objectName,
        objectsContainer.getObjectsCount()
      );

      return Promise.resolve({
        status: 'asset-installed',
        message: 'Object installed',
        createdObjects: [object],
        assetShortHeader: fakeAssetShortHeader1,
        isTheFirstOfItsTypeInProject,
      });
    },
    searchAndInstallResources: async () => {
      return Promise.resolve({
        results: [
          {
            resourceName: 'fake-resource-name',
            resourceKind: 'fake-resource-kind',
            status: 'resource-installed',
          },
        ],
      });
    },
    onObjectsModifiedOutsideEditor: vi.fn(),
    onWillInstallExtension: vi.fn(),
    onExtensionInstalled: vi.fn(),
    getAssetStoreTagForNewObject: () => null,
    PixiResourcesLoader: PixiResourcesLoaderMock,
  });

  describe('create_or_replace_object', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);

      const testSceneObjects = testScene.getObjects();
      testSceneObjects.insertNewObject(
        project,
        'Sprite',
        'Player',
        testSceneObjects.getObjectsCount()
      );

      const globalObjects = project.getObjects();
      globalObjects.insertNewObject(
        project,
        'Sprite',
        'GlobalObjectPlayer',
        globalObjects.getObjectsCount()
      );
    });

    afterEach(() => {
      project.delete();
    });

    it('creates a new object (from scratch, because only object_type was provided)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'TextObject::Text',
            object_name: 'MyNewTextObject',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.message).toMatchSnapshot();
      expect(result.success).toBe(true);
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: true,
      });
    });

    it('creates a new object (from the asset store, with search_terms and object_type provided)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'TextObject::Text',
            object_name: 'MyNewTextObject',
            search_terms: 'Very cool text object',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.message).toMatchSnapshot();
      expect(result.success).toBe(true);
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: true,
      });
    });

    it('creates a new object (from the asset store, with search_terms but without any specified object type)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'SomeNewObject',
            search_terms: 'A very cool sprite for my player in my game',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.message).toMatchSnapshot();
      expect(result.success).toBe(true);
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('creates a new object (from scratch, fallback if not found in the asset store)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          searchAndInstallAsset: async ({
            objectsContainer,
            objectName,
            objectType,
          }) => {
            return Promise.resolve({
              status: 'nothing-found',
              message: 'Object not found',
              createdObjects: [],
              assetShortHeader: null,
              isTheFirstOfItsTypeInProject: false,
            });
          },
          args: {
            scene_name: 'TestScene',
            object_type: 'TextObject::Text',
            object_name: 'MyNewTextObject',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.message).toMatchSnapshot();
      expect(result.success).toBe(true);
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: true,
      });
    });

    it('returns success without creating when object already exists with same type', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'Player',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('returns success when duplicating an existing object (same scene)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'TheNewPlayer',
            duplicated_object_name: 'Player',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(project.getObjects().hasObjectNamed('TheNewPlayer')).toBe(false);
      expect(testScene.getObjects().hasObjectNamed('TheNewPlayer')).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('returns success when duplicating an existing object (and making it global)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'TheNewPlayer',
            duplicated_object_name: 'Player',
            target_object_scope: 'global',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(project.getObjects().hasObjectNamed('TheNewPlayer')).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('TheNewPlayer')).toBe(false);
      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('returns success when duplicating an existing object (from another scene)', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();
      const otherScene = project.insertNewLayout('OtherScene', 1);
      const otherSceneObjects = otherScene.getObjects();
      otherSceneObjects.insertNewObject(
        project,
        'Sprite',
        'OtherScenePlayer',
        otherSceneObjects.getObjectsCount()
      );

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'TheNewPlayer',
            duplicated_object_name: 'OtherScenePlayer',
            duplicated_object_scene: 'OtherScene',
            target_object_scope: 'scene',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(project.getObjects().hasObjectNamed('TheNewPlayer')).toBe(false);
      expect(project.getObjects().hasObjectNamed('OtherScenePlayer')).toBe(
        false
      );
      expect(testScene.getObjects().hasObjectNamed('TheNewPlayer')).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('OtherScenePlayer')).toBe(
        false
      );
      expect(otherScene.getObjects().hasObjectNamed('TheNewPlayer')).toBe(
        false
      );
      expect(otherScene.getObjects().hasObjectNamed('OtherScenePlayer')).toBe(
        true
      );
      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('fails when duplicating an object not existing in another scene', async () => {
      project.insertNewLayout('OtherScene', 1);

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'TheNewPlayer',
            duplicated_object_name: 'DoesNotExist',
            duplicated_object_scene: 'OtherScene',
            target_object_scope: 'scene',
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();
    });

    it('fails when duplicating an object not existing (in the same scene)', async () => {
      project.insertNewLayout('OtherScene', 1);

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'TheNewPlayer',
            duplicated_object_name: 'DoesNotExist',
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();
    });

    it('returns success when replacing an existing object', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'Player',
            replace_existing_object: true,
            search_terms: 'Spaceship, Blue',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(project.getObjects().hasObjectNamed('PlayerReplacement')).toBe(
        false
      );
      expect(project.getObjects().hasObjectNamed('Player')).toBe(false);
      expect(testScene.getObjects().hasObjectNamed('PlayerReplacement')).toBe(
        false
      );
      expect(testScene.getObjects().hasObjectNamed('Player')).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(result.success).toBe(true);
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('returns success when moving an existing object to the global objects', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'Player',
            replace_existing_object: true, // This has no impact.
            target_object_scope: 'global',
            search_terms: '', // This has no impact.
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(project.getObjects().hasObjectNamed('PlayerReplacement')).toBe(
        false
      );
      expect(project.getObjects().hasObjectNamed('Player')).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('PlayerReplacement')).toBe(
        false
      );
      expect(testScene.getObjects().hasObjectNamed('Player')).toBe(false);
      expect(result.message).toMatchSnapshot();
      expect(result.success).toBe(true);
      expect(onObjectsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        isNewObjectTypeUsed: false,
      });
    });

    it('fails when moving a scene object to a global object when there is one already', async () => {
      // Add an object, with the same name as the global object, in the scene
      // so we can try then to move it.
      testScene
        .getObjects()
        .insertNewObject(
          project,
          'Sprite',
          'GlobalObjectPlayer',
          testScene.getObjects().getObjectsCount()
        );

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'GlobalObjectPlayer',
            target_object_scope: 'global',
            search_terms: '', // This has no impact.
          },
        }
      );

      expect(result.message).toMatchSnapshot();
      expect(project.getObjects().hasObjectNamed('GlobalObjectPlayer')).toBe(
        true
      );
      expect(testScene.getObjects().hasObjectNamed('GlobalObjectPlayer')).toBe(
        true
      );
      expect(result.success).toBe(false);
    });

    it('fails when moving an existing global object to a scene', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'GlobalObjectPlayer',
            target_object_scope: 'scene',
            search_terms: '', // This has no impact.
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.message).toMatchSnapshot();
      expect(project.getObjects().hasObjectNamed('GlobalObjectPlayer')).toBe(
        true
      );
      expect(testScene.getObjects().hasObjectNamed('GlobalObjectPlayer')).toBe(
        false
      );
      expect(result.success).toBe(false);
    });

    it('fails when scene does not exist', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'NonExistentScene',
            object_type: 'Sprite',
            object_name: 'Player',
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();
    });

    it('creates a new object via asset_id without object_type', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          searchAndInstallAsset: async ({
            objectsContainer,
            objectName,
            objectType,
          }) => {
            // The helper derives the type from the asset itself.
            const object = objectsContainer.insertNewObject(
              project,
              'Sprite',
              objectName,
              objectsContainer.getObjectsCount()
            );
            return Promise.resolve({
              status: 'asset-installed',
              message: 'Object installed',
              createdObjects: [object],
              assetShortHeader: fakeAssetShortHeader1,
              isTheFirstOfItsTypeInProject: false,
            });
          },
          args: {
            scene_name: 'TestScene',
            object_name: 'MyAssetObject',
            asset_id: fakeAssetShortHeader1.id,
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.success).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('MyAssetObject')).toBe(true);
    });

    it('fails when creating a new object without object_type, search_terms nor asset_id', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MyAssetObject',
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();
    });

    it('replaces an existing object without specifying object_type', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onObjectsModifiedOutsideEditor = vi.fn();

      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'Player',
            replace_existing_object: true,
            search_terms: 'Spaceship, Blue',
          },
          onObjectsModifiedOutsideEditor,
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
    });

    it('fails when object_type conflicts with an existing object type', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'TextObject::Text',
            object_name: 'Player',
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();
    });

    it('reports global scope when creating a global object from scratch', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          searchAndInstallAsset: async () =>
            Promise.resolve({
              status: 'nothing-found',
              message: '',
              createdObjects: [],
              assetShortHeader: null,
              isTheFirstOfItsTypeInProject: false,
            }),
          args: {
            scene_name: 'TestScene',
            object_type: 'TextObject::Text',
            object_name: 'GlobalText',
            target_object_scope: 'global',
          },
        }
      );

      expect(result.success).toBe(true);
      expect(project.getObjects().hasObjectNamed('GlobalText')).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('GlobalText')).toBe(false);
      expect(result.message).toEqual(
        expect.stringContaining(
          'Created object "GlobalText" (type "TextObject::Text", global) from scratch.'
        )
      );
    });

    it('reports global scope when creating a global object from the asset store', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'Sprite',
            object_name: 'GlobalSprite',
            target_object_scope: 'global',
            search_terms: 'cool sprite',
          },
        }
      );

      expect(result.success).toBe(true);
      expect(project.getObjects().hasObjectNamed('GlobalSprite')).toBe(true);
      expect(result.message).toEqual(
        expect.stringContaining(
          'Created object "GlobalSprite" (type "Sprite", global) from asset store.'
        )
      );
    });
  });

  describe('change_object_property', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);

      // Add font resources to the project
      const fontResource1 = new gd.FontResource();
      fontResource1.setName('font1.ttf');
      fontResource1.setFile('font1.ttf');
      const fontResource2 = new gd.FontResource();
      fontResource2.setName('font2.ttf');
      fontResource2.setFile('font2.ttf');
      project.getResourcesManager().addResource(fontResource1);
      project.getResourcesManager().addResource(fontResource2);
      const audioResource1 = new gd.AudioResource();
      audioResource1.setName('audio1.aac');
      audioResource1.setFile('audio1.aac');
      project.getResourcesManager().addResource(audioResource1);

      // Create a TextObject with a font property (resource type)
      const testSceneObjects = testScene.getObjects();
      const textObject = testSceneObjects.insertNewObject(
        project,
        'TextObject::Text',
        'MyTextObject',
        testSceneObjects.getObjectsCount()
      );
      // Set the font property to an existing resource
      textObject.getConfiguration().updateProperty('font', 'font1.ttf');
    });

    afterEach(() => {
      project.delete();
    });

    it('successfully changes a resource property from one existing resource to another', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.change_object_property.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MyTextObject',
            changed_properties: [
              {
                property_name: 'font',
                new_value: 'font2.ttf',
              },
            ],
          },
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();

      // Verify the property was actually changed
      const textObject = testScene.getObjects().getObject('MyTextObject');
      const fontProperty = textObject
        .getConfiguration()
        .getProperties()
        .get('font');
      expect(fontProperty.getValue()).toBe('font2.ttf');
    });

    it('fails when changing a resource property to a non-existing resource', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.change_object_property.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MyTextObject',
            changed_properties: [
              {
                property_name: 'font',
                new_value: 'non-existing-font.ttf',
              },
            ],
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();

      // Verify the property was NOT changed (still the original value)
      const textObject = testScene.getObjects().getObject('MyTextObject');
      const fontProperty = textObject
        .getConfiguration()
        .getProperties()
        .get('font');
      expect(fontProperty.getValue()).toBe('font1.ttf');
    });

    it('fails when changing a resource property to one with a different type', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.change_object_property.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MyTextObject',
            changed_properties: [
              {
                property_name: 'font',
                new_value: 'audio1.aac',
              },
            ],
          },
        }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatchSnapshot();

      // Verify the property was NOT changed (still the original value)
      const textObject = testScene.getObjects().getObject('MyTextObject');
      const fontProperty = textObject
        .getConfiguration()
        .getProperties()
        .get('font');
      expect(fontProperty.getValue()).toBe('font1.ttf');
    });
  });

  describe('change_object_property', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);

      // Add font resources to the project
      const fontResource1 = new gd.FontResource();
      fontResource1.setName('font1.ttf');
      fontResource1.setFile('font1.ttf');
      project.getResourcesManager().addResource(fontResource1);

      // Create a TextObject with a font property (resource type)
      const testSceneObjects = testScene.getObjects();
      const textObject = testSceneObjects.insertNewObject(
        project,
        'TextObject::Text',
        'MyTextObject',
        testSceneObjects.getObjectsCount()
      );
      // Set the font property to an existing resource
      textObject.getConfiguration().updateProperty('font', 'font1.ttf');
    });

    afterEach(() => {
      project.delete();
    });

    it('handles various property types: resource, non-existing, boolean, and number with sanitization warning', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.change_object_property.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MyTextObject',
            changed_properties: [
              // Valid change but a property name with a typo
              {
                property_name: 'Character-size_',
                new_value: '56',
              },
              // Change a choice
              {
                property_name: 'textAlignment',
                new_value: 'INVALID_CHOICE',
              },
              {
                property_name: 'verticalTextAlignment',
                new_value: 'BoTTOm',
              },
              // Try to change a non-existing property
              {
                property_name: 'nonExistingProperty',
                new_value: 'someValue',
              },
              // Change a boolean property with "true"
              {
                property_name: 'bold',
                new_value: 'YES',
              },
              {
                property_name: 'isShadowEnabled',
                new_value: '1',
              },
              // Change a boolean property with "FALSE"
              {
                property_name: 'italic',
                new_value: 'FALSE',
              },
              // Change a number property with a value that will be sanitized
              {
                property_name: 'shadowAngle',
                new_value: '20,40 , 50',
              },
              {
                property_name: 'shadowDistance',
                new_value: '20X   40 X 50',
              },
              {
                property_name: 'shadowBlurRadius',
                new_value: '20.41 × 50',
              },
            ],
          },
        }
      );

      // The operation should succeed overall (some changes were made)
      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();

      // Verify the properties were actually changed
      const textObject = testScene.getObjects().getObject('MyTextObject');
      const properties = textObject.getConfiguration().getProperties();

      expect(properties.get('characterSize').getValue()).toBe('56');
      expect(properties.get('bold').getValue()).toBe('true');
      expect(properties.get('italic').getValue()).toBe('false');
      expect(properties.get('shadowAngle').getValue()).toBe('20');
    });

    it('reports the FINAL renamed name when a collision forces a suffix', async () => {
      // The scene already has another object named "Foo": renaming
      // MyTextObject -> Foo must collide and end up as "Foo2".
      testScene
        .getObjects()
        .insertNewObject(
          project,
          'Sprite',
          'Foo',
          testScene.getObjects().getObjectsCount()
        );

      const result: EditorFunctionGenericOutput = await editorFunctions.change_object_property.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MyTextObject',
            changed_properties: [
              {
                property_name: 'name',
                new_value: 'Foo',
              },
            ],
          },
        }
      );

      expect(result.success).toBe(true);
      // Final name reported is "Foo2", not the requested "Foo".
      expect(result.message).toMatchSnapshot();
      // Original "Foo" still exists; the renamed one is "Foo2".
      expect(testScene.getObjects().hasObjectNamed('Foo')).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('Foo2')).toBe(true);
      expect(testScene.getObjects().hasObjectNamed('MyTextObject')).toBe(false);
    });
  });

  describe('change_behavior_property', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);

      // Create a Sprite object and add a PlatformerObject behavior to it
      const testSceneObjects = testScene.getObjects();
      const spriteObject = testSceneObjects.insertNewObject(
        project,
        'Sprite',
        'MySprite',
        testSceneObjects.getObjectsCount()
      );

      // Add PlatformerObject behavior
      spriteObject.addNewBehavior(
        project,
        'PlatformBehavior::PlatformerObjectBehavior',
        'PlatformerObject'
      );
    });

    afterEach(() => {
      project.delete();
    });

    it('changes behavior properties with warnings for invalid values', async () => {
      const result: EditorFunctionGenericOutput = await editorFunctions.change_behavior_property.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_name: 'MySprite',
            behavior_name: 'PlatformerObject',
            changed_properties: [
              // Change number properties
              {
                property_name: 'GRAVITY',
                new_value: '1500',
              },
              {
                property_name: 'JumpSpeed',
                new_value: '800',
              },
              {
                property_name: 'Max_speed',
                new_value: '300 x 20',
              },
              // Change a boolean property with "true"
              {
                property_name: 'CanGrabPlatforms',
                new_value: 'true',
              },
              // Change a boolean property with "FALSE"
              {
                property_name: 'IgnoreDefaultControls',
                new_value: 'FALSE',
              },
              // Try to change a non-existing property
              {
                property_name: 'nonExistingProperty',
                new_value: 'someValue',
              },
            ],
          },
        }
      );

      // The operation should succeed overall (some changes were made)
      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();

      // Verify the behavior properties were actually changed
      const spriteObject = testScene.getObjects().getObject('MySprite');
      const behavior = spriteObject.getBehavior('PlatformerObject');
      const behaviorProperties = behavior.getProperties();

      expect(behaviorProperties.get('Gravity').getValue()).toBe('1500');
      expect(behaviorProperties.get('JumpSpeed').getValue()).toBe('800');
      expect(behaviorProperties.get('MaxSpeed').getValue()).toBe('300');
      expect(behaviorProperties.get('CanGrabPlatforms').getValue()).toBe(
        'true'
      );
      expect(behaviorProperties.get('IgnoreDefaultControls').getValue()).toBe(
        'false'
      );
    });
  });

  describe('add_scene_events', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);
    });

    afterEach(() => {
      project.delete();
    });

    it('adds events to a scene and installs missing resources', async () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const onSceneEventsModifiedOutsideEditor = vi.fn();
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const searchAndInstallResources = vi.fn().mockResolvedValue({
        results: [
          {
            resourceName: 'explosion.png',
            resourceKind: 'image',
            status: 'resource-installed',
          },
          {
            resourceName: 'explosion.wav',
            resourceKind: 'audio',
            status: 'resource-installed',
          },
        ],
      });
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const ensureExtensionInstalled = vi.fn().mockResolvedValue(undefined);

      const result = await editorFunctions.add_scene_events.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          scene_name: 'TestScene',
          events_description:
            'When the player presses space, play an explosion sound and show an explosion effect',
          extension_names_list: '',
          objects_list: 'Player',
        },
        // $FlowFixMe[underconstrained-implicit-instantiation]
        generateEvents: vi.fn().mockResolvedValue({
          generationCompleted: true,
          aiGeneratedEvent: {
            id: 'test-ai-event-id',
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            userId: 'test-user',
            status: 'ready',
            partialGameProjectJson: '{}',
            eventsDescription:
              'When the player presses space, play an explosion sound and show an explosion effect',
            extensionNamesList: '',
            objectsList: 'Player',
            existingEventsAsText: '',
            existingEventsJson: null,
            existingEventsJsonUserRelativeKey: null,
            resultMessage: 'Successfully added explosion events.',
            changes: [
              {
                operationName: 'insert_at_end',
                operationTargetEvent: null,
                isEventsJsonValid: true,
                generatedEvents: JSON.stringify([
                  {
                    type: 'BuiltinCommonInstructions::Standard',
                    conditions: [],
                    actions: [],
                  },
                ]),
                areEventsValid: true,
                extensionNames: [],
                diagnosticLines: [],
                undeclaredVariables: [],
                undeclaredObjectVariables: {},
                missingObjectBehaviors: {},
                missingResources: [
                  { resourceName: 'explosion.png', resourceKind: 'image' },
                  { resourceName: 'explosion.wav', resourceKind: 'audio' },
                ],
              },
            ],
            error: null,
            stats: null,
          },
        }),
        onSceneEventsModifiedOutsideEditor,
        ensureExtensionInstalled,
        searchAndInstallResources,
      });

      expect(result).toMatchSnapshot();

      expect(onSceneEventsModifiedOutsideEditor).toHaveBeenCalledWith({
        scene: testScene,
        newOrChangedAiGeneratedEventIds: new Set(['test-ai-event-id']),
      });
    });
  });

  describe('add_or_edit_variable', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);

      // A scene-scoped sprite and a global sprite, to exercise the two
      // object-variable scope branches.
      testScene.getObjects().insertNewObject(project, 'Sprite', 'Player', 0);
      project.getObjects().insertNewObject(project, 'Sprite', 'GlobalEnemy', 0);
    });

    afterEach(() => {
      project.delete();
    });

    it('reports scope and new value for a global variable (added)', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'score',
          variable_scope: 'global',
          value: '42',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
    });

    it('reports scope and new value for a scene variable (added)', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'lives',
          variable_scope: 'scene',
          scene_name: 'TestScene',
          value: '3',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
    });

    it('reports scope and new value for a scene-object variable (added)', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'health',
          variable_scope: 'object',
          scene_name: 'TestScene',
          object_name: 'Player',
          value: '100',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
    });

    it('reports scope and new value for a global-object variable (added)', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'speed',
          variable_scope: 'object',
          object_name: 'GlobalEnemy',
          value: '50',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
    });

    it('truncates the value to 200 chars in the success message', async () => {
      const longValue = 'x'.repeat(450);
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'longText',
          variable_scope: 'global',
          value: longValue,
        },
      });

      expect(result.success).toBe(true);
      // 200 'x' kept, then the truncation tag mentioning the remaining 250 chars.
      expect(result.message).toBe(
        `Added global variable "longText" (String) = ${'x'.repeat(
          200
        )}[...truncated - 250 more characters]`
      );
    });

    it('does not truncate when value is exactly 200 chars', async () => {
      const value = 'a'.repeat(200);
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'edgeCase',
          variable_scope: 'global',
          value,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        `Added global variable "edgeCase" (String) = ${value}`
      );
    });

    it('reports the new value when editing an existing variable', async () => {
      const variables = project.getVariables();
      variables.insertNew('greeting', 0).setString('hi');

      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'greeting',
          variable_scope: 'global',
          value: 'hello world',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
    });

    it('creates a structure variable from a JSON object value', async () => {
      const value = '{"hp": 10, "name": "Hero", "alive": true}';
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'stats',
          variable_scope: 'global',
          value,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe(
        `Added global variable "stats" (Structure) = ${value}`
      );

      // The variable is actually persisted as a structure with each child set.
      const variable = project.getVariables().get('stats');
      expect(variable.getType()).toBe(gd.Variable.Structure);
      expect(variable.getChild('hp').getValue()).toBe(10);
      expect(variable.getChild('name').getString()).toBe('Hero');
      expect(variable.getChild('alive').getBool()).toBe(true);
    });

    it('sets a nested field inside an existing structure', async () => {
      // Pre-populate a structure with a child field.
      const variables = project.getVariables();
      const struct = variables.insertNew('player', 0);
      struct.castTo('Structure');
      struct.getChild('hp').setValue(10);

      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'player.hp',
          variable_scope: 'global',
          value: '42',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(struct.getChild('hp').getValue()).toBe(42);
    });

    it('adds a deeply nested structure path (path-based creation)', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'config.audio.volume',
          variable_scope: 'global',
          value: '0.8',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      const config = project.getVariables().get('config');
      expect(config.getType()).toBe(gd.Variable.Structure);
      expect(
        config
          .getChild('audio')
          .getChild('volume')
          .getValue()
      ).toBeCloseTo(0.8);
    });

    it('sets an element of an array variable', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'inventory[2]',
          variable_scope: 'global',
          value: 'Magic Sword',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      const inventory = project.getVariables().get('inventory');
      expect(inventory.getType()).toBe(gd.Variable.Array);
      expect(inventory.getChildrenCount()).toBe(3);
      expect(inventory.getAtIndex(2).getString()).toBe('Magic Sword');
    });

    it('preserves existing sibling fields when editing one field of a structure', async () => {
      // Pre-populate a structure with multiple children to ensure none are lost.
      const variables = project.getVariables();
      const struct = variables.insertNew('player', 0);
      struct.castTo('Structure');
      struct.getChild('hp').setValue(10);
      struct.getChild('name').setString('Hero');
      struct.getChild('alive').setBool(true);

      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'player.hp',
          variable_scope: 'global',
          value: '42',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(struct.getType()).toBe(gd.Variable.Structure);
      expect(struct.getChild('hp').getValue()).toBe(42);
      // Siblings must still be intact (no data loss from cast).
      expect(struct.hasChild('name')).toBe(true);
      expect(struct.getChild('name').getString()).toBe('Hero');
      expect(struct.hasChild('alive')).toBe(true);
      expect(struct.getChild('alive').getBool()).toBe(true);
    });

    it('preserves existing array elements when editing one element', async () => {
      // Pre-populate an array with multiple items to ensure none are lost.
      const variables = project.getVariables();
      const array = variables.insertNew('inventory', 0);
      array.castTo('Array');
      array.pushNew().setString('Sword');
      array.pushNew().setString('Shield');
      array.pushNew().setString('Potion');

      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'inventory[1]',
          variable_scope: 'global',
          value: 'Magic Shield',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      expect(array.getType()).toBe(gd.Variable.Array);
      // Other elements must still be intact (no data loss from cast).
      expect(array.getChildrenCount()).toBe(3);
      expect(array.getAtIndex(0).getString()).toBe('Sword');
      expect(array.getAtIndex(1).getString()).toBe('Magic Shield');
      expect(array.getAtIndex(2).getString()).toBe('Potion');
    });

    it('sets a structure field inside an array element', async () => {
      const result = await editorFunctions.add_or_edit_variable.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          variable_name_or_path: 'players[0].name',
          variable_scope: 'scene',
          scene_name: 'TestScene',
          value: 'Alice',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();
      const players = testScene.getVariables().get('players');
      expect(players.getType()).toBe(gd.Variable.Array);
      const player0 = players.getAtIndex(0);
      expect(player0.getType()).toBe(gd.Variable.Structure);
      expect(player0.getChild('name').getString()).toBe('Alice');
    });
  });

  describe('inspect_object_properties (property listing format)', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);

      const sceneObjects = testScene.getObjects();
      sceneObjects.insertNewObject(
        project,
        'TextObject::Text',
        'MyText',
        sceneObjects.getObjectsCount()
      );
    });

    afterEach(() => {
      project.delete();
    });

    it('formats new object properties: short units, no boolean type tag, empty grouped at end', async () => {
      // The TextObject::Text new-from-scratch path uses `formatPropertiesList`,
      // and is fully populated by GD core - making it a stable check.
      const sceneObjects = testScene.getObjects();
      sceneObjects.removeObject('MyText');

      const result = await editorFunctions.create_or_replace_object.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            object_type: 'TextObject::Text',
            object_name: 'NewText',
          },
          searchAndInstallAsset: async () =>
            Promise.resolve({
              status: 'nothing-found',
              message: '',
              createdObjects: [],
              assetShortHeader: null,
              isTheFirstOfItsTypeInProject: false,
            }),
        }
      );

      expect(result.success).toBe(true);
      // Booleans omit the "(boolean)" tag entirely.
      expect(result.message).toEqual(expect.stringContaining('bold: false,'));
      expect(result.message).not.toEqual(expect.stringContaining('(boolean)'));
      // Pixel units are abbreviated to "(px)" everywhere.
      expect(result.message).toEqual(expect.stringContaining('(px)'));
      expect(result.message).not.toEqual(expect.stringContaining('(Pixel)'));
      // DegreeAngle is abbreviated to "(deg)".
      expect(result.message).toEqual(expect.stringContaining('(deg)'));
      expect(result.message).not.toEqual(
        expect.stringContaining('(DegreeAngle)')
      );
      // Empty properties (here: `font`) are grouped at the end.
      expect(result.message).toEqual(
        expect.stringContaining('Empty: font (resource).')
      );
    });
  });

  describe('put_2d_instances (new-instance attributes in message)', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);
      testScene.getObjects().insertNewObject(project, 'Sprite', 'Player', 0);
    });

    afterEach(() => {
      project.delete();
    });

    it('omits the attributes parenthetical when none of size/rotation/opacity/z-order are specified', async () => {
      const result = await editorFunctions.put_2d_instances.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          scene_name: 'TestScene',
          object_name: 'Player',
          layer_name: '',
          brush_kind: 'point',
          brush_position: '100,200',
          new_instances_count: 1,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toEqual(
        expect.stringContaining(
          'Created 1 new instance of object "Player" using point brush at 100, 200 on layer "base".'
        )
      );
    });

    it('includes size/rotation/opacity/z-order in the new-instance message', async () => {
      const result = await editorFunctions.put_2d_instances.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          scene_name: 'TestScene',
          object_name: 'Player',
          layer_name: '',
          brush_kind: 'point',
          brush_position: '50,60',
          new_instances_count: 2,
          instances_size: '64,64',
          instances_rotation: 45,
          instances_opacity: 128,
          instances_z_order: 5,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toEqual(
        expect.stringContaining(
          'Created 2 new instances of object "Player" using point brush at 50, 60 on layer "base" (size 64x64, rotation 45°, opacity 128/255, z-order 5).'
        )
      );
    });
  });

  describe('put_3d_instances (new-instance attributes in message)', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);
      testScene.getObjects().insertNewObject(project, 'Sprite', 'Player', 0);
    });

    afterEach(() => {
      project.delete();
    });

    it('includes size and rotation in the new-instance message', async () => {
      const result = await editorFunctions.put_3d_instances.launchFunction({
        ...makeFakeLaunchFunctionOptionsWithProject(project),
        args: {
          scene_name: 'TestScene',
          object_name: 'Player',
          layer_name: '',
          brush_kind: 'point',
          brush_position: '10,20,30',
          new_instances_count: 1,
          instances_size: '8,16,24',
          instances_rotation: '15,30,45',
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toEqual(
        expect.stringContaining(
          'Created 1 new instance of object "Player" using point brush at 10, 20, 30 on layer "base" (size 8x16x24, rotation (15°, 30°, 45°)).'
        )
      );
    });
  });

  describe('change_scene_properties_layers_effects_groups (echo new values)', () => {
    let project: gdProject;
    let testScene: gdLayout;

    beforeEach(() => {
      // $FlowFixMe[invalid-constructor]
      project = new gd.ProjectHelper.createNewGDJSProject();
      testScene = project.insertNewLayout('TestScene', 0);
    });

    afterEach(() => {
      project.delete();
    });

    it('echoes the new values for background color and game resolution', async () => {
      const result = await editorFunctions.change_scene_properties_layers_effects_groups.launchFunction(
        {
          ...makeFakeLaunchFunctionOptionsWithProject(project),
          args: {
            scene_name: 'TestScene',
            changed_properties: [
              { property_name: 'backgroundColor', new_value: '#ff0080' },
              { property_name: 'gameResolutionWidth', new_value: '1920' },
              { property_name: 'gameResolutionHeight', new_value: '1080' },
              { property_name: 'stopSoundsOnStartup', new_value: 'true' },
              { property_name: 'gameOrientation', new_value: 'landscape' },
              { property_name: 'gameScaleMode', new_value: 'nearest' },
              { property_name: 'gameName', new_value: 'My Game' },
            ],
          },
        }
      );

      expect(result.success).toBe(true);
      expect(result.message).toMatchSnapshot();

      // The properties are also actually applied to the project.
      expect(project.getGameResolutionWidth()).toBe(1920);
      expect(project.getGameResolutionHeight()).toBe(1080);
      expect(testScene.stopSoundsOnStartup()).toBe(true);
      expect(project.getOrientation()).toBe('landscape');
      expect(project.getScaleMode()).toBe('nearest');
      expect(project.getName()).toBe('My Game');
    });
  });
});
