// @flow
import * as PIXI from 'pixi.js';

const transparentBackgroundTexturePath = 'res/transparentback.png';
let transparentBackgroundTexturePromise: Promise<any> | null = null;

const getLoadedTransparentBackgroundTexture = () => {
  // $FlowFixMe[prop-missing] PixiJS v8 exposes Cache, but the Flow typedefs used here are partial.
  return PIXI.Cache.has(transparentBackgroundTexturePath)
    ? PIXI.Assets.get(transparentBackgroundTexturePath)
    : null;
};

const loadTransparentBackgroundTexture = () => {
  if (!transparentBackgroundTexturePromise) {
    transparentBackgroundTexturePromise = PIXI.Assets.load(
      transparentBackgroundTexturePath
    ).catch(error => {
      transparentBackgroundTexturePromise = null;
      throw error;
    });
  }

  return transparentBackgroundTexturePromise;
};

type Props = {
  width: number,
  height: number,
  layout: gdLayout | null,
};

export default class Background {
  // $FlowFixMe[value-as-type]
  _checkeredBackground: PIXI.TilingSprite;

  constructor({ width, height, layout }: Props) {
    const texture = getLoadedTransparentBackgroundTexture();
    this._checkeredBackground = new PIXI.TilingSprite({
      texture: texture || PIXI.Texture.EMPTY,
      width,
      height,
    });
    this._checkeredBackground.tint = 0x444444;
    this._checkeredBackground.visible = !layout;

    if (!texture && !layout) {
      loadTransparentBackgroundTexture()
        .then(texture => {
          if (!this._checkeredBackground.destroyed) {
            this._checkeredBackground.texture = texture;
          }
        })
        .catch(error => {
          console.error(
            `Unable to load editor background texture "${transparentBackgroundTexturePath}":`,
            error
          );
        });
    }
  }

  resize(width: number, height: number) {
    this._checkeredBackground.width = width;
    this._checkeredBackground.height = height;
  }

  // $FlowFixMe[value-as-type]
  getPixiObject(): PIXI.TilingSprite {
    return this._checkeredBackground;
  }

  render() {}
}
