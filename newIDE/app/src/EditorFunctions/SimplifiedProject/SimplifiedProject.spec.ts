import { makeSimplifiedProjectBuilder } from './SimplifiedProject';
import { type ExtensionSummary } from './ExtensionSummary';
import { makeTestProject } from '../../fixtures/TestProject';
import { makeTestExtensions } from '../../fixtures/TestExtensions';
import { unserializeFromJSObject } from '../../Utils/Serializer';
import { makeFakeI18n } from '../TestHelpers';
import {
  reloadProjectEventsFunctionsExtensionMetadata,
  type EventsFunctionCodeWriter,
} from '../../EventsFunctionsExtensionsLoader';
import tankConfigurationExtensionJson from '../../fixtures/TankConfigurationExtension.json';
import { type FunctionAuthoringScope } from '../../InstructionOrExpression/EnumeratedInstructionOrExpressionMetadata';

const gd: libGDevelop = global.gd;

const createFakeEventsFunctionCodeWriter = (): EventsFunctionCodeWriter => ({
  getIncludeFileFor: (functionName: string) => `${functionName}.js`,
  writeFunctionCode: () => Promise.resolve(),
  writeBehaviorCode: () => Promise.resolve(),
  writeObjectCode: () => Promise.resolve(),
});

/**
 * An extension with a public and a private free action, with its generated
 * metadata registered in the platform (where the summary reads it from).
 */
const createFakeExtensionWithAPrivateFunction = (
  project: gdProject,
  extensionName: string,
  privateFunctionName: string
) => {
  const extension = project.insertNewEventsFunctionsExtension(
    extensionName,
    project.getEventsFunctionsExtensionsCount()
  );
  extension.setFullName(`The ${extensionName} extension`);
  const publicFunction = extension
    .getEventsFunctions()
    .insertNewEventsFunction('ShowToast', 0);
  publicFunction.setFunctionType(gd.EventsFunction.Action);
  publicFunction.setFullName('Show a toast');
  publicFunction.setSentence('Show a toast');
  const privateFunction = extension
    .getEventsFunctions()
    .insertNewEventsFunction(privateFunctionName, 1);
  privateFunction.setFunctionType(gd.EventsFunction.Action);
  privateFunction.setFullName('Reset the internal state');
  privateFunction.setSentence('Reset the internal state');
  privateFunction.setPrivate(true);

  reloadProjectEventsFunctionsExtensionMetadata(
    project,
    extension,
    createFakeEventsFunctionCodeWriter(),
    makeFakeI18n()
  );
};

describe('SimplifiedProject', () => {
  it('should create a simplified project JSON with global objects and scenes', () => {
    const { project } = makeTestProject(gd);
    const simplifiedJson = makeSimplifiedProjectBuilder(
      gd
    ).getSimplifiedProject(project, {});

    expect(simplifiedJson).toMatchInlineSnapshot(`
{
  "extensions": [
    {
      "description": "My description",
      "extensionName": "My name",
      "freeFunctions": [
        {
          "eventsCount": 1,
          "functionName": "MyTestFunction",
          "functionType": "Action",
          "parameters": [
            {
              "label": "The first object to be used",
              "name": "MyObjectWithoutType",
              "type": "objectList",
            },
            {
              "label": "Some number",
              "name": "MyNumber",
              "type": "expression",
            },
            {
              "label": "Some string",
              "name": "MyString",
              "type": "string",
            },
            {
              "label": "The second object to be used, a sprite",
              "name": "MySpriteObject",
              "type": "objectList",
            },
          ],
        },
        {
          "eventsCount": 0,
          "functionName": "MyTestFunction2",
          "functionType": "Action",
          "parameters": [],
        },
        {
          "eventsCount": 0,
          "functionName": "MyPrivateTestFunction3",
          "functionType": "Action",
          "isPrivate": true,
          "parameters": [],
        },
      ],
      "fullName": "My descriptive name",
      "shortDescription": "",
      "version": "1.1",
    },
    {
      "extensionName": "SomeAlreadyInstalledExtension",
      "fullName": "Some fake already installed extension",
      "shortDescription": "",
      "version": "1.2.3",
    },
    {
      "customObjects": [
        {
          "area": {
            "maxX": 64,
            "maxY": 64,
            "maxZ": 64,
            "minX": 0,
            "minY": 0,
            "minZ": 0,
          },
          "childObjects": [
            {
              "objectName": "Button",
              "objectType": "Button::PanelSpriteButton",
            },
          ],
          "functions": [],
          "hasNoChildInstance": true,
          "instancesDescription": "There are no instances of child objects placed in this variant of the custom object - it is empty.",
          "layers": [
            {
              "isBaseLayer": true,
              "layerName": "",
              "position": 0,
            },
          ],
          "objectName": "ComposedEventBasedObject",
          "properties": [],
        },
        {
          "area": {
            "maxX": 64,
            "maxY": 64,
            "maxZ": 64,
            "minX": 0,
            "minY": 0,
            "minZ": 0,
          },
          "childObjects": [
            {
              "behaviors": [
                {
                  "behaviorName": "Effect",
                  "behaviorType": "EffectCapability::EffectBehavior",
                },
                {
                  "behaviorName": "Opacity",
                  "behaviorType": "OpacityCapability::OpacityBehavior",
                },
                {
                  "behaviorName": "Scale",
                  "behaviorType": "ScalableCapability::ScalableBehavior",
                },
                {
                  "behaviorName": "Text",
                  "behaviorType": "TextContainerCapability::TextContainerBehavior",
                },
              ],
              "objectName": "Label",
              "objectType": "TextObject::Text",
            },
            {
              "behaviors": [
                {
                  "behaviorName": "Effect",
                  "behaviorType": "EffectCapability::EffectBehavior",
                },
                {
                  "behaviorName": "Opacity",
                  "behaviorType": "OpacityCapability::OpacityBehavior",
                },
                {
                  "behaviorName": "Resizable",
                  "behaviorType": "ResizableCapability::ResizableBehavior",
                },
              ],
              "objectName": "Idle",
              "objectType": "PanelSpriteObject::PanelSprite",
            },
            {
              "behaviors": [
                {
                  "behaviorName": "Effect",
                  "behaviorType": "EffectCapability::EffectBehavior",
                },
                {
                  "behaviorName": "Opacity",
                  "behaviorType": "OpacityCapability::OpacityBehavior",
                },
                {
                  "behaviorName": "Resizable",
                  "behaviorType": "ResizableCapability::ResizableBehavior",
                },
              ],
              "objectName": "Hovered",
              "objectType": "PanelSpriteObject::PanelSprite",
            },
            {
              "behaviors": [
                {
                  "behaviorName": "Effect",
                  "behaviorType": "EffectCapability::EffectBehavior",
                },
                {
                  "behaviorName": "Opacity",
                  "behaviorType": "OpacityCapability::OpacityBehavior",
                },
                {
                  "behaviorName": "Resizable",
                  "behaviorType": "ResizableCapability::ResizableBehavior",
                },
              ],
              "objectName": "Pressed",
              "objectType": "PanelSpriteObject::PanelSprite",
            },
          ],
          "functions": [
            {
              "eventsCount": 1,
              "functionName": "MyTestFunction",
              "functionType": "Action",
              "parameters": [],
            },
          ],
          "hasNoChildInstance": true,
          "instancesDescription": "There are no instances of child objects placed in this variant of the custom object - it is empty.",
          "layers": [
            {
              "isBaseLayer": true,
              "layerName": "",
              "position": 0,
            },
          ],
          "objectName": "PanelSpriteButton",
          "properties": [
            {
              "label": "Label offset on Y axis when pressed",
              "propertyName": "PressedLabelOffsetY",
              "type": "number",
            },
            {
              "description": "The left padding of the button",
              "group": "Padding",
              "label": "Left padding",
              "measurementUnit": "Pixel",
              "propertyName": "LeftPadding",
              "type": "number",
            },
            {
              "group": "Padding",
              "label": "Right padding",
              "propertyName": "RightPadding",
              "type": "number",
            },
            {
              "group": "Padding",
              "label": "Top padding",
              "propertyName": "TopPadding",
              "type": "number",
            },
            {
              "group": "Padding",
              "label": "Down padding",
              "propertyName": "DownPadding",
              "type": "number",
            },
          ],
        },
      ],
      "extensionName": "Button",
      "fullName": "",
      "shortDescription": "",
      "version": "1.0.0",
    },
  ],
  "externalEvents": [
    {
      "associatedSceneName": "",
      "eventsCount": 0,
      "externalEventsName": "TestExternalEvents1",
    },
    {
      "associatedSceneName": "",
      "eventsCount": 0,
      "externalEventsName": "TestExternalEvents2",
    },
  ],
  "externalLayouts": [],
  "globalObjectGroups": [],
  "globalObjects": [
    {
      "behaviors": [
        {
          "behaviorName": "Effect",
          "behaviorType": "EffectCapability::EffectBehavior",
        },
        {
          "behaviorName": "Opacity",
          "behaviorType": "OpacityCapability::OpacityBehavior",
        },
        {
          "behaviorName": "Resizable",
          "behaviorType": "ResizableCapability::ResizableBehavior",
        },
      ],
      "objectName": "GlobalTiledSpriteObject",
      "objectType": "TiledSpriteObject::TiledSprite",
    },
    {
      "behaviors": [
        {
          "behaviorName": "Effect",
          "behaviorType": "EffectCapability::EffectBehavior",
        },
        {
          "behaviorName": "Opacity",
          "behaviorType": "OpacityCapability::OpacityBehavior",
        },
        {
          "behaviorName": "Scale",
          "behaviorType": "ScalableCapability::ScalableBehavior",
        },
        {
          "behaviorName": "Text",
          "behaviorType": "TextContainerCapability::TextContainerBehavior",
        },
      ],
      "objectName": "GlobalTextObject",
      "objectType": "TextObject::Text",
    },
  ],
  "globalVariables": [],
  "properties": {
    "firstLayout": "",
    "gameResolutionHeight": 600,
    "gameResolutionWidth": 800,
    "name": "Project",
    "orientation": "landscape",
    "scaleMode": "linear",
  },
  "resources": [
    {
      "file": "fake-image1.png",
      "metadata": undefined,
      "name": "fake-image1.png",
      "type": "image",
    },
    {
      "file": "fake-image2.png",
      "metadata": undefined,
      "name": "fake-image2.png",
      "type": "image",
    },
    {
      "file": "res/icon128.png",
      "metadata": undefined,
      "name": "icon128.png",
      "type": "image",
    },
    {
      "file": "res/powered-pixijs.png",
      "metadata": undefined,
      "name": "pixi",
      "type": "image",
    },
    {
      "file": "fake-audio1.mp3",
      "metadata": undefined,
      "name": "fake-audio1.mp3",
      "type": "audio",
    },
    {
      "file": "fake-video1.mp4",
      "metadata": undefined,
      "name": "fake-video1.mp4",
      "type": "video",
    },
    {
      "file": "fake-video2.mp4",
      "metadata": undefined,
      "name": "fake-video2.mp4",
      "type": "video",
    },
    {
      "file": "font.ttf",
      "metadata": undefined,
      "name": "font.ttf",
      "type": "font",
    },
    {
      "file": "bmfont.xml",
      "metadata": undefined,
      "name": "bmfont.xml",
      "type": "bitmapFont",
    },
    {
      "file": "super-font.fnt",
      "metadata": undefined,
      "name": "super-font.fnt",
      "type": "bitmapFont",
    },
    {
      "file": "levelData.json",
      "metadata": undefined,
      "name": "levelData.json",
      "type": "json",
    },
    {
      "file": "InventoryData.json",
      "metadata": undefined,
      "name": "InventoryData.json",
      "type": "json",
    },
    {
      "file": "text-data.json",
      "metadata": undefined,
      "name": "text-data.json",
      "type": "json",
    },
  ],
  "scenes": [
    {
      "instancesOnSceneDescription": "On the scene, there are:
- on layer "GUI":
  - Nothing (no instances)
- on layer "OtherLayer":
  - Nothing (no instances)
- on base layer:
  - 1 CubeObject
  - 1 TextInputObject
  - 1 MySpriteObject

Inspect instances on the scene to get more details if needed.",
      "layers": [
        {
          "isBaseLayer": undefined,
          "layerName": "GUI",
          "position": 0,
        },
        {
          "isBaseLayer": undefined,
          "layerName": "OtherLayer",
          "position": 1,
        },
        {
          "isBaseLayer": true,
          "layerName": "",
          "position": 2,
        },
      ],
      "objectGroups": [
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectGroupName": "GroupOfSprites",
          "objectGroupType": "Sprite",
          "objectNames": [
            "MySpriteObject",
          ],
          "variables": [
            {
              "type": "String",
              "value": "A multiline
str value",
              "variableName": "ObjectVariable",
            },
            {
              "type": "Structure",
              "variableChildren": [
                {
                  "type": "Number",
                  "value": "564",
                  "variableName": "ObjectChild1",
                },
                {
                  "type": "String",
                  "value": "Guttentag",
                  "variableName": "ObjectChild2",
                },
                {
                  "type": "Boolean",
                  "value": "True",
                  "variableName": "ObjectChild3",
                },
                {
                  "type": "Array",
                  "variableChildren": [
                    {
                      "type": "Number",
                      "value": "856.5",
                      "variableName": "0",
                    },
                  ],
                  "variableName": "ObjectChild4",
                },
              ],
              "variableName": "OtherObjectVariable",
            },
          ],
        },
        {
          "behaviors": [
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectGroupName": "GroupOfObjects",
          "objectGroupType": "",
          "objectNames": [
            "MySpriteObject",
            "MyTextObject",
          ],
          "variables": undefined,
        },
        {
          "behaviors": [
            {
              "behaviorName": "Anchor",
              "behaviorType": "AnchorBehavior::AnchorBehavior",
            },
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Draggable",
              "behaviorType": "DraggableBehavior::Draggable",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "PlatformerObject",
              "behaviorType": "PlatformBehavior::PlatformerObjectBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectGroupName": "GroupOfSpriteObjectsWithBehaviors",
          "objectGroupType": "Sprite",
          "objectNames": [
            "MySpriteObjectWithBehaviors",
          ],
          "variables": undefined,
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectGroupName": "MyGroupWithObjectsHavingLongName",
          "objectGroupType": "Sprite",
          "objectNames": [
            "MySpriteObject",
            "MySpriteObject_With_A_Veeeerrryyyyyyyyy_Looooooooooooong_Name",
            "MySpriteObjectWithoutBehaviors",
          ],
          "variables": undefined,
        },
        {
          "behaviors": undefined,
          "objectGroupName": "EmptyGroup",
          "objectGroupType": "",
          "objectNames": [],
          "variables": undefined,
        },
      ],
      "objects": [
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MySpriteObjectWithEffects",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MySpriteObjectWithoutEffect",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MySpriteObjectWithoutBehaviors",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Anchor",
              "behaviorType": "AnchorBehavior::AnchorBehavior",
            },
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Draggable",
              "behaviorType": "DraggableBehavior::Draggable",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "PlatformerObject",
              "behaviorType": "PlatformBehavior::PlatformerObjectBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MySpriteObjectWithBehaviors",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MyEmptySpriteObject",
          "objectType": "Sprite",
        },
        {
          "animationNames": "My animation, My other animation, (animation without name, animation index is: 2)",
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MySpriteObject",
          "objectType": "Sprite",
          "objectVariables": [
            {
              "type": "String",
              "value": "A multiline
str value",
              "variableName": "ObjectVariable",
            },
            {
              "type": "Structure",
              "variableChildren": [
                {
                  "type": "Number",
                  "value": "564",
                  "variableName": "ObjectChild1",
                },
                {
                  "type": "String",
                  "value": "Guttentag",
                  "variableName": "ObjectChild2",
                },
                {
                  "type": "Boolean",
                  "value": "True",
                  "variableName": "ObjectChild3",
                },
                {
                  "type": "Array",
                  "variableChildren": [
                    {
                      "type": "Number",
                      "value": "856.5",
                      "variableName": "0",
                    },
                  ],
                  "variableName": "ObjectChild4",
                },
              ],
              "variableName": "OtherObjectVariable",
            },
          ],
        },
        {
          "behaviors": [
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
          ],
          "objectName": "MyPanelSpriteObject",
          "objectType": "PanelSpriteObject::PanelSprite",
        },
        {
          "objectName": "TextInputObject",
          "objectType": "FakeTextInput::TextInput",
        },
        {
          "objectName": "CubeObject",
          "objectType": "FakeScene3D::Cube3DObject",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
          ],
          "objectName": "MyTiledSpriteObject",
          "objectType": "TiledSpriteObject::TiledSprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
          ],
          "objectName": "MyParticleEmitter",
          "objectType": "ParticleSystem::ParticleEmitter",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
            {
              "behaviorName": "Text",
              "behaviorType": "TextContainerCapability::TextContainerBehavior",
            },
          ],
          "objectName": "MyTextObject",
          "objectType": "TextObject::Text",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MyShapePainterObject",
          "objectType": "PrimitiveDrawing::Drawer",
        },
        {
          "objectName": "MyButton",
          "objectType": "Button::PanelSpriteButton",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "MySpriteObject_With_A_Veeeerrryyyyyyyyy_Looooooooooooong_Name",
          "objectType": "Sprite",
        },
        {
          "objectName": "MyFakeObjectWithUnsupportedCapability",
          "objectType": "FakeObjectWithUnsupportedCapability::FakeObjectWithUnsupportedCapability",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "VirtualControls",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "VirtualControls1",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "VirtualControls2",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "VirtualControls3",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "VirtualControls4",
          "objectType": "Sprite",
        },
        {
          "behaviors": [
            {
              "behaviorName": "Animation",
              "behaviorType": "AnimatableCapability::AnimatableBehavior",
            },
            {
              "behaviorName": "Effect",
              "behaviorType": "EffectCapability::EffectBehavior",
            },
            {
              "behaviorName": "Flippable",
              "behaviorType": "FlippableCapability::FlippableBehavior",
            },
            {
              "behaviorName": "Opacity",
              "behaviorType": "OpacityCapability::OpacityBehavior",
            },
            {
              "behaviorName": "Resizable",
              "behaviorType": "ResizableCapability::ResizableBehavior",
            },
            {
              "behaviorName": "Scale",
              "behaviorType": "ScalableCapability::ScalableBehavior",
            },
          ],
          "objectName": "VirtualControls5",
          "objectType": "Sprite",
        },
      ],
      "sceneName": "TestLayout",
      "sceneVariables": [
        {
          "type": "String",
          "value": "A multiline
str value",
          "variableName": "Variable1",
        },
        {
          "type": "String",
          "value": "123456",
          "variableName": "Variable2",
        },
        {
          "type": "Structure",
          "variableChildren": [
            {
              "type": "String",
              "value": "Child1 str value",
              "variableName": "Child1",
            },
            {
              "type": "String",
              "value": "7891011",
              "variableName": "Child2",
            },
            {
              "type": "Structure",
              "variableChildren": [
                {
                  "type": "String",
                  "value": "Hello
Multiline
World",
                  "variableName": "SubChild1",
                },
              ],
              "variableName": "FoldedChild",
            },
          ],
          "variableName": "Variable3",
        },
        {
          "type": "Array",
          "variableChildren": [
            {
              "type": "String",
              "value": "String value
with Multiline",
              "variableName": "0",
            },
            {
              "type": "Number",
              "value": "4539.42",
              "variableName": "1",
            },
            {
              "type": "Boolean",
              "value": "True",
              "variableName": "2",
            },
          ],
          "variableName": "FoldedArray",
        },
        {
          "type": "Array",
          "variableChildren": [
            {
              "type": "String",
              "value": "PlayerName",
              "variableName": "0",
            },
            {
              "type": "Number",
              "value": "25",
              "variableName": "1",
            },
            {
              "type": "Boolean",
              "value": "False",
              "variableName": "2",
            },
          ],
          "variableName": "OtherArray",
        },
      ],
    },
    {
      "instancesOnSceneDescription": "There are no instances of objects placed on the scene - the scene is empty.",
      "layers": [
        {
          "isBaseLayer": true,
          "layerName": "",
          "position": 0,
        },
      ],
      "objectGroups": [],
      "objects": [],
      "sceneName": "EmptyLayout",
      "sceneVariables": [],
    },
    {
      "instancesOnSceneDescription": "There are no instances of objects placed on the scene - the scene is empty.",
      "layers": [
        {
          "isBaseLayer": true,
          "layerName": "",
          "position": 0,
        },
      ],
      "objectGroups": [],
      "objects": [],
      "sceneName": "Layout with a very looooooooong naaaaame to test in the project manager",
      "sceneVariables": [],
    },
  ],
}
`);
  });

  it('lists the external events of the scene it is scoped to, and those of no scene', () => {
    const project = gd.ProjectHelper.createNewGDJSProject();
    project.insertNewLayout('Level', 0);
    project.insertNewLayout('Menu', 1);
    project
      .insertNewExternalEvents('LevelLogic', 0)
      .setAssociatedLayout('Level');
    project.insertNewExternalEvents('MenuLogic', 1).setAssociatedLayout('Menu');
    project
      .insertNewExternalEvents('Shared', 2)
      .getEvents()
      .insertNewEvent(project, 'BuiltinCommonInstructions::Standard', 0);

    const { externalEvents } = makeSimplifiedProjectBuilder(
      gd
    ).getSimplifiedProject(project, { scopeToScene: 'Level' });

    expect(externalEvents).toEqual([
      {
        externalEventsName: 'LevelLogic',
        associatedSceneName: 'Level',
        eventsCount: 0,
      },
      { externalEventsName: 'Shared', associatedSceneName: '', eventsCount: 1 },
    ]);
    project.delete();
  });

  it('should include summaries of project specific extensions', () => {
    makeTestExtensions(gd);

    const project = gd.ProjectHelper.createNewGDJSProject();
    // Mimic the test extension "FakeBehavior" was created from a project extension:
    project.insertNewEventsFunctionsExtension('FakeBehavior', 0);

    const projectSpecificExtensionsSummary =
      makeSimplifiedProjectBuilder(gd).getProjectSpecificExtensionsSummary(
        project
      );

    expect(projectSpecificExtensionsSummary).toMatchInlineSnapshot(`
{
  "extensionSummaries": [
    {
      "behaviors": {
        "FakeBehavior::FakeBehavior": {
          "actions": [],
          "conditions": [],
          "description": "A fake behavior with two properties.",
          "expressions": [
            {
              "description": "Some expression returning a number",
              "parameters": [
                {
                  "description": "First parameter (number)",
                  "type": "number",
                },
              ],
              "type": "SomethingReturningNumberWith1NumberParam",
            },
            {
              "description": "Some expression returning a string",
              "parameters": [
                {
                  "description": "First parameter (number)",
                  "type": "number",
                },
              ],
              "type": "SomethingReturningStringWith1NumberParam",
            },
          ],
          "fullName": "Fake behavior with two properties",
          "name": "FakeBehavior::FakeBehavior",
          "properties": [
            {
              "description": "",
              "label": "Property 1",
              "name": "property1",
              "type": "",
            },
            {
              "description": "A description for property 2",
              "name": "property2",
              "type": "Boolean",
            },
          ],
          "sharedProperties": [],
        },
      },
      "description": "A fake extension with a fake behavior containing 2 properties.",
      "dimension": "",
      "effects": {},
      "extensionFullName": "Fake extension with a fake behavior",
      "extensionName": "FakeBehavior",
      "freeActions": [],
      "freeConditions": [],
      "freeExpressions": [],
      "objects": {},
      "shortDescription": "Fake behavior with two properties",
    },
  ],
}
`);

    project.delete();
  });

  it('should include summaries of project specific extensions with events based objects', () => {
    makeTestExtensions(gd);

    const { project } = makeTestProject(gd);

    const projectSpecificExtensionsSummary =
      makeSimplifiedProjectBuilder(gd).getProjectSpecificExtensionsSummary(
        project
      );

    const buttonExtensionSummary =
      projectSpecificExtensionsSummary.extensionSummaries.find(
        (extensionSummary) => extensionSummary.extensionName === 'Button'
      );

    expect(buttonExtensionSummary).toMatchInlineSnapshot(`
{
  "behaviors": {},
  "description": "Fake event-based object (long description)",
  "dimension": "2D",
  "effects": {},
  "extensionFullName": "Fake event-based object",
  "extensionName": "Button",
  "freeActions": [],
  "freeConditions": [],
  "freeExpressions": [],
  "objects": {
    "Button::PanelSpriteButton": {
      "actions": [],
      "conditions": [],
      "description": "A fake button made with a panel sprite and events.",
      "expressions": [],
      "fullName": "PanelSpriteButton",
      "name": "Button::PanelSpriteButton",
      "properties": [
        {
          "description": "",
          "label": "Label offset on Y axis when pressed",
          "name": "PressedLabelOffsetY",
          "type": "number",
        },
        {
          "description": "The left padding of the button",
          "group": "Padding",
          "label": "Left padding",
          "measurementUnit": {
            "name": "Pixel",
          },
          "name": "LeftPadding",
          "type": "number",
        },
        {
          "description": "",
          "group": "Padding",
          "label": "Right padding",
          "name": "RightPadding",
          "type": "number",
        },
        {
          "description": "",
          "group": "Padding",
          "label": "Top padding",
          "name": "TopPadding",
          "type": "number",
        },
        {
          "description": "",
          "group": "Padding",
          "label": "Down padding",
          "name": "DownPadding",
          "type": "number",
        },
      ],
    },
  },
  "shortDescription": "Fake event-based object",
}
`);

    project.delete();
  });

  describe('project specific extensions summary', () => {
    it('describes the private functions of one extension only when asked', () => {
      const project = gd.ProjectHelper.createNewGDJSProject();
      createFakeExtensionWithAPrivateFunction(
        project,
        'MyExt',
        'ResetInternalState'
      );
      createFakeExtensionWithAPrivateFunction(
        project,
        'OtherExt',
        'ResetOtherInternalState'
      );

      const simplifiedProjectBuilder = makeSimplifiedProjectBuilder(gd);
      const getFreeActionTypes = (
        extensionsSummary: { extensionSummaries: Array<ExtensionSummary> },
        extensionName: string
      ): Array<string> => {
        const extensionSummary = extensionsSummary.extensionSummaries.find(
          (summary) => summary.extensionName === extensionName
        );
        if (!extensionSummary) {
          throw new Error(`No summary for the extension "${extensionName}".`);
        }
        return extensionSummary.freeActions.map((action) => action.type);
      };

      // By default, a private function is not described: it can't be used
      // from outside its extension.
      const summaryWithoutPrivate =
        simplifiedProjectBuilder.getProjectSpecificExtensionsSummary(project);
      expect(getFreeActionTypes(summaryWithoutPrivate, 'MyExt')).toEqual([
        'MyExt::ShowToast',
      ]);

      // Writing events inside "MyExt" can use its own private functions, but
      // not the private functions of the other extensions.
      const summaryWithPrivate =
        simplifiedProjectBuilder.getProjectSpecificExtensionsSummary(project, {
          authoringScope: { extensionName: 'MyExt' },
        });
      expect(getFreeActionTypes(summaryWithPrivate, 'MyExt').sort()).toEqual([
        'MyExt::ResetInternalState',
        'MyExt::ShowToast',
      ]);
      expect(getFreeActionTypes(summaryWithPrivate, 'OtherExt')).toEqual([
        'OtherExt::ShowToast',
      ]);

      project.delete();
    });

    it('says whether each function is asynchronous (for `await` in EventScript)', () => {
      const project = gd.ProjectHelper.createNewGDJSProject();
      createFakeExtensionWithAPrivateFunction(project, 'MyExt', 'Reload');
      const extension = project.getEventsFunctionsExtension('MyExt');
      extension.getEventsFunctions().getEventsFunction('Reload').setAsync(true);
      reloadProjectEventsFunctionsExtensionMetadata(
        project,
        extension,
        createFakeEventsFunctionCodeWriter(),
        makeFakeI18n()
      );

      const summary = makeSimplifiedProjectBuilder(
        gd
      ).getProjectSpecificExtensionsSummary(project, {
        authoringScope: { extensionName: 'MyExt' },
      });
      const extensionSummary = summary.extensionSummaries.find(
        (candidate) => candidate.extensionName === 'MyExt'
      );
      if (!extensionSummary) throw new Error('No summary for MyExt.');
      expect(
        extensionSummary.freeActions
          .map((action) => [action.type, action.isAsync])
          .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
      ).toEqual([
        ['MyExt::Reload', true],
        ['MyExt::ShowToast', false],
      ]);

      project.delete();
    });

    describe('private members of the extension being authored', () => {
      /**
       * An extension with a private member of each kind (free function, behavior
       * method, object method, and a whole private behavior), with its generated
       * metadata registered in the platform (where the summary reads it from).
       */
      const createCombatExtension = (project: gdProject) => {
        const extension = project.insertNewEventsFunctionsExtension(
          'Combat',
          0
        );
        extension.setFullName('Combat');

        const addAction = (
          eventsFunctions: gdEventsFunctionsContainer,
          name: string,
          {
            isPrivate,
          }: {
            isPrivate: boolean;
          }
        ) => {
          const eventsFunction = eventsFunctions.insertNewEventsFunction(
            name,
            eventsFunctions.getEventsFunctionsCount()
          );
          eventsFunction.setFunctionType(gd.EventsFunction.Action);
          eventsFunction.setFullName(name);
          eventsFunction.setSentence(name);
          eventsFunction.setPrivate(isPrivate);
        };

        addAction(extension.getEventsFunctions(), 'ShowToast', {
          isPrivate: false,
        });
        addAction(extension.getEventsFunctions(), 'ResetInternalState', {
          isPrivate: true,
        });

        const health = extension
          .getEventsBasedBehaviors()
          .insertNew('Health', 0);
        health.setFullName('Health');
        addAction(health.getEventsFunctions(), 'Damage', { isPrivate: false });
        addAction(health.getEventsFunctions(), 'RecomputeInternals', {
          isPrivate: true,
        });
        gd.WholeProjectRefactorer.ensureBehaviorEventsFunctionsProperParameters(
          extension,
          health
        );

        const shield = extension
          .getEventsBasedBehaviors()
          .insertNew('Shield', 1);
        shield.setFullName('Shield');
        addAction(shield.getEventsFunctions(), 'Absorb', { isPrivate: false });
        gd.WholeProjectRefactorer.ensureBehaviorEventsFunctionsProperParameters(
          extension,
          shield
        );

        const internals = extension
          .getEventsBasedBehaviors()
          .insertNew('Internals', 2);
        internals.setFullName('Internals');
        internals.setPrivate(true);
        addAction(internals.getEventsFunctions(), 'Tick', { isPrivate: false });
        gd.WholeProjectRefactorer.ensureBehaviorEventsFunctionsProperParameters(
          extension,
          internals
        );

        const healthBar = extension
          .getEventsBasedObjects()
          .insertNew('HealthBar', 0);
        healthBar.setFullName('Health bar');
        healthBar.setDefaultName('HealthBar');
        addAction(healthBar.getEventsFunctions(), 'Refresh', {
          isPrivate: false,
        });
        addAction(healthBar.getEventsFunctions(), 'RecomputeLayout', {
          isPrivate: true,
        });
        gd.WholeProjectRefactorer.ensureObjectEventsFunctionsProperParameters(
          extension,
          healthBar
        );

        reloadProjectEventsFunctionsExtensionMetadata(
          project,
          extension,
          createFakeEventsFunctionCodeWriter(),
          makeFakeI18n()
        );
      };

      let project: gdProject;
      beforeEach(() => {
        project = gd.ProjectHelper.createNewGDJSProject();
        createCombatExtension(project);
      });
      afterEach(() => {
        project.delete();
      });

      const getCombatSummary = (
        authoringScope: FunctionAuthoringScope | null
      ): Record<string, any> => {
        const summary = makeSimplifiedProjectBuilder(
          gd
        ).getProjectSpecificExtensionsSummary(project, { authoringScope });
        const combatSummary = summary.extensionSummaries.find(
          (candidate) => candidate.extensionName === 'Combat'
        );
        if (!combatSummary) throw new Error('No summary for Combat.');
        return combatSummary;
      };

      const getActionTypes = (
        actions: Array<Record<string, any>>
      ): Array<string> => actions.map((action) => action.type).sort();

      // The scopes from which the extension can be authored.
      const authoringFreeFunction: FunctionAuthoringScope = {
        extensionName: 'Combat',
      };
      const authoringHealth: FunctionAuthoringScope = {
        extensionName: 'Combat',
        customBehaviorName: 'Health',
      };
      const authoringShield: FunctionAuthoringScope = {
        extensionName: 'Combat',
        customBehaviorName: 'Shield',
      };
      const authoringHealthBar: FunctionAuthoringScope = {
        extensionName: 'Combat',
        customObjectName: 'HealthBar',
      };

      it('describes a private free function everywhere in its extension', () => {
        // From a scene: only the public free function.
        expect(getActionTypes(getCombatSummary(null).freeActions)).toEqual([
          'Combat::ShowToast',
        ]);

        // From anywhere in the extension, including its behaviors and objects.
        [
          authoringFreeFunction,
          authoringHealth,
          authoringShield,
          authoringHealthBar,
        ].forEach((authoringScope) => {
          expect(
            getActionTypes(getCombatSummary(authoringScope).freeActions)
          ).toEqual(['Combat::ResetInternalState', 'Combat::ShowToast']);
        });
      });

      it('describes the private method of a behavior only while authoring this behavior', () => {
        expect(
          getActionTypes(
            getCombatSummary(authoringHealth).behaviors['Combat::Health']
              .actions
          )
        ).toEqual([
          'Combat::Health::Damage',
          'Combat::Health::RecomputeInternals',
        ]);

        // Being in the same extension is not enough: another behavior, a free
        // function or a scene only see the public method.
        [
          authoringShield,
          authoringFreeFunction,
          authoringHealthBar,
          null,
        ].forEach((authoringScope) => {
          expect(
            getActionTypes(
              getCombatSummary(authoringScope).behaviors['Combat::Health']
                .actions
            )
          ).toEqual(['Combat::Health::Damage']);
        });
      });

      it('describes the private method of a custom object only while authoring this object', () => {
        // Custom objects also declare the actions of their capabilities: only
        // look at the methods declared by the extension.
        const getDeclaredObjectActionTypes = (
          authoringScope: FunctionAuthoringScope | null
        ): Array<string> =>
          getActionTypes(
            getCombatSummary(authoringScope).objects['Combat::HealthBar']
              .actions
          ).filter(
            (type) =>
              type === 'Combat::HealthBar::Refresh' ||
              type === 'Combat::HealthBar::RecomputeLayout'
          );

        expect(getDeclaredObjectActionTypes(authoringHealthBar)).toEqual([
          'Combat::HealthBar::RecomputeLayout',
          'Combat::HealthBar::Refresh',
        ]);

        // Being in the same extension is not enough: another custom object, a
        // behavior, a free function or a scene only see the public method.
        [authoringHealth, authoringFreeFunction, null].forEach(
          (authoringScope) => {
            expect(getDeclaredObjectActionTypes(authoringScope)).toEqual([
              'Combat::HealthBar::Refresh',
            ]);
          }
        );
      });

      it('describes the public method of a private behavior within its extension only', () => {
        // A private behavior is not usable outside of its extension.
        expect(getCombatSummary(null).behaviors['Combat::Internals']).toBe(
          undefined
        );

        // Inside the extension, its public methods are usable.
        [authoringFreeFunction, authoringHealth, authoringHealthBar].forEach(
          (authoringScope) => {
            expect(
              getActionTypes(
                getCombatSummary(authoringScope).behaviors['Combat::Internals']
                  .actions
              )
            ).toEqual(['Combat::Internals::Tick']);
          }
        );
      });

      it('describes no private member of another extension', () => {
        createFakeExtensionWithAPrivateFunction(
          project,
          'OtherExt',
          'ResetOtherInternalState'
        );

        const summary = makeSimplifiedProjectBuilder(
          gd
        ).getProjectSpecificExtensionsSummary(project, {
          authoringScope: authoringHealth,
        });
        const otherExtensionSummary = summary.extensionSummaries.find(
          (candidate) => candidate.extensionName === 'OtherExt'
        );
        if (!otherExtensionSummary) throw new Error('No summary for OtherExt.');
        expect(getActionTypes(otherExtensionSummary.freeActions)).toEqual([
          'OtherExt::ShowToast',
        ]);
      });
    });
  });

  describe('extensions', () => {
    // An authored extension covering every declaration kind of the contract.
    const makeProjectWithCombatExtension = (): gdProject => {
      const project = gd.ProjectHelper.createNewGDJSProject();
      const extension = project.insertNewEventsFunctionsExtension('Combat', 0);
      extension.setFullName('Combat');
      extension.setShortDescription('Combat helpers');
      extension.setDescription('Behaviors and objects for combat.');
      extension.setCategory('Game mechanic');
      extension.getTags().push_back('combat');
      extension.getTags().push_back('health');
      extension.setVersion('1.0.0');
      extension.setAuthor('Me');
      extension.getGlobalVariables().insertNew('KillCount', 0).setValue(0);
      extension.getSceneVariables().insertNew('WaveIndex', 0).setValue(1);
      const dependency = extension.addDependency();
      dependency.setName('SomeNpmPackage');
      dependency.setDependencyType('npm');
      dependency.setExportName('some-npm-package');
      dependency.setVersion('2.0.0');

      const behavior = extension
        .getEventsBasedBehaviors()
        .insertNew('Patrol', 0);
      behavior.setFullName('Patrol');
      behavior.setDescription('Moves between points.');
      behavior
        .getPropertyDescriptors()
        .insertNew('Speed', 0)
        .setType('Number')
        .setValue('100')
        .setLabel('Speed')
        .setDescription('Pixels per second');
      behavior
        .getPropertyDescriptors()
        .insertNew('Mode', 1)
        .setType('Choice')
        .setValue('Loop')
        .addChoice('Loop', 'Loop')
        .addChoice('Once', 'Once');
      behavior
        .getSharedPropertyDescriptors()
        .insertNew('DebugLayer', 0)
        .setType('Layer')
        .setLabel('Debug layer');
      behavior
        .getEventsFunctions()
        .insertNewEventsFunction('doStepPreEvents', 0);
      const patrolAction = behavior
        .getEventsFunctions()
        .insertNewEventsFunction('GoTo', 1);
      patrolAction.setFunctionType(gd.EventsFunction.Action);
      patrolAction.setFullName('Go to a point');
      patrolAction.setSentence('Move _PARAM0_ to _PARAM2_;_PARAM3_');
      gd.WholeProjectRefactorer.ensureBehaviorEventsFunctionsProperParameters(
        extension,
        behavior
      );
      patrolAction
        .getParameters()
        .insertNewParameter('TargetX', 2)
        .setType('expression')
        .setDescription('Target X');
      patrolAction
        .getParameters()
        .insertNewParameter('TargetY', 3)
        .setType('expression')
        .setDescription('Target Y')
        .setOptional(true);

      const healthBar = extension
        .getEventsBasedObjects()
        .insertNew('HealthBar', 0);
      healthBar.setFullName('Health bar');
      healthBar.setDefaultName('HealthBar');
      healthBar.setAreaMaxX(200);
      healthBar.setAreaMaxY(20);
      healthBar
        .getObjects()
        .insertNewObject(project, 'Sprite', 'Background', 0);
      healthBar
        .getObjects()
        .insertNewObject(project, 'Sprite', 'Fill', 1)
        .getVariables()
        .insertNew('Ratio', 0)
        .setValue(1);
      const group = healthBar
        .getObjects()
        .getObjectGroups()
        .insertNew('Parts', 0);
      group.addObject('Background');
      group.addObject('Fill');
      healthBar
        .getPropertyDescriptors()
        .insertNew('MaxValue', 0)
        .setType('Number')
        .setValue('100')
        .setLabel('Maximum value');
      healthBar.getEventsFunctions().insertNewEventsFunction('onCreated', 0);
      const getValue = healthBar
        .getEventsFunctions()
        .insertNewEventsFunction('Value', 1);
      getValue.setFunctionType(gd.EventsFunction.ExpressionAndCondition);
      getValue.getExpressionType().setName('number');
      gd.WholeProjectRefactorer.ensureObjectEventsFunctionsProperParameters(
        extension,
        healthBar
      );
      const instance = healthBar
        .getInitialInstances()
        .insertNewInitialInstance();
      instance.setObjectName('Background');
      const largeVariant = healthBar.getVariants().insertNewVariant('Large', 0);
      largeVariant.setAreaMaxX(400);
      largeVariant.setAreaMaxY(40);
      largeVariant.setAssetStoreAssetId('asset-id-1');
      gd.EventsBasedObjectVariantHelper.complyVariantsToEventsBasedObject(
        project,
        healthBar
      );

      const computeDamage = extension
        .getEventsFunctions()
        .insertNewEventsFunction('ComputeDamage', 0);
      computeDamage.setFunctionType(gd.EventsFunction.Expression);
      computeDamage.getExpressionType().setName('number');
      computeDamage.setPrivate(true);
      computeDamage
        .getParameters()
        .insertNewParameter('BaseDamage', 0)
        .setType('expression');
      const waitForWave = extension
        .getEventsFunctions()
        .insertNewEventsFunction('WaitForWave', 1);
      waitForWave.setAsync(true);
      waitForWave.setDeprecated(true);
      extension
        .getEventsFunctions()
        .insertNewEventsFunction('onSceneLoaded', 2);
      extension
        .getTests()
        .insertNewTest('Health bar fills', 0)
        .setDescription('A test');

      return project;
    };

    it('serializes the declarations of an authored extension', () => {
      const project = makeProjectWithCombatExtension();
      const { extensions } = makeSimplifiedProjectBuilder(
        gd
      ).getSimplifiedProject(project, {});

      expect(extensions).toMatchInlineSnapshot(`
[
  {
    "author": "Me",
    "category": "Game mechanic",
    "customBehaviors": [
      {
        "behaviorName": "Patrol",
        "description": "Moves between points.",
        "fullName": "Patrol",
        "functions": [
          {
            "eventsCount": 0,
            "functionName": "doStepPreEvents",
            "functionType": "Action",
            "isLifecycle": true,
            "parameters": [
              {
                "isImplicit": true,
                "label": "Object",
                "name": "Object",
                "type": "object",
              },
              {
                "extraInfo": "Combat::Patrol",
                "isImplicit": true,
                "label": "Behavior",
                "name": "Behavior",
                "type": "behavior",
              },
            ],
          },
          {
            "eventsCount": 0,
            "fullName": "Go to a point",
            "functionName": "GoTo",
            "functionType": "Action",
            "parameters": [
              {
                "isImplicit": true,
                "label": "Object",
                "name": "Object",
                "type": "object",
              },
              {
                "extraInfo": "Combat::Patrol",
                "isImplicit": true,
                "label": "Behavior",
                "name": "Behavior",
                "type": "behavior",
              },
              {
                "label": "Target X",
                "name": "TargetX",
                "type": "expression",
              },
              {
                "label": "Target Y",
                "name": "TargetY",
                "optional": true,
                "type": "expression",
              },
            ],
            "sentence": "Move _PARAM0_ to _PARAM2_;_PARAM3_",
          },
        ],
        "properties": [
          {
            "defaultValue": "100",
            "description": "Pixels per second",
            "label": "Speed",
            "propertyName": "Speed",
            "type": "Number",
          },
          {
            "choices": [
              {
                "label": "Loop",
                "value": "Loop",
              },
              {
                "label": "Once",
                "value": "Once",
              },
            ],
            "defaultValue": "Loop",
            "propertyName": "Mode",
            "type": "Choice",
          },
        ],
        "sharedProperties": [
          {
            "label": "Debug layer",
            "propertyName": "DebugLayer",
            "type": "Layer",
          },
        ],
      },
    ],
    "customObjects": [
      {
        "area": {
          "maxX": 200,
          "maxY": 20,
          "maxZ": 64,
          "minX": 0,
          "minY": 0,
          "minZ": 0,
        },
        "childObjects": [
          {
            "behaviors": [
              {
                "behaviorName": "Animation",
                "behaviorType": "AnimatableCapability::AnimatableBehavior",
              },
              {
                "behaviorName": "Effect",
                "behaviorType": "EffectCapability::EffectBehavior",
              },
              {
                "behaviorName": "Flippable",
                "behaviorType": "FlippableCapability::FlippableBehavior",
              },
              {
                "behaviorName": "Opacity",
                "behaviorType": "OpacityCapability::OpacityBehavior",
              },
              {
                "behaviorName": "Resizable",
                "behaviorType": "ResizableCapability::ResizableBehavior",
              },
              {
                "behaviorName": "Scale",
                "behaviorType": "ScalableCapability::ScalableBehavior",
              },
            ],
            "objectName": "Background",
            "objectType": "Sprite",
          },
          {
            "behaviors": [
              {
                "behaviorName": "Animation",
                "behaviorType": "AnimatableCapability::AnimatableBehavior",
              },
              {
                "behaviorName": "Effect",
                "behaviorType": "EffectCapability::EffectBehavior",
              },
              {
                "behaviorName": "Flippable",
                "behaviorType": "FlippableCapability::FlippableBehavior",
              },
              {
                "behaviorName": "Opacity",
                "behaviorType": "OpacityCapability::OpacityBehavior",
              },
              {
                "behaviorName": "Resizable",
                "behaviorType": "ResizableCapability::ResizableBehavior",
              },
              {
                "behaviorName": "Scale",
                "behaviorType": "ScalableCapability::ScalableBehavior",
              },
            ],
            "objectName": "Fill",
            "objectType": "Sprite",
            "objectVariables": [
              {
                "type": "Number",
                "value": "1",
                "variableName": "Ratio",
              },
            ],
          },
        ],
        "defaultName": "HealthBar",
        "fullName": "Health bar",
        "functions": [
          {
            "eventsCount": 0,
            "functionName": "onCreated",
            "functionType": "Action",
            "isLifecycle": true,
            "parameters": [
              {
                "extraInfo": "Combat::HealthBar",
                "isImplicit": true,
                "label": "Object",
                "name": "Object",
                "type": "object",
              },
            ],
          },
          {
            "eventsCount": 0,
            "expressionType": "number",
            "functionName": "Value",
            "functionType": "ExpressionAndCondition",
            "parameters": [
              {
                "extraInfo": "Combat::HealthBar",
                "isImplicit": true,
                "label": "Object",
                "name": "Object",
                "type": "object",
              },
            ],
          },
        ],
        "instancesDescription": "In this variant of the custom object, there are:
- on base layer:
  - 1 Background

Inspect instances of this variant to get more details if needed.",
        "layers": [
          {
            "isBaseLayer": true,
            "layerName": "",
            "position": 0,
          },
        ],
        "objectGroups": [
          {
            "behaviors": [
              {
                "behaviorName": "Animation",
                "behaviorType": "AnimatableCapability::AnimatableBehavior",
              },
              {
                "behaviorName": "Effect",
                "behaviorType": "EffectCapability::EffectBehavior",
              },
              {
                "behaviorName": "Flippable",
                "behaviorType": "FlippableCapability::FlippableBehavior",
              },
              {
                "behaviorName": "Opacity",
                "behaviorType": "OpacityCapability::OpacityBehavior",
              },
              {
                "behaviorName": "Resizable",
                "behaviorType": "ResizableCapability::ResizableBehavior",
              },
              {
                "behaviorName": "Scale",
                "behaviorType": "ScalableCapability::ScalableBehavior",
              },
            ],
            "objectGroupName": "Parts",
            "objectGroupType": "Sprite",
            "objectNames": [
              "Background",
              "Fill",
            ],
            "variables": undefined,
          },
        ],
        "objectName": "HealthBar",
        "properties": [
          {
            "defaultValue": "100",
            "label": "Maximum value",
            "propertyName": "MaxValue",
            "type": "Number",
          },
        ],
        "variants": [
          {
            "area": {
              "maxX": 400,
              "maxY": 40,
              "maxZ": 64,
              "minX": 0,
              "minY": 0,
              "minZ": 0,
            },
            "assetStoreAssetId": "asset-id-1",
            "childObjects": [
              {
                "behaviors": [
                  {
                    "behaviorName": "Animation",
                    "behaviorType": "AnimatableCapability::AnimatableBehavior",
                  },
                  {
                    "behaviorName": "Effect",
                    "behaviorType": "EffectCapability::EffectBehavior",
                  },
                  {
                    "behaviorName": "Flippable",
                    "behaviorType": "FlippableCapability::FlippableBehavior",
                  },
                  {
                    "behaviorName": "Opacity",
                    "behaviorType": "OpacityCapability::OpacityBehavior",
                  },
                  {
                    "behaviorName": "Resizable",
                    "behaviorType": "ResizableCapability::ResizableBehavior",
                  },
                  {
                    "behaviorName": "Scale",
                    "behaviorType": "ScalableCapability::ScalableBehavior",
                  },
                ],
                "objectName": "Background",
                "objectType": "Sprite",
              },
              {
                "behaviors": [
                  {
                    "behaviorName": "Animation",
                    "behaviorType": "AnimatableCapability::AnimatableBehavior",
                  },
                  {
                    "behaviorName": "Effect",
                    "behaviorType": "EffectCapability::EffectBehavior",
                  },
                  {
                    "behaviorName": "Flippable",
                    "behaviorType": "FlippableCapability::FlippableBehavior",
                  },
                  {
                    "behaviorName": "Opacity",
                    "behaviorType": "OpacityCapability::OpacityBehavior",
                  },
                  {
                    "behaviorName": "Resizable",
                    "behaviorType": "ResizableCapability::ResizableBehavior",
                  },
                  {
                    "behaviorName": "Scale",
                    "behaviorType": "ScalableCapability::ScalableBehavior",
                  },
                ],
                "objectName": "Fill",
                "objectType": "Sprite",
                "objectVariables": [
                  {
                    "type": "Number",
                    "value": "1",
                    "variableName": "Ratio",
                  },
                ],
              },
            ],
            "hasNoChildInstance": true,
            "instancesDescription": "There are no instances of child objects placed in this variant of the custom object - it is empty.",
            "layers": [
              {
                "isBaseLayer": true,
                "layerName": "",
                "position": 0,
              },
            ],
            "variantName": "Large",
          },
        ],
      },
    ],
    "dependencies": [
      {
        "dependencyName": "SomeNpmPackage",
        "exportName": "some-npm-package",
        "type": "npm",
        "version": "2.0.0",
      },
    ],
    "description": "Behaviors and objects for combat.",
    "extensionName": "Combat",
    "freeFunctions": [
      {
        "eventsCount": 0,
        "expressionType": "number",
        "functionName": "ComputeDamage",
        "functionType": "Expression",
        "isPrivate": true,
        "parameters": [
          {
            "name": "BaseDamage",
            "type": "expression",
          },
        ],
      },
      {
        "eventsCount": 0,
        "functionName": "WaitForWave",
        "functionType": "Action",
        "isAsync": true,
        "isDeprecated": true,
        "parameters": [],
      },
      {
        "eventsCount": 0,
        "functionName": "onSceneLoaded",
        "functionType": "Action",
        "isLifecycle": true,
        "parameters": [],
      },
    ],
    "fullName": "Combat",
    "globalVariables": [
      {
        "type": "Number",
        "value": "0",
        "variableName": "KillCount",
      },
    ],
    "sceneVariables": [
      {
        "type": "Number",
        "value": "1",
        "variableName": "WaveIndex",
      },
    ],
    "shortDescription": "Combat helpers",
    "tags": "combat, health",
    "tests": [
      {
        "description": "A test",
        "testName": "Health bar fills",
        "type": "gameplay",
      },
    ],
    "version": "1.0.0",
  },
]
`);

      project.delete();
    });

    it('marks store extensions and describes nested custom objects (TankConfiguration)', () => {
      const project = gd.ProjectHelper.createNewGDJSProject();
      const extension = project.insertNewEventsFunctionsExtension(
        'TankConfiguration',
        0
      );
      unserializeFromJSObject(
        extension,
        tankConfigurationExtensionJson,
        'unserializeFrom',
        project
      );
      const storeExtension = project.insertNewEventsFunctionsExtension(
        'CameraShake',
        1
      );
      storeExtension.setOrigin('gdevelop-extension-store', 'CameraShake');

      const { extensions } = makeSimplifiedProjectBuilder(
        gd
      ).getSimplifiedProject(project, {});

      const tankConfiguration = extensions.find(
        (extension) => extension.extensionName === 'TankConfiguration'
      );
      if (!tankConfiguration) throw new Error('TankConfiguration not found');
      expect(tankConfiguration.isFromStore).toBeUndefined();
      const combinedTank = (tankConfiguration.customObjects || []).find(
        (object) => object.objectName === 'CombinedTank'
      );
      if (!combinedTank) throw new Error('CombinedTank not found');
      expect(combinedTank.childObjects[1].objectType).toBe(
        'TankConfiguration::TankTop'
      );
      expect(combinedTank.isRenderedIn3D).toBe(true);
      expect(combinedTank.area).toEqual({
        minX: 0,
        minY: 0,
        minZ: 0,
        maxX: 95,
        maxY: 65,
        maxZ: 69,
      });
      const setTopRotation = combinedTank.functions.find(
        (eventsFunction) => eventsFunction.functionName === 'SetTopRotation'
      );
      if (!setTopRotation) throw new Error('SetTopRotation not found');
      expect(setTopRotation.functionType).toBe('ActionWithOperator');
      expect(setTopRotation.getterName).toBe('TopRotation');
      expect(setTopRotation.parameters[0].isImplicit).toBe(true);
      expect(setTopRotation.parameters[0].extraInfo).toBe(
        'TankConfiguration::CombinedTank'
      );
      expect(setTopRotation.eventsCount).toBe(1);
      expect(combinedTank.instancesDescription).toContain('1 TankTop_Combined');

      const cameraShake = extensions.find(
        (extension) => extension.extensionName === 'CameraShake'
      );
      if (!cameraShake) throw new Error('CameraShake not found');
      expect(cameraShake.isFromStore).toBe(true);
      expect(cameraShake.originIdentifier).toBe('CameraShake');

      project.delete();
    });
  });
});
