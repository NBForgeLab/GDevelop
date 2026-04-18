namespace gdjs {
  const getPanelTextureSize = (
    texture: THREE.Texture | null
  ): { width: number; height: number } => {
    if (!texture || !texture.image) {
      return { width: 0, height: 0 };
    }

    return {
      width: (texture.image as any).width || 0,
      height: (texture.image as any).height || 0,
    };
  };

  const createPanelTextureRegion = (
    baseTexture: THREE.Texture,
    x: number,
    y: number,
    width: number,
    height: number,
    textureWidth: number,
    textureHeight: number,
    tiled: boolean
  ): THREE.Texture => {
    const texture = baseTexture.clone();
    texture.needsUpdate = true;
    texture.repeat.set(
      width / Math.max(textureWidth, 1),
      height / Math.max(textureHeight, 1)
    );
    texture.offset.set(
      x / Math.max(textureWidth, 1),
      1 - (y + height) / Math.max(textureHeight, 1)
    );
    texture.wrapS = tiled ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    texture.wrapT = tiled ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    return texture;
  };

  const updatePanelRegionTextureRepeat = (
    texture: THREE.Texture,
    regionWidth: number,
    regionHeight: number,
    displayWidth: number,
    displayHeight: number,
    textureWidth: number,
    textureHeight: number,
    tiled: boolean
  ) => {
    texture.repeat.set(
      (tiled ? displayWidth : regionWidth) / Math.max(textureWidth, 1),
      (tiled ? displayHeight : regionHeight) / Math.max(textureHeight, 1)
    );
    texture.wrapS = tiled ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    texture.wrapT = tiled ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
  };

  /**
   * The Three.js renderer for the Panel Sprite runtime object.
   * @category Renderers > Panel Sprite
   */
  export class PanelSpriteRuntimeObjectThreeRenderer {
    _object: gdjs.PanelSpriteRuntimeObject;
    _group: THREE.Group;
    _meshes: THREE.Mesh[] = [];
    _materials: THREE.MeshBasicMaterial[] = [];
    _textures: THREE.Texture[] = [];
    _baseTexture: THREE.Texture | null = null;
    _textureWidth = 0;
    _textureHeight = 0;
    _tiled: boolean;
    private _geometry = new THREE.PlaneGeometry(1, 1);

    constructor(
      runtimeObject: gdjs.PanelSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string,
      tiled: boolean
    ) {
      this._object = runtimeObject;
      this._tiled = tiled;
      this._group = new THREE.Group();
      this._group.rotation.order = 'ZYX';

      for (let i = 0; i < 9; ++i) {
        const material = new THREE.MeshBasicMaterial({
          transparent: true,
          depthTest: false,
          depthWrite: false,
          color: 0xffffff,
        });
        const mesh = new THREE.Mesh(this._geometry, material);
        mesh.userData.gdjsIs2DRendererObject = true;
        this._materials.push(material);
        this._meshes.push(mesh);
        this._group.add(mesh);
      }

      instanceContainer
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .addRendererObject(this._group, runtimeObject.getZOrder());

      this.setTexture(textureName, instanceContainer);
      this.updatePosition();
      this.updateAngle();
      this.updateOpacity();
    }

    getRendererObject() {
      return this._group;
    }

    ensureUpToDate() {}

    private _setRegionTexture(
      meshIndex: number,
      x: number,
      y: number,
      width: number,
      height: number,
      tiled: boolean
    ) {
      if (!this._baseTexture) {
        return;
      }

      const previousTexture = this._textures[meshIndex];
      if (previousTexture) {
        previousTexture.dispose();
      }

      const texture = createPanelTextureRegion(
        this._baseTexture,
        x,
        y,
        width,
        height,
        this._textureWidth,
        this._textureHeight,
        tiled
      );
      this._textures[meshIndex] = texture;
      this._materials[meshIndex].map = texture;
      this._materials[meshIndex].needsUpdate = true;
    }

    private _updateRegion(
      meshIndex: number,
      x: number,
      y: number,
      width: number,
      height: number,
      regionWidth: number,
      regionHeight: number,
      tiled: boolean
    ) {
      const mesh = this._meshes[meshIndex];
      mesh.visible = width > 0 && height > 0;
      if (!mesh.visible) {
        return;
      }

      mesh.position.set(
        x + width / 2 - this._object._width / 2,
        y + height / 2 - this._object._height / 2,
        0
      );
      mesh.scale.set(width, height, 1);

      const texture = this._textures[meshIndex];
      if (texture) {
        updatePanelRegionTextureRepeat(
          texture,
          regionWidth,
          regionHeight,
          width,
          height,
          this._textureWidth,
          this._textureHeight,
          tiled
        );
      }
    }

    private _updateMeshes() {
      const obj = this._object;
      const centerWidth = Math.max(obj._width - obj._lBorder - obj._rBorder, 0);
      const centerHeight = Math.max(
        obj._height - obj._tBorder - obj._bBorder,
        0
      );

      let leftMargin = obj._lBorder;
      let rightMargin = obj._rBorder;
      if (centerWidth === 0 && obj._lBorder + obj._rBorder > 0) {
        leftMargin =
          (obj._width * obj._lBorder) / (obj._lBorder + obj._rBorder);
        rightMargin = obj._width - leftMargin;
      }

      let topMargin = obj._tBorder;
      let bottomMargin = obj._bBorder;
      if (centerHeight === 0 && obj._tBorder + obj._bBorder > 0) {
        topMargin =
          (obj._height * obj._tBorder) / (obj._tBorder + obj._bBorder);
        bottomMargin = obj._height - topMargin;
      }

      const left = 0;
      const top = 0;
      const centerX = leftMargin;
      const centerY = topMargin;
      const rightX = obj._width - rightMargin;
      const bottomY = obj._height - bottomMargin;

      this._updateRegion(
        0,
        centerX,
        centerY,
        centerWidth,
        centerHeight,
        centerWidth,
        centerHeight,
        obj._tiled
      );
      this._updateRegion(
        1,
        rightX,
        centerY,
        rightMargin,
        centerHeight,
        obj._rBorder,
        centerHeight,
        obj._tiled
      );
      this._updateRegion(
        2,
        rightX,
        top,
        rightMargin,
        topMargin,
        obj._rBorder,
        obj._tBorder,
        false
      );
      this._updateRegion(
        3,
        centerX,
        top,
        centerWidth,
        topMargin,
        centerWidth,
        obj._tBorder,
        obj._tiled
      );
      this._updateRegion(
        4,
        left,
        top,
        leftMargin,
        topMargin,
        obj._lBorder,
        obj._tBorder,
        false
      );
      this._updateRegion(
        5,
        left,
        centerY,
        leftMargin,
        centerHeight,
        obj._lBorder,
        centerHeight,
        obj._tiled
      );
      this._updateRegion(
        6,
        left,
        bottomY,
        leftMargin,
        bottomMargin,
        obj._lBorder,
        obj._bBorder,
        false
      );
      this._updateRegion(
        7,
        centerX,
        bottomY,
        centerWidth,
        bottomMargin,
        centerWidth,
        obj._bBorder,
        obj._tiled
      );
      this._updateRegion(
        8,
        rightX,
        bottomY,
        rightMargin,
        bottomMargin,
        obj._rBorder,
        obj._bBorder,
        false
      );
    }

    setTexture(
      textureName: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      this._baseTexture = instanceContainer
        .getGame()
        .getImageManager()
        .getThreeTexture(textureName);
      const textureSize = getPanelTextureSize(this._baseTexture);
      this._textureWidth = textureSize.width;
      this._textureHeight = textureSize.height;

      const obj = this._object;
      this._setRegionTexture(
        0,
        obj._lBorder,
        obj._tBorder,
        Math.max(this._textureWidth - obj._lBorder - obj._rBorder, 0),
        Math.max(this._textureHeight - obj._tBorder - obj._bBorder, 0),
        obj._tiled
      );
      this._setRegionTexture(
        1,
        this._textureWidth - obj._rBorder,
        obj._tBorder,
        obj._rBorder,
        Math.max(this._textureHeight - obj._tBorder - obj._bBorder, 0),
        obj._tiled
      );
      this._setRegionTexture(
        2,
        this._textureWidth - obj._rBorder,
        0,
        obj._rBorder,
        obj._tBorder,
        false
      );
      this._setRegionTexture(
        3,
        obj._lBorder,
        0,
        Math.max(this._textureWidth - obj._lBorder - obj._rBorder, 0),
        obj._tBorder,
        obj._tiled
      );
      this._setRegionTexture(4, 0, 0, obj._lBorder, obj._tBorder, false);
      this._setRegionTexture(
        5,
        0,
        obj._tBorder,
        obj._lBorder,
        Math.max(this._textureHeight - obj._tBorder - obj._bBorder, 0),
        obj._tiled
      );
      this._setRegionTexture(
        6,
        0,
        this._textureHeight - obj._bBorder,
        obj._lBorder,
        obj._bBorder,
        false
      );
      this._setRegionTexture(
        7,
        obj._lBorder,
        this._textureHeight - obj._bBorder,
        Math.max(this._textureWidth - obj._lBorder - obj._rBorder, 0),
        obj._bBorder,
        obj._tiled
      );
      this._setRegionTexture(
        8,
        this._textureWidth - obj._rBorder,
        this._textureHeight - obj._bBorder,
        obj._rBorder,
        obj._bBorder,
        false
      );

      this._updateMeshes();
    }

    updateOpacity(): void {
      const opacity = this._object.opacity / 255;
      for (const material of this._materials) {
        material.opacity = opacity;
      }
    }

    updateAngle(): void {
      this._group.rotation.z = gdjs.toRad(this._object.angle);
    }

    updatePosition(): void {
      this._group.position.set(
        this._object.x + this._object._width / 2,
        this._object.y + this._object._height / 2,
        this._object.getZOrder()
      );
      this._group.renderOrder = 100000 + this._object.getZOrder();
    }

    updateWidth(): void {
      this._updateMeshes();
      this.updatePosition();
    }

    updateHeight(): void {
      this._updateMeshes();
      this.updatePosition();
    }

    setColor(rgbOrHexColor: string): void {
      const tint = gdjs.rgbOrHexStringToNumber(rgbOrHexColor);
      for (const material of this._materials) {
        material.color.setHex(tint);
      }
    }

    getColor() {
      const color = this._materials[0].color;
      return (
        Math.round(color.r * 255) +
        ';' +
        Math.round(color.g * 255) +
        ';' +
        Math.round(color.b * 255)
      );
    }

    getTextureWidth() {
      return this._textureWidth;
    }

    getTextureHeight() {
      return this._textureHeight;
    }

    destroy() {
      for (const texture of this._textures) {
        if (texture) texture.dispose();
      }
      for (const material of this._materials) {
        material.dispose();
      }
      this._group.clear();
      this._geometry.dispose();
    }
  }
}
