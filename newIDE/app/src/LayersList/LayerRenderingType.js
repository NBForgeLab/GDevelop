// @flow

export type LayerRenderingType = '2d' | '3d';

export const BASE_LAYER_NAME = '';

export const isBaseLayer = (layer: gdLayer): boolean =>
  layer.getName() === BASE_LAYER_NAME;

export const getLayerRenderingType = (layer: gdLayer): LayerRenderingType => {
  if (isBaseLayer(layer)) {
    return '3d';
  }

  return layer.getRenderingType() === '2d' ? '2d' : '3d';
};

export const setLayerRenderingType = (
  layer: gdLayer,
  renderingType: LayerRenderingType
): void => {
  layer.setRenderingType(isBaseLayer(layer) ? '3d' : renderingType);
};

const getOptionalLayerNumber = (
  layer: gdLayer,
  getterName: string,
  defaultValue: number
): number => {
  const unsafeLayer = (layer: any);
  const getter = unsafeLayer[getterName];
  return typeof getter === 'function' ? getter.call(unsafeLayer) : defaultValue;
};

const getOptionalLayerBoolean = (
  layer: gdLayer,
  getterName: string,
  defaultValue: boolean
): boolean => {
  const unsafeLayer = (layer: any);
  const getter = unsafeLayer[getterName];
  return typeof getter === 'function' ? getter.call(unsafeLayer) : defaultValue;
};

export const getLayerVisibility = (layer: gdLayer): boolean =>
  getOptionalLayerBoolean(layer, 'getVisibility', true);

export const isLayerLocked = (layer: gdLayer): boolean =>
  getOptionalLayerBoolean(layer, 'isLocked', false);

export const getLayerOpacity = (layer: gdLayer): number =>
  getOptionalLayerNumber(layer, 'getOpacity', 255);

export const getLayerAlpha = (layer: gdLayer): number =>
  Math.max(0, Math.min(1, getLayerOpacity(layer) / 255));
