// @flow
import { makeSimplifiedProjectBuilder } from './SimplifiedProject';
import { makeTestProject } from '../../fixtures/TestProject';
import { makeTestExtensions } from '../../fixtures/TestExtensions';

const gd: libGDevelop = global.gd;

describe('SimplifiedProject', () => {
  it('should create a simplified project JSON with global objects and scenes', () => {
    const { project } = makeTestProject(gd);
    const simplifiedJson = makeSimplifiedProjectBuilder(
      gd
    ).getSimplifiedProject(project, {});

    expect(simplifiedJson).toMatchInlineSnapshot(`
      {
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
          "gameResolutionHeight": 600,
          "gameResolutionWidth": 800,
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

  it('should include summaries of project specific extensions', () => {
    makeTestExtensions(gd);

    const project = gd.ProjectHelper.createNewGDJSProject();
    // Mimic the test extension "FakeBehavior" was created from a project extension:
    project.insertNewEventsFunctionsExtension('FakeBehavior', 0);

    const projectSpecificExtensionsSummary = makeSimplifiedProjectBuilder(
      gd
    ).getProjectSpecificExtensionsSummary(project);

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

    const projectSpecificExtensionsSummary = makeSimplifiedProjectBuilder(
      gd
    ).getProjectSpecificExtensionsSummary(project);

    const buttonExtensionSummary = projectSpecificExtensionsSummary.extensionSummaries.find(
      extensionSummary => extensionSummary.extensionName === 'Button'
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
});
