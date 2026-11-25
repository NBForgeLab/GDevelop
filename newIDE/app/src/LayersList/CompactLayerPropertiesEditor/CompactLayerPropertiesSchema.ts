import { type I18n as I18nType } from '@lingui/core';
import { t } from '@lingui/macro';
import {
  type Schema,
  type Field,
  type FieldChoices,
  type Instance as SchemaInstance,
} from '../../PropertiesEditor/PropertiesEditorSchema';
import {
  rgbColorToRGBString,
  rgbStringAndAlphaToRGBColor,
} from '../../Utils/ColorTransformer';

const defaultCameraBehaviorChoices: Array<FieldChoices> = [
  {
    value: 'do-nothing',
    label: t`Keep centered (best for game content)`,
  },
  {
    value: 'top-left-anchored-if-never-moved',
    label: t`Keep top-left corner fixed (best for content that can extend)`,
  },
];
const getDefaultCameraBehaviorField = ({
  i18n,
}: {
  i18n: I18nType;
}): Field => ({
  name: 'Default camera behavior',
  getLabel: () => i18n._(t`Default camera behavior`),
  valueType: 'string',
  getChoices: () => defaultCameraBehaviorChoices,
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).getDefaultCameraBehavior(),

  setValue: (instance: SchemaInstance, newValue: string) =>
    (instance as gdLayer).setDefaultCameraBehavior(newValue),
});

const renderingTypeChoices: Array<FieldChoices> = [
  {
    value: '',
    label: t`Display both 2D and 3D objects (default)`,
  },
  {
    value: '2d',
    label: t`Force display only 2D objects`,
  },
  {
    value: '3d',
    label: t`Force display only 3D objects`,
  },
  {
    value: '2d+3d',
    label: t`Force display both 2D and 3D objects`,
  },
];
const getRenderingTypeField = ({
  i18n,
  forceUpdate,
}: {
  i18n: I18nType;
  forceUpdate: () => void;
}): Field => ({
  name: 'Rendering type',
  getLabel: () => i18n._(t`Rendering type`),
  valueType: 'string',
  getChoices: () => renderingTypeChoices,
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).getRenderingType(),

  setValue: (instance: SchemaInstance, newValue: string) => {
    (instance as gdLayer).setRenderingType(newValue);
    forceUpdate();
  },
});

const cameraTypeChoices: Array<FieldChoices> = [
  {
    value: 'perspective',
    label: t`Perspective camera`,
  },
  {
    value: 'orthographic',
    label: t`Orthographic camera`,
  },
];
const getCameraTypeField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Camera type',
  getLabel: () => i18n._(t`Camera type`),
  valueType: 'string',
  getChoices: () => cameraTypeChoices,
  getValue: (instance: SchemaInstance) => (instance as gdLayer).getCameraType(),

  // TODO checkNearPlaneDistanceError
  setValue: (instance: SchemaInstance, newValue: string) =>
    (instance as gdLayer).setCameraType(newValue),
});

const getCamera3DFieldOfViewField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Field of view',
  getLabel: () => i18n._(t`Field of view (in degrees)`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).getCamera3DFieldOfView(),

  // TODO onChangeCamera3DFieldOfView
  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdLayer).setCamera3DFieldOfView(newValue),

  disabled: (instances: Array<SchemaInstance>) => {
    const layers = instances as Array<gdLayer>;
    return layers[0] && layers[0].getCameraType() === 'perspective'
      ? 'never'
      : 'always';
  },
});

const getNearPlaneDistanceField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Near plane distance',
  getLabel: () => i18n._(t`Near plane distance`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).getCamera3DNearPlaneDistance(),

  // TODO onChangeCamera3DNearPlaneDistance
  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdLayer).setCamera3DNearPlaneDistance(newValue),
});

const getFarPlaneDistanceField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Far plane distance',
  getLabel: () => i18n._(t`Far plane distance`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).getCamera3DFarPlaneDistance(),

  // TODO onChangeCamera3DNearPlaneDistance
  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdLayer).setCamera3DFarPlaneDistance(newValue),
});

const getCamera2DPlaneMaxDrawingDistanceField = ({
  i18n,
}: {
  i18n: I18nType;
}): Field => ({
  name: 'Maximum 2D drawing distance',
  getLabel: () => i18n._(t`Maximum 2D drawing distance`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).getCamera2DPlaneMaxDrawingDistance(),

  // TODO onChangeCamera2DPlaneMaxDrawingDistance
  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdLayer).setCamera2DPlaneMaxDrawingDistance(newValue),
});

const getFollowingBaseLayerCameraField = ({
  i18n,
}: {
  i18n: I18nType;
}): Field => ({
  name: 'Automatically follow the base layer',
  getLabel: () => i18n._(t`Automatically follow the base layer.`),
  valueType: 'boolean',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayer).isFollowingBaseLayerCamera(),

  setValue: (instance: SchemaInstance, newValue: boolean) =>
    (instance as gdLayer).setFollowBaseLayerCamera(newValue),
});

const getAmbientLightColorField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Ambient light color',
  getLabel: () => i18n._(t`Ambient light color`),
  valueType: 'color',

  getValue: (instance: SchemaInstance) => {
    const layer = instance as gdLayer;
    return rgbColorToRGBString({
      r: layer.getAmbientLightColorRed(),
      g: layer.getAmbientLightColorGreen(),
      b: layer.getAmbientLightColorBlue(),
    });
  },

  setValue: (instance: SchemaInstance, newColor: string) => {
    const layer = instance as gdLayer;
    const currentRgbColor = {
      r: layer.getAmbientLightColorRed(),
      g: layer.getAmbientLightColorGreen(),
      b: layer.getAmbientLightColorBlue(),
    };
    const newRgbColor = rgbStringAndAlphaToRGBColor(newColor);
    if (
      newRgbColor &&
      (newRgbColor.r !== currentRgbColor.r ||
        newRgbColor.g !== currentRgbColor.g ||
        newRgbColor.b !== currentRgbColor.b)
    ) {
      layer.setAmbientLightColor(newRgbColor.r, newRgbColor.g, newRgbColor.b);
    }
  },
});

export const makeSchema = ({
  i18n,
  forceUpdate,
  onEditLayer,
  layersContainer,
}: {
  i18n: I18nType;
  forceUpdate: () => void;
  onEditLayer: (layer: gdLayer) => void;
  layersContainer: gdLayersContainer;
}): Schema => {
  return [
    getDefaultCameraBehaviorField({ i18n }),
    {
      name: 'Not a lighting layer',
      type: 'column',
      isHidden: (layers) => layers[0] && layers[0].isLightingLayer(),
      children: [
        getRenderingTypeField({ i18n, forceUpdate }),
        {
          name: 'Optional 3D settings',
          type: 'column',
          isHidden: (layers) =>
            layers[0] && layers[0].getRenderingType() === '2d',
          children: [
            {
              name: '3D settings',
              title: i18n._(t`3D settings`),
              nonFieldType: 'sectionTitle',
              getValue: undefined,
            },
            getCameraTypeField({ i18n }),
            getCamera3DFieldOfViewField({ i18n }),
            getNearPlaneDistanceField({ i18n }),
            getFarPlaneDistanceField({ i18n }),
            getCamera2DPlaneMaxDrawingDistanceField({ i18n }),
          ],
        },
      ],
    },
    {
      name: 'Optional lighting layer settings',
      type: 'column',
      isHidden: (layers) => layers[0] && !layers[0].isLightingLayer(),
      children: [
        {
          name: 'Lighting settings',
          title: i18n._(t`Lighting settings`),
          nonFieldType: 'sectionTitle',
          getValue: undefined,
        },
        getFollowingBaseLayerCameraField({ i18n }),
        getAmbientLightColorField({ i18n }),
      ],
    },
  ];
};
