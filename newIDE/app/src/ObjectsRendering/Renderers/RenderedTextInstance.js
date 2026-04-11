// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import ResourcesLoader from '../../ResourcesLoader';
import * as THREE from 'three';
const gd: libGDevelop = global.gd;

/**
 * Renderer for a Text object using Three.js and a canvas texture.
 */
export default class RenderedTextInstance extends RenderedInstance {
  _isItalic: boolean = false;
  _isBold: boolean = false;
  _characterSize: number = 0;
  _wrapping: boolean = false;
  _wrappingWidth: number = 0;
  _styleFontDirty: boolean = true;
  _fontName: string = '';
  _fontFamily: string = '';
  _color: string = '0;0;0';
  _textAlignment: string = 'left';
  _verticalTextAlignment: string = 'top';
  _lineHeight = 0;
  _textObjStr: string = '';
  _canvas: HTMLCanvasElement;
  _context: CanvasRenderingContext2D;
  _canvasTexture: THREE.CanvasTexture;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    // $FlowFixMe[value-as-type]
    threeGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>,
    getPropertyOverridings: (() => Map<string, string>) | null
  ) {
    super(
      project,
      instance,
      associatedObjectConfiguration,
      threeGroup,
      resourcesLoader,
      getPropertyOverridings
    );

    this._canvas = document.createElement('canvas');
    const context = this._canvas.getContext('2d');
    if (!context) throw new Error('Unable to create 2D context for text.');
    this._context = context;
    this._canvasTexture = new THREE.CanvasTexture(this._canvas);
    this._canvasTexture.minFilter = THREE.LinearFilter;
    this._canvasTexture.magFilter = THREE.LinearFilter;

    const geometry = new THREE.PlaneGeometry(1, 1);

    const material = new THREE.MeshBasicMaterial({
      map: this._canvasTexture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this._threeObject = new THREE.Mesh(geometry, material);
    this._threeObject.userData.instance = instance;
    this._threeObject.rotation.order = 'ZYX';
    this._layerGroup.add(this._threeObject);
    this.update();
  }

  onRemovedFromScene(): void {
    if (this._threeObject) {
      this._layerGroup.remove(this._threeObject);
      if (this._threeObject.material) this._threeObject.material.dispose();
      if (this._threeObject.geometry) this._threeObject.geometry.dispose();
      this._threeObject.userData.instance = null;
      this._threeObject = null;
    }
    this._canvasTexture.dispose();
    this._wasDestroyed = true;
  }

  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): any {
    return 'CppPlatform/Extensions/texticon24.png';
  }

  _renderText() {
    const textStr = this._textObjStr || ' ';
    const lines = textStr.split('\n');

    let fontStr = '';
    if (this._isItalic) fontStr += 'italic ';
    if (this._isBold) fontStr += 'bold ';
    fontStr += `${Math.max(1, this._characterSize || 20)}px ${this
      ._fontFamily || 'Arial'}`;

    this._context.font = fontStr;

    let maxWidth = 0;
    for (const line of lines) {
      const metrics = this._context.measureText(line);
      if (metrics.width > maxWidth) maxWidth = metrics.width;
    }

    const padding = 10;
    const canvasHeight =
      lines.length * ((this._characterSize || 20) + this._lineHeight) + padding;
    const canvasWidth =
      this._wrapping && this._wrappingWidth > 0
        ? this._wrappingWidth
        : maxWidth + padding;

    this._canvas.width = Math.max(1, Math.ceil(canvasWidth));
    this._canvas.height = Math.max(1, Math.ceil(canvasHeight));

    this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._context.font = fontStr;
    this._context.textBaseline = 'top';
    this._context.fillStyle = `#${parseInt(
      this._color
        .split(';')
        .map(value => Math.max(0, Math.min(255, parseInt(value, 10) || 0)))
        .map(value => value.toString(16).padStart(2, '0'))
        .join(''),
      16
    )
      .toString(16)
      .padStart(6, '0')}`;

    let y = padding / 2;
    for (const line of lines) {
      const lineWidth = this._context.measureText(line).width;
      let x = padding / 2;
      if (this._textAlignment === 'center') {
        x = (this._canvas.width - lineWidth) / 2;
      } else if (this._textAlignment === 'right') {
        x = this._canvas.width - lineWidth - padding / 2;
      }
      this._context.fillText(line, x, y);
      y += (this._characterSize || 20) + this._lineHeight;
    }

    this._canvasTexture.needsUpdate = true;
    if (this._threeObject) {
      this._threeObject.scale.set(this._canvas.width, this._canvas.height, 1);
    }
  }

  update() {
    const textObjectConfiguration = gd.asTextObjectConfiguration(
      this._associatedObjectConfiguration
    );
    const propertyOverridings = this.getPropertyOverridings();
    this._textObjStr =
      propertyOverridings && propertyOverridings.has('Text')
        ? propertyOverridings.get('Text') || ''
        : textObjectConfiguration.getText();

    if (
      textObjectConfiguration.isItalic() !== this._isItalic ||
      textObjectConfiguration.isBold() !== this._isBold ||
      textObjectConfiguration.getCharacterSize() !== this._characterSize ||
      textObjectConfiguration.getLineHeight() !== this._lineHeight ||
      textObjectConfiguration.getTextAlignment() !== this._textAlignment ||
      textObjectConfiguration.getVerticalTextAlignment() !==
        this._verticalTextAlignment ||
      textObjectConfiguration.getColor() !== this._color ||
      this._instance.hasCustomSize() !== this._wrapping ||
      (this._instance.hasCustomSize() &&
        this.getCustomWidth() !== this._wrappingWidth)
    ) {
      this._isItalic = textObjectConfiguration.isItalic();
      this._isBold = textObjectConfiguration.isBold();
      this._characterSize = textObjectConfiguration.getCharacterSize();
      this._lineHeight = textObjectConfiguration.getLineHeight();
      this._textAlignment = textObjectConfiguration.getTextAlignment();
      this._verticalTextAlignment = textObjectConfiguration.getVerticalTextAlignment();
      this._color = textObjectConfiguration.getColor();
      this._wrapping = this._instance.hasCustomSize();
      this._wrappingWidth = this.getCustomWidth();
      this._styleFontDirty = true;
    }

    if (this._fontName !== textObjectConfiguration.getFontName()) {
      this._fontName = textObjectConfiguration.getFontName();
      this._resourcesLoader
        .loadFontFamily(this._project, textObjectConfiguration.getFontName())
        .then(fontFamily => {
          if (this._wasDestroyed) return;
          this._fontFamily = fontFamily;
          this._styleFontDirty = true;
          this._renderText();
        })
        .catch(error => {
          console.warn(
            'Unable to load font family for RenderedTextInstance',
            error
          );
        });
    }

    if (this._styleFontDirty) {
      this._renderText();
      this._styleFontDirty = false;
    }

    if (this._threeObject) {
      const width = this._canvas.width || 1;
      const height = this._canvas.height || 1;
      const alignmentX =
        this._textAlignment === 'right'
          ? 1
          : this._textAlignment === 'center'
          ? 0.5
          : 0;
      const alignmentY =
        this._verticalTextAlignment === 'bottom'
          ? 1
          : this._verticalTextAlignment === 'center'
          ? 0.5
          : 0;

      let positionX = this._instance.getX() + width / 2;
      if (this._instance.hasCustomSize()) {
        const customWidth = this.getCustomWidth();
        positionX += (customWidth - width) * alignmentX;
      }
      const positionY =
        this._instance.getY() - height * alignmentY - height / 2;

      this._threeObject.position.set(
        positionX,
        positionY,
        this._instance.getZ()
      );
      this._threeObject.rotation.z = THREE.MathUtils.degToRad(
        this._instance.getAngle()
      );
      this._threeObject.material.opacity = Math.max(
        this._instance.getOpacity() / 255,
        0.5
      );
    }
  }

  getDefaultWidth(): any {
    return this._canvas.width;
  }

  getDefaultHeight(): any {
    return this._canvas.height;
  }

  getOriginY(): number {
    const height = this.getHeight();
    return this._verticalTextAlignment === 'bottom'
      ? height
      : this._verticalTextAlignment === 'center'
      ? height / 2
      : 0;
  }
}
