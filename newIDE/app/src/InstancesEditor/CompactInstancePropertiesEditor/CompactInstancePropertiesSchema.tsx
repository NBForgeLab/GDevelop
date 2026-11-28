import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { t } from '@lingui/macro';

import {
  type Schema,
  type Field,
  type PrimitiveValueField,
  type ActionButton,
  type SectionTitle,
  type Instance as SchemaInstance,
} from '../../PropertiesEditor/PropertiesEditorSchema';
import enumerateLayers from '../../LayersList/EnumerateLayers';
import { styles } from '.';

import Layers from '../../UI/CustomSvgIcons/Layers';
import LetterX from '../../UI/CustomSvgIcons/LetterX';
import LetterY from '../../UI/CustomSvgIcons/LetterY';
import LetterH from '../../UI/CustomSvgIcons/LetterH';
import LetterW from '../../UI/CustomSvgIcons/LetterW';
import LetterD from '../../UI/CustomSvgIcons/LetterD';
import LetterZ from '../../UI/CustomSvgIcons/LetterZ';
import Opacity from '../../UI/CustomSvgIcons/Opacity';
import FlipHorizontal from '../../UI/CustomSvgIcons/FlipHorizontal';
import FlipVertical from '../../UI/CustomSvgIcons/FlipVertical';
import Instance from '../../UI/CustomSvgIcons/Instance';
import Link from '../../UI/CustomSvgIcons/Link';
import Unlink from '../../UI/CustomSvgIcons/Unlink';
import RemoveCircle from '../../UI/CustomSvgIcons/RemoveCircle';
import Lock from '../../UI/CustomSvgIcons/Lock';
import LockOpen from '../../UI/CustomSvgIcons/LockOpen';
import Visibility from '../../UI/CustomSvgIcons/Visibility';
import VisibilityOff from '../../UI/CustomSvgIcons/VisibilityOff';
import Restore from '../../UI/CustomSvgIcons/Restore';
import Object3d from '../../UI/CustomSvgIcons/Object3d';
import Object2d from '../../UI/CustomSvgIcons/Object2d';
import RotateX from '../../UI/CustomSvgIcons/RotateX';
import RotateY from '../../UI/CustomSvgIcons/RotateY';
import RotateZ from '../../UI/CustomSvgIcons/RotateZ';
import FlipZ from '../../UI/CustomSvgIcons/FlipZ';

/**
 * Applies ratio to value without intermediary value to avoid precision issues.
 */
const applyRatio = ({
  oldReferenceValue,
  newReferenceValue,
  valueToApplyTo,
}: {
  oldReferenceValue: number;
  newReferenceValue: number;
  valueToApplyTo: number;
}) => {
  // Rounding to 12 significant digits removes floating point errors
  // (e.g. 104.01999999999998 instead of 104.02) that would otherwise
  // accumulate when the size is changed step by step.
  return Number(
    ((newReferenceValue * valueToApplyTo) / oldReferenceValue).toPrecision(12)
  );
};

type Size = [number, number, number];

// Size of instances before it was set to 0 while keeping the ratio, to restore
// their proportions when the size is increased again.
const sizesBeforeCollapse: Map<number, Size> = new Map();

const setInstanceSize = ({
  instance,
  dimension,
  newValue,
  getInstanceSize,
  getInstanceDefaultSize,
}: {
  instance: gdInitialInstance;
  dimension: 0 | 1 | 2;
  newValue: number;
  getInstanceSize: (initialInstance: gdInitialInstance) => Size;
  getInstanceDefaultSize: (initialInstance: gdInitialInstance) => Size;
}) => {
  const shouldKeepRatio = instance.shouldKeepRatio();
  const currentSize = getInstanceSize(instance);
  const newDimensionValue = Math.max(newValue, 0);
  const isCollapsed = currentSize.every((value) => value === 0);
  const referenceSize =
    shouldKeepRatio && isCollapsed
      ? sizesBeforeCollapse.get(instance.ptr) ||
        getInstanceDefaultSize(instance)
      : currentSize;
  const referenceValue = referenceSize[dimension];
  const newSize = referenceSize.map((value, index) =>
    index === dimension
      ? newDimensionValue
      : !shouldKeepRatio || referenceValue === 0
        ? currentSize[index]
        : applyRatio({
            oldReferenceValue: referenceValue,
            newReferenceValue: newDimensionValue,
            valueToApplyTo: value,
          })
  );

  if (newSize.every((value) => value === 0)) {
    if (!isCollapsed) sizesBeforeCollapse.set(instance.ptr, currentSize);
  } else {
    sizesBeforeCollapse.delete(instance.ptr);
  }

  instance.setCustomWidth(newSize[0]);
  instance.setCustomHeight(newSize[1]);
  instance.setCustomDepth(newSize[2]);
  // This must be done after reading the size.
  instance.setHasCustomSize(true);
  instance.setHasCustomDepth(true);
};

const resetInstanceSize = ({
  instance,
  dimension,
  getInstanceSize,
  getInstanceDefaultSize,
}: {
  instance: gdInitialInstance;
  dimension: 0 | 1 | 2;
  getInstanceSize: (initialInstance: gdInitialInstance) => Size;
  getInstanceDefaultSize: (initialInstance: gdInitialInstance) => Size;
}) => {
  sizesBeforeCollapse.delete(instance.ptr);
  const defaultSize = getInstanceDefaultSize(instance);
  const newSize = getInstanceSize(instance).map((value, index) =>
    index === dimension ? defaultSize[index] : value
  );
  if (
    instance.shouldKeepRatio() ||
    newSize.every((value, index) => value === defaultSize[index])
  ) {
    instance.setHasCustomSize(false);
    instance.setHasCustomDepth(false);
    return;
  }

  instance.setCustomWidth(newSize[0]);
  instance.setCustomHeight(newSize[1]);
  instance.setCustomDepth(newSize[2]);
  instance.setHasCustomSize(true);
  instance.setHasCustomDepth(true);
};

const getEditObjectButton = ({
  i18n,
  onEditObject,
  is3DInstance,
}: {
  i18n: I18nType;
  onEditObject: (name: string) => void;
  is3DInstance: boolean;
}): ActionButton => ({
  label: i18n._(t`Edit object`),
  disabled: 'onValuesDifferent',
  nonFieldType: 'button',
  getIcon: is3DInstance
    ? (props: { fontSize: string }) => (
        <Object3d
          {...props}
          fontSize={props.fontSize as 'small' | 'inherit' | 'default' | 'large'}
        />
      )
    : (props: { fontSize: string }) => (
        <Object2d
          {...props}
          fontSize={props.fontSize as 'small' | 'inherit' | 'default' | 'large'}
        />
      ),
  getValue: (instance: SchemaInstance) =>
    (instance as gdInitialInstance).getObjectName(),
  onClick: (instance: SchemaInstance) =>
    onEditObject((instance as gdInitialInstance).getObjectName()),
});

const getRotationXAndRotationYFields = ({
  i18n,
}: {
  i18n: I18nType;
}): Schema => [
  {
    name: 'Rotation X',
    getLabel: () => i18n._(t`Rotation (X)`),
    valueType: 'number',
    getValue: (instance: SchemaInstance) =>
      (instance as gdInitialInstance).getRotationX(),
    setValue: (instance: SchemaInstance, newValue: number) =>
      (instance as gdInitialInstance).setRotationX(newValue),
    renderLeftIcon: (className) => <RotateX className={className} />,
  },
  {
    name: 'Rotation Y',
    getLabel: () => i18n._(t`Rotation (Y)`),
    valueType: 'number',
    getValue: (instance: SchemaInstance) =>
      (instance as gdInitialInstance).getRotationY(),
    setValue: (instance: SchemaInstance, newValue: number) =>
      (instance as gdInitialInstance).setRotationY(newValue),
    renderLeftIcon: (className) => <RotateY className={className} />,
  },
];
const getRotationZField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Angle',
  getLabel: () => i18n._(t`Rotation (Z)`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdInitialInstance).getAngle(),

  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdInitialInstance).setAngle(newValue),

  renderLeftIcon: (className) => <RotateZ className={className} />,
});
const getXAndYFields = ({ i18n }: { i18n: I18nType }): Schema => [
  {
    name: 'X',
    getLabel: () => i18n._(t`X`),
    valueType: 'number',
    getValue: (instance: SchemaInstance) =>
      (instance as gdInitialInstance).getX(),
    setValue: (instance: SchemaInstance, newValue: number) =>
      (instance as gdInitialInstance).setX(newValue),
    renderLeftIcon: (className) => <LetterX className={className} />,
  },
  {
    name: 'Y',
    getLabel: () => i18n._(t`Y`),
    valueType: 'number',
    getValue: (instance: SchemaInstance) =>
      (instance as gdInitialInstance).getY(),
    setValue: (instance: SchemaInstance, newValue: number) =>
      (instance as gdInitialInstance).setY(newValue),
    renderLeftIcon: (className) => <LetterY className={className} />,
  },
];
const getZField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Z',
  getLabel: () => i18n._(t`Z`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdInitialInstance).getZ(),

  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdInitialInstance).setZ(newValue),

  renderLeftIcon: (className) => <LetterZ className={className} />,
});
const getLayerField = ({
  i18n,
  layersContainer,
}: {
  i18n: I18nType;
  layersContainer: gdLayersContainer;
}): Field => ({
  name: 'Layer',
  getLabel: () => i18n._(t`Layer`),
  valueType: 'string',
  getChoices: () => enumerateLayers(layersContainer),
  getValue: (instance: SchemaInstance) =>
    (instance as gdInitialInstance).getLayer(),

  setValue: (instance: SchemaInstance, newValue: string) =>
    (instance as gdInitialInstance).setLayer(newValue),

  renderLeftIcon: (className) => <Layers className={className} />,
});
const getZOrderField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Z Order',
  getLabel: () => i18n._(t`Z Order`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    (instance as gdInitialInstance).getZOrder(),

  setValue: (instance: SchemaInstance, newValue: number) =>
    (instance as gdInitialInstance).setZOrder(newValue),

  renderLeftIcon: (className) => <LetterZ className={className} />,
});

const getTitleRow = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Title',
  type: 'row',
  preventWrap: true,

  children: [
    {
      name: 'Instance',
      title: i18n._(t`Instance`),
      renderLeftIcon: (className) => (
        <Instance className={className} style={styles.icon} />
      ),
      getValue: (instance: SchemaInstance) =>
        (instance as gdInitialInstance).getObjectName(),
      nonFieldType: 'title',
      defaultValue: i18n._(t`Different objects`),
    },
    {
      name: 'Hide instance',
      getLabel: (instance: SchemaInstance) =>
        (instance as gdInitialInstance).isHidden()
          ? i18n._(t`Hidden when the scene starts`)
          : i18n._(t`Visible when the scene starts`),
      valueType: 'enumIcon',
      renderIcon: (value) =>
        value === 'hidden' ? (
          <VisibilityOff style={styles.icon} />
        ) : (
          <Visibility style={styles.icon} />
        ),
      isHighlighted: (value: 'hidden' | 'visible') => value === 'hidden',
      getValue: (instance: SchemaInstance) =>
        (instance as gdInitialInstance).isHidden() ? 'hidden' : 'visible',
      setValue: (instance: SchemaInstance, newValue: 'hidden' | 'visible') => {
        (instance as gdInitialInstance).setHidden(newValue === 'hidden');
      },
      getNextValue: (
        currentValue: 'hidden' | 'visible'
      ): 'hidden' | 'visible' =>
        currentValue === 'hidden' ? 'visible' : 'hidden',
    },
    {
      name: 'Lock instance',
      getLabel: (instance: SchemaInstance) => {
        const initialInstance = instance as gdInitialInstance;
        return initialInstance.isSealed()
          ? i18n._(t`Free instance`)
          : initialInstance.isLocked()
            ? i18n._(t`Prevent selection in the editor`)
            : i18n._(t`Lock position/angle in the editor`);
      },
      valueType: 'enumIcon',
      renderIcon: (value) =>
        value === 'sealed' ? (
          <RemoveCircle style={styles.icon} />
        ) : value === 'locked' ? (
          <Lock style={styles.icon} />
        ) : (
          <LockOpen style={styles.icon} />
        ),
      isHighlighted: (value: 'sealed' | 'locked' | 'free') =>
        value === 'locked' || value === 'sealed',
      getValue: (instance: SchemaInstance) => {
        const initialInstance = instance as gdInitialInstance;
        return initialInstance.isSealed()
          ? 'sealed'
          : initialInstance.isLocked()
            ? 'locked'
            : 'free';
      },
      setValue: (
        instance: SchemaInstance,
        newValue: 'sealed' | 'locked' | 'free'
      ) => {
        const initialInstance = instance as gdInitialInstance;
        initialInstance.setSealed(newValue === 'sealed' ? true : false);
        initialInstance.setLocked(
          newValue === 'sealed' || newValue === 'locked' ? true : false
        );
      },
      getNextValue: (
        currentValue: 'sealed' | 'locked' | 'free'
      ): 'sealed' | 'locked' | 'free' => {
        if (currentValue === 'free') return 'locked';
        if (currentValue === 'locked') return 'sealed';
        return 'free';
      },
    },
  ],
});

const getWidthField = ({
  i18n,
  getInstanceWidth,
  getInstanceHeight,
  getInstanceDepth,
  getInstanceDefaultSize,
  forceUpdate,
}: {
  i18n: I18nType;
  getInstanceWidth: (initialInstance: gdInitialInstance) => number;
  getInstanceHeight: (initialInstance: gdInitialInstance) => number;
  getInstanceDepth: (initialInstance: gdInitialInstance) => number;
  getInstanceDefaultSize: (initialInstance: gdInitialInstance) => Size;
  forceUpdate: () => void;
}): Field => ({
  name: 'Width',
  getLabel: () => i18n._(t`Width`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    getInstanceWidth(instance as gdInitialInstance),

  setValue: (instance: SchemaInstance, newValue: number) => {
    setInstanceSize({
      instance: instance as gdInitialInstance,
      dimension: 0,
      newValue,
      getInstanceSize: (instance) => [
        getInstanceWidth(instance),
        getInstanceHeight(instance),
        getInstanceDepth(instance),
      ],
      getInstanceDefaultSize,
    });
    forceUpdate();
  },

  renderLeftIcon: (className) => <LetterW className={className} />,

  getEndAdornmentIcon: (instance: SchemaInstance) => {
    const initialInstance = instance as gdInitialInstance;
    if (initialInstance.hasCustomDepth() || initialInstance.hasCustomSize()) {
      return (className) => <Restore className={className} />;
    }
    return null;
  },

  onClickEndAdornment: (instance: SchemaInstance) => {
    resetInstanceSize({
      instance: instance as gdInitialInstance,
      dimension: 0,
      getInstanceSize: (instance) => [
        getInstanceWidth(instance),
        getInstanceHeight(instance),
        getInstanceDepth(instance),
      ],
      getInstanceDefaultSize,
    });
    forceUpdate();
  },
});
const getHeightField = ({
  i18n,
  getInstanceWidth,
  getInstanceHeight,
  getInstanceDepth,
  getInstanceDefaultSize,
  forceUpdate,
}: {
  i18n: I18nType;
  getInstanceWidth: (initialInstance: gdInitialInstance) => number;
  getInstanceHeight: (initialInstance: gdInitialInstance) => number;
  getInstanceDepth: (initialInstance: gdInitialInstance) => number;
  getInstanceDefaultSize: (initialInstance: gdInitialInstance) => Size;
  forceUpdate: () => void;
}): Field => ({
  name: 'Height',
  getLabel: () => i18n._(t`Height`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    getInstanceHeight(instance as gdInitialInstance),

  setValue: (instance: SchemaInstance, newValue: number) => {
    setInstanceSize({
      instance: instance as gdInitialInstance,
      dimension: 1,
      newValue,
      getInstanceSize: (instance) => [
        getInstanceWidth(instance),
        getInstanceHeight(instance),
        getInstanceDepth(instance),
      ],
      getInstanceDefaultSize,
    });
    forceUpdate();
  },

  renderLeftIcon: (className) => <LetterH className={className} />,

  getEndAdornmentIcon: (instance: SchemaInstance) => {
    const initialInstance = instance as gdInitialInstance;
    if (initialInstance.hasCustomDepth() || initialInstance.hasCustomSize()) {
      return (className) => <Restore className={className} />;
    }
    return null;
  },

  onClickEndAdornment: (instance: SchemaInstance) => {
    resetInstanceSize({
      instance: instance as gdInitialInstance,
      dimension: 1,
      getInstanceSize: (instance) => [
        getInstanceWidth(instance),
        getInstanceHeight(instance),
        getInstanceDepth(instance),
      ],
      getInstanceDefaultSize,
    });
    forceUpdate();
  },
});
const getDepthField = ({
  i18n,
  getInstanceWidth,
  getInstanceHeight,
  getInstanceDepth,
  getInstanceDefaultSize,
  forceUpdate,
}: {
  i18n: I18nType;
  getInstanceWidth: (initialInstance: gdInitialInstance) => number;
  getInstanceHeight: (initialInstance: gdInitialInstance) => number;
  getInstanceDepth: (initialInstance: gdInitialInstance) => number;
  getInstanceDefaultSize: (initialInstance: gdInitialInstance) => Size;
  forceUpdate: () => void;
}): Field => ({
  name: 'Depth',
  getLabel: () => i18n._(t`Depth`),
  valueType: 'number',
  getValue: (instance: SchemaInstance) =>
    getInstanceDepth(instance as gdInitialInstance),

  setValue: (instance: SchemaInstance, newValue: number) => {
    setInstanceSize({
      instance: instance as gdInitialInstance,
      dimension: 2,
      newValue,
      getInstanceSize: (instance) => [
        getInstanceWidth(instance),
        getInstanceHeight(instance),
        getInstanceDepth(instance),
      ],
      getInstanceDefaultSize,
    });
    forceUpdate();
  },

  renderLeftIcon: (className) => <LetterD className={className} />,

  getEndAdornmentIcon: (instance: SchemaInstance) => {
    const initialInstance = instance as gdInitialInstance;
    if (initialInstance.hasCustomDepth() || initialInstance.hasCustomSize()) {
      return (className) => <Restore className={className} />;
    }
    return null;
  },

  onClickEndAdornment: (instance: SchemaInstance) => {
    resetInstanceSize({
      instance: instance as gdInitialInstance,
      dimension: 2,
      getInstanceSize: (instance) => [
        getInstanceWidth(instance),
        getInstanceHeight(instance),
        getInstanceDepth(instance),
      ],
      getInstanceDefaultSize,
    });
    forceUpdate();
  },
});
const getKeepRatioField = ({
  i18n,
  getInstanceWidth,
  getInstanceHeight,
  getInstanceDepth,
  forceUpdate,
}: {
  i18n: I18nType;
  getInstanceWidth: (initialInstance: gdInitialInstance) => number;
  getInstanceHeight: (initialInstance: gdInitialInstance) => number;
  getInstanceDepth: (initialInstance: gdInitialInstance) => number;
  forceUpdate: () => void;
}): PrimitiveValueField => ({
  name: 'Keep ratio',
  getLabel: () => i18n._(t`Keep ratio`),
  valueType: 'enumIcon',
  isHighlighted: (value) => value,

  renderIcon: (value) =>
    value ? <Link style={styles.icon} /> : <Unlink style={styles.icon} />,

  getValue: (instance: SchemaInstance) =>
    (instance as gdInitialInstance).shouldKeepRatio(),

  setValue: (instance: SchemaInstance, newValue: boolean) =>
    (instance as gdInitialInstance).setShouldKeepRatio(newValue),

  getNextValue: (currentValue: boolean) => !currentValue,
});

const getOpacityField = ({ i18n }: { i18n: I18nType }): Field => ({
  name: 'Opacity',
  getLabel: () => i18n._(t`Opacity`),
  valueType: 'number',

  getValue: (instance: SchemaInstance) => {
    const opacity = (instance as gdInitialInstance).getOpacity();
    return Math.round((opacity / 255) * 100);
  },

  setValue: (instance: SchemaInstance, newValue: number) => {
    const newOpacity = Math.round((newValue / 100) * 255);
    const opacity = Math.max(0, Math.min(255, newOpacity));
    (instance as gdInitialInstance).setOpacity(opacity);
  },

  renderLeftIcon: (className) => <Opacity className={className} />,

  getDisplayedValueFromValue: (value: string): string => {
    return `${value}%`;
  },

  getValueFromDisplayedValue: (displayedValue: string): string => {
    return displayedValue.replace('%', '');
  },
});

const getFlippableButtons = ({
  i18n,
  canFlipZ,
}: {
  i18n: I18nType;
  canFlipZ: boolean;
}): Field => ({
  name: 'Flip',
  nonFieldType: 'toggleButtons',

  buttons: [
    {
      name: 'Flip horizontal',
      renderIcon: (className) => <FlipHorizontal className={className} />,
      tooltip: i18n._(t`Flip horizontally`),
      getValue: (instance: SchemaInstance): boolean =>
        (instance as gdInitialInstance).isFlippedX(),
      setValue: (instance: SchemaInstance, newValue: boolean) =>
        (instance as gdInitialInstance).setFlippedX(newValue),
    },
    {
      name: 'Flip vertical',
      tooltip: i18n._(t`Flip vertically`),
      renderIcon: (className) => <FlipVertical className={className} />,
      getValue: (instance: SchemaInstance): boolean =>
        (instance as gdInitialInstance).isFlippedY(),
      setValue: (instance: SchemaInstance, newValue: boolean) =>
        (instance as gdInitialInstance).setFlippedY(newValue),
    },
    ...(canFlipZ
      ? [
          {
            name: 'Flip Z',
            tooltip: i18n._(t` Flip along Z axis`),
            renderIcon: (className?: string) => <FlipZ className={className} />,
            getValue: (instance: SchemaInstance): boolean =>
              (instance as gdInitialInstance).isFlippedZ(),
            setValue: (instance: SchemaInstance, newValue: boolean) =>
              (instance as gdInitialInstance).setFlippedZ(newValue),
          },
        ]
      : []),
  ],
});

export const makeSchema = ({
  is3DInstance,
  hasOpacity,
  canBeFlippedXY,
  canBeFlippedZ,
  i18n,
  forceUpdate,
  onEditObject,
  onGetInstanceSize,
  layersContainer,
}: {
  is3DInstance: boolean;
  hasOpacity: boolean;
  canBeFlippedXY: boolean;
  canBeFlippedZ: boolean;
  i18n: I18nType;
  forceUpdate: () => void;
  onEditObject: (name: string) => void;
  onGetInstanceSize: (
    initialInstance: gdInitialInstance
  ) => [number, number, number];
  layersContainer: gdLayersContainer;
}): Schema => {
  const getInstanceWidth = (instance: gdInitialInstance) =>
    instance.hasCustomSize()
      ? instance.getCustomWidth()
      : onGetInstanceSize(instance)[0];

  const getInstanceHeight = (instance: gdInitialInstance) =>
    instance.hasCustomSize()
      ? instance.getCustomHeight()
      : onGetInstanceSize(instance)[1];

  const getInstanceDepth = (instance: gdInitialInstance) =>
    instance.hasCustomDepth()
      ? instance.getCustomDepth()
      : onGetInstanceSize(instance)[2];

  const getInstanceDefaultSize = (instance: gdInitialInstance): Size => {
    const hasCustomSize = instance.hasCustomSize();
    const hasCustomDepth = instance.hasCustomDepth();
    instance.setHasCustomSize(false);
    instance.setHasCustomDepth(false);
    const defaultSize = onGetInstanceSize(instance);
    instance.setHasCustomSize(hasCustomSize);
    instance.setHasCustomDepth(hasCustomDepth);
    return defaultSize;
  };

  if (is3DInstance) {
    const schema: Array<Field | null> = [
      getTitleRow({ i18n }),
      getEditObjectButton({ i18n, onEditObject, is3DInstance }),
      {
        name: 'Position',
        type: 'row',
        preventWrap: true,
        removeSpacers: true,
        children: [...getXAndYFields({ i18n }), getZField({ i18n })],
      },
      {
        name: 'Size',
        type: 'row',
        preventWrap: true,
        children: [
          {
            name: 'Custom size',
            type: 'column',
            children: [
              getWidthField({
                i18n,
                getInstanceWidth,
                getInstanceHeight,
                getInstanceDepth,
                getInstanceDefaultSize,
                forceUpdate,
              }),
              getHeightField({
                i18n,
                getInstanceWidth,
                getInstanceHeight,
                getInstanceDepth,
                getInstanceDefaultSize,
                forceUpdate,
              }),
              getDepthField({
                i18n,
                getInstanceWidth,
                getInstanceHeight,
                getInstanceDepth,
                getInstanceDefaultSize,
                forceUpdate,
              }),
            ],
          },
          {
            name: 'Keep ratio column',
            nonFieldType: 'verticalCenterWithBar',
            child: getKeepRatioField({
              i18n,
              getInstanceWidth,
              getInstanceHeight,
              getInstanceDepth,
              forceUpdate,
            }),
          },
        ],
      },
      hasOpacity
        ? {
            name: 'Opacity',
            type: 'row',
            preventWrap: true,
            removeSpacers: true,
            children: [getOpacityField({ i18n })],
          }
        : null,
      getLayerField({ i18n, layersContainer }),
      {
        name: 'Rotation',
        type: 'row',
        title: i18n._(t`Rotation`),
        preventWrap: true,
        removeSpacers: true,
        children: canBeFlippedXY
          ? [getFlippableButtons({ i18n, canFlipZ: canBeFlippedZ })]
          : [],
      },
      {
        name: 'Rotation X and Y',
        type: 'row',
        preventWrap: true,
        removeSpacers: true,
        children: [
          ...getRotationXAndRotationYFields({ i18n }),
          getRotationZField({ i18n }),
        ],
      },
    ];
    return schema.filter((field): field is Field => Boolean(field));
  }

  const schema: Array<Field | null> = [
    getTitleRow({ i18n }),
    getEditObjectButton({ i18n, onEditObject, is3DInstance }),
    {
      name: 'Position',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: getXAndYFields({ i18n }),
    },
    getZOrderField({ i18n }),
    {
      name: 'Size',
      type: 'row',
      preventWrap: true,
      children: [
        {
          name: 'Custom size',
          type: 'column',
          children: [
            getWidthField({
              i18n,
              getInstanceWidth,
              getInstanceHeight,
              getInstanceDepth,
              getInstanceDefaultSize,
              forceUpdate,
            }),
            getHeightField({
              i18n,
              getInstanceWidth,
              getInstanceHeight,
              getInstanceDepth,
              getInstanceDefaultSize,
              forceUpdate,
            }),
          ],
        },
        {
          name: 'Keep ratio column',
          nonFieldType: 'verticalCenterWithBar',
          child: getKeepRatioField({
            i18n,
            getInstanceWidth,
            getInstanceHeight,
            getInstanceDepth,
            forceUpdate,
          }),
        },
      ],
    },
    hasOpacity
      ? {
          name: 'Opacity',
          type: 'row',
          preventWrap: true,
          removeSpacers: true,
          children: [getOpacityField({ i18n })],
        }
      : null,
    getLayerField({ i18n, layersContainer }),
    {
      name: 'Rotation',
      type: 'row',
      title: i18n._(t`Rotation`),
      preventWrap: true,
      removeSpacers: true,
      children: canBeFlippedXY
        ? [getFlippableButtons({ i18n, canFlipZ: canBeFlippedZ })]
        : [],
    },
    {
      name: 'Rotation Z',
      type: 'row',
      preventWrap: true,
      removeSpacers: true,
      children: [getRotationZField({ i18n })],
    },
  ];
  return schema.filter((field): field is Field => Boolean(field));
};

export const reorderInstanceSchemaForCustomProperties = (
  schema: Schema,
  i18n: I18nType
): Schema => {
  const newSchema = [...schema];
  const animationFieldIndex = newSchema.findIndex(
    (field) => 'name' in field && field.name === 'animation'
  );
  const contentSectionTitle: SectionTitle = {
    nonFieldType: 'sectionTitle',
    name: 'Content',
    title: i18n._(t`Content`),
    getValue: undefined,
  };
  if (animationFieldIndex === -1) {
    if (newSchema.length > 0) {
      newSchema.unshift(contentSectionTitle);
    }
    return newSchema;
  }

  const [animationField] = newSchema.splice(animationFieldIndex, 1);

  const firstFields: Schema = [
    {
      name: 'Animation',
      type: 'row',
      title: i18n._(t`Animation`),
      children: [{ ...animationField, hideLabel: true } as Field],
    },
  ];
  if (newSchema.length > 0) {
    firstFields.push(contentSectionTitle);
  }
  newSchema.unshift(...firstFields);
  return newSchema;
};
