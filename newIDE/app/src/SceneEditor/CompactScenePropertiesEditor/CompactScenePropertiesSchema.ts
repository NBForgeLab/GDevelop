import { type I18n as I18nType } from '@lingui/core';
import { t } from '@lingui/macro';
import {
  type Schema,
  type Field,
  type Instance as SchemaInstance,
} from '../../PropertiesEditor/PropertiesEditorSchema';
import {
  rgbColorToRGBString,
  rgbStringAndAlphaToRGBColor,
  clampRgbComponent,
} from '../../Utils/ColorTransformer';

const getBackgroundColorField = ({
  i18n,
  onBackgroundColorChanged,
}: {
  i18n: I18nType;
  onBackgroundColorChanged: () => void;
}): Field => ({
  name: 'BackgroundColor',
  getLabel: () => i18n._(t`Background color`),
  valueType: 'color',

  getValue: (instance: SchemaInstance) => {
    const scene = instance as gdLayout;
    return rgbColorToRGBString({
      r: scene.getBackgroundColorRed(),
      b: scene.getBackgroundColorBlue(),
      g: scene.getBackgroundColorGreen(),
    });
  },

  setValue: (instance: SchemaInstance, newValue: string) => {
    const scene = instance as gdLayout;
    const backgroundColor = rgbStringAndAlphaToRGBColor(newValue);
    scene.setBackgroundColor(
      backgroundColor ? clampRgbComponent(backgroundColor.r) : 0,
      backgroundColor ? clampRgbComponent(backgroundColor.g) : 0,
      backgroundColor ? clampRgbComponent(backgroundColor.b) : 0
    );
    onBackgroundColorChanged();
  },

  visibility: 'basic',
});

const getShouldStopSoundsOnStartupField = ({
  i18n,
}: {
  i18n: I18nType;
}): Field => ({
  name: 'ShouldStopSoundsOnStartup',
  getLabel: () => i18n._(t`Stop music and sounds at scene startup`),
  valueType: 'boolean',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayout).stopSoundsOnStartup(),

  setValue: (instance: SchemaInstance, newValue: boolean) =>
    (instance as gdLayout).setStopSoundsOnStartup(newValue),

  visibility: 'advanced',
});

const getResourcesPreloadingField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'ResourcesPreloading',
  getLabel: () => i18n._(t`Resources preloading`),
  valueType: 'string',

  getChoices: () => [
    {
      value: 'inherit',
      label: i18n._(t`Use the project setting`),
    },
    {
      value: 'at-startup',
      label: i18n._(t`Always preload at startup`),
    },
    {
      value: 'never',
      label: i18n._(t`Never preload`),
    },
  ],

  getValue: (instance: SchemaInstance) =>
    (instance as gdLayout).getResourcesPreloading(),

  setValue: (instance: SchemaInstance, newValue: string) =>
    (instance as gdLayout).setResourcesPreloading(newValue),

  visibility: 'advanced',
});

const getResourcesUnloadingField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'ResourcesUnloading',
  getLabel: () => i18n._(t`Resources unloading`),
  valueType: 'string',

  getChoices: () => [
    {
      value: 'inherit',
      label: i18n._(t`Use the project setting`),
    },
    {
      value: 'at-scene-exit',
      label: i18n._(t`Unload at scene exit`),
    },
    {
      value: 'never',
      label: i18n._(t`Never unload`),
    },
  ],

  getValue: (instance: SchemaInstance) =>
    (instance as gdLayout).getResourcesUnloading(),

  setValue: (instance: SchemaInstance, newValue: string) =>
    (instance as gdLayout).setResourcesUnloading(newValue),

  visibility: 'advanced',
});

const getWindowTitleField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'WindowTitle',
  getLabel: () => i18n._(t`Window title`),
  valueType: 'string',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayout).getWindowDefaultTitle(),

  setValue: (instance: SchemaInstance, newValue: string) =>
    (instance as gdLayout).setWindowDefaultTitle(newValue),

  visibility: 'advanced',
});

const getWorldScaleField = ({
  i18n,
  onRenderer3DWorldScaleFieldChanged,
}: {
  i18n: I18nType;
  onRenderer3DWorldScaleFieldChanged: () => void;
}): Field => ({
  name: 'WorldScale',
  getLabel: () => i18n._(t`3D renderer world scale`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdLayout).getRenderer3DWorldScale(),

  setValue: (instance: SchemaInstance, newValue: number) => {
    (instance as gdLayout).setRenderer3DWorldScale(newValue);
    onRenderer3DWorldScaleFieldChanged();
  },

  visibility: 'advanced',
});

export const makeSchema = ({
  i18n,
  onBackgroundColorChanged,
  onRenderer3DWorldScaleFieldChanged,
}: {
  i18n: I18nType;
  onBackgroundColorChanged: () => void;
  onRenderer3DWorldScaleFieldChanged: () => void;
}): Schema => {
  return [
    {
      name: 'BackgroundColor',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [getBackgroundColorField({ i18n, onBackgroundColorChanged })],
    },
    {
      name: 'ShouldStopSoundsOnStartup',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [getShouldStopSoundsOnStartupField({ i18n })],
    },
    {
      name: 'ResourcesPreloading',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [getResourcesPreloadingField({ i18n })],
    },
    {
      name: 'ResourcesUnloading',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [getResourcesUnloadingField({ i18n })],
    },
    {
      name: 'WindowTitle',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [getWindowTitleField({ i18n })],
    },
    {
      name: 'WorldScale',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [
        getWorldScaleField({ i18n, onRenderer3DWorldScaleFieldChanged }),
      ],
    },
  ];
};
