/*
 * GDevelop JS Platform
 * Copyright 2013-2016 Florian Rival (Florian.Rival@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */
namespace gdjs {
  const logger = new gdjs.Logger('PIXI Image manager');

  const logFileLoadingError = (file: string, error: Error | undefined) => {
    logger.error(
      'Unable to load file ' + file + ' with error:',
      error ? error : '(unknown error)'
    );
  };

  const applyTextureSettings = (
    texture: PIXI.Texture | undefined,
    resourceData: ResourceData
  ) => {
    if (!texture) return;

    if (!resourceData.smoothed) {
      texture.source.scaleMode = 'nearest';
    }
  };

  const isTextureReady = (
    texture: PIXI.Texture | null | undefined
  ): boolean => {
    return !!(
      texture &&
      !texture.destroyed &&
      texture.source &&
      !texture.source.destroyed &&
      texture.source !== PIXI.Texture.EMPTY.source &&
      texture.source.width > 0 &&
      texture.source.height > 0
    );
  };

  const getResourceCrossOrigin = (
    resourceLoader: gdjs.ResourceLoader,
    file: string
  ): string =>
    resourceLoader.checkIfCredentialsRequired(file)
      ? 'use-credentials'
      : 'anonymous';

  const createInvalidTexture = (): PIXI.Texture => {
    const canvas = PIXI.DOMAdapter.get().createCanvas(
      192,
      192
    ) as HTMLCanvasElement;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ff00ff';
      context.fillRect(0, 0, 192, 192);
    }
    return PIXI.Texture.from(canvas, true);
  };

  const applyThreeTextureSettings = (
    threeTexture: THREE.Texture,
    resourceData: ResourceData | null
  ) => {
    if (resourceData && !resourceData.smoothed) {
      threeTexture.magFilter = THREE.NearestFilter;
      threeTexture.minFilter = THREE.NearestFilter;
    }
  };

  const resourceKinds: Array<ResourceKind> = ['image', 'video'];

  /**
   * PixiImageManager loads and stores textures that can be used by the Pixi.js renderers.
   * @category Resources > Images/Textures
   */
  export class PixiImageManager implements gdjs.ResourceManager {
    /**
     * The invalid texture is a 8x8 PNG file filled with magenta (#ff00ff), to be
     * easily spotted if rendered on screen.
     */
    private _invalidTexture: PIXI.Texture;

    /**
     * Map associating a resource name to the loaded PixiJS texture.
     */
    private _loadedTextures = new gdjs.ResourceCache<PIXI.Texture>();

    /**
     * Map associating a resource name to the loaded Three.js texture.
     */
    private _loadedThreeTextures: Hashtable<THREE.Texture>;
    private _loadedThreeMaterials = new ThreeMaterialCache();
    private _loadedThreeCubeTextures = new Map<string, THREE.CubeTexture>();
    private _loadedThreeCubeTextureKeysByResourceName = new ArrayMap<
      string,
      string
    >();

    private _diskTextures = new Map<float, PIXI.Texture>();
    private _rectangleTextures = new Map<string, PIXI.Texture>();
    private _scaledTextures = new Map<string, PIXI.Texture>();

    private _resourceLoader: gdjs.ResourceLoader;

    /**
     * @param resourceLoader The resources loader of the game.
     */
    constructor(resourceLoader: gdjs.ResourceLoader) {
      this._resourceLoader = resourceLoader;
      this._invalidTexture = createInvalidTexture();
      this._loadedThreeTextures = new Hashtable();
    }

    getResourceKinds(): ResourceKind[] {
      return resourceKinds;
    }

    /**
     * Return the PIXI texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param resourceName The name of the resource
     * @returns The requested texture, or a placeholder if not found.
     */
    getPIXITexture(resourceName: string): PIXI.Texture {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find texture for resource "' + resourceName + '".'
        );
        return this._invalidTexture;
      }

      const existingTexture = this._loadedTextures.get(resource);
      if (!existingTexture) {
        return this._invalidTexture;
      }
      if (existingTexture.destroyed) {
        logger.error('Texture for ' + resourceName + ' is not valid anymore.');
        return this._invalidTexture;
      }
      if (!isTextureReady(existingTexture)) {
        logger.error(
          'Texture for ' +
            resourceName +
            ' is not valid anymore (or never was).'
        );
        return this._invalidTexture;
      }

      return existingTexture;
    }

    /**
     * Return the PIXI texture associated to the specified resource name.
     * If not found in the loaded textures, this method will try to load it.
     * Warning: this method should only be used in specific cases that cannot rely on
     * the initial resources loading of the game, such as the splashscreen.
     * @param resourceName The name of the resource
     * @returns The requested texture, or a placeholder if not valid.
     */
    getOrLoadPIXITexture(resourceName: string): PIXI.Texture {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find texture for resource "' + resourceName + '".'
        );
        return this._invalidTexture;
      }

      const existingTexture = this._loadedTextures.get(resource);
      if (existingTexture) {
        if (isTextureReady(existingTexture)) {
          return existingTexture;
        } else if (
          existingTexture.source &&
          existingTexture.source === PIXI.Texture.EMPTY.source
        ) {
          return existingTexture;
        } else {
          logger.error(
            'Texture for ' +
              resourceName +
              ' is not valid anymore (or never was).'
          );
          return this._invalidTexture;
        }
      }

      logger.log('Loading texture for resource "' + resourceName + '"...');
      const texture = new PIXI.Texture({
        source: PIXI.Texture.EMPTY.source,
        dynamic: true,
      });
      this._loadedTextures.set(resource, texture);
      this._loadTexture(resource, texture).catch(error =>
        logFileLoadingError(resource.file, error)
      );
      return texture;
    }

    /**
     * Return the three.js texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param resourceName The name of the resource
     * @returns The requested texture, or a placeholder if not found.
     */
    getThreeTexture(resourceName: string): THREE.Texture {
      const loadedThreeTexture = this._loadedThreeTextures.get(resourceName);
      if (loadedThreeTexture) {
        return loadedThreeTexture;
      }
      const image = this._getImageSource(resourceName);

      const threeTexture = new THREE.Texture(image);
      threeTexture.magFilter = THREE.LinearFilter;
      threeTexture.minFilter = THREE.LinearFilter;
      threeTexture.wrapS = THREE.RepeatWrapping;
      threeTexture.wrapT = THREE.RepeatWrapping;
      threeTexture.colorSpace = THREE.SRGBColorSpace;
      threeTexture.needsUpdate = true;

      const resource = this._getImageResource(resourceName);

      applyThreeTextureSettings(threeTexture, resource);
      this._loadedThreeTextures.put(resourceName, threeTexture);

      return threeTexture;
    }

    private _getImageSource(resourceName: string): HTMLImageElement {
      // Texture is not loaded, load it now from the PixiJS texture.
      // TODO (3D) - optimization: don't load the PixiJS Texture if not used by PixiJS.
      // TODO (3D) - optimization: Ideally we could even share the same WebGL texture.
      const pixiTexture = this.getPIXITexture(resourceName);
      const pixiRenderer = this._resourceLoader._runtimeGame
        .getRenderer()
        .getPIXIRenderer();
      if (!pixiRenderer) throw new Error('No PIXI renderer was found.');

      const image = pixiTexture.source.resource;
      if (!(image instanceof HTMLImageElement)) {
        throw new Error(
          `Can't load texture for resource "${resourceName}" as it's not an image.`
        );
      }
      return image;
    }

    /**
     * Return the three.js texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param xPositiveResourceName The name of the resource
     * @returns The requested cube texture, or a placeholder if not found.
     */
    getThreeCubeTexture(
      xPositiveResourceName: string,
      xNegativeResourceName: string,
      yPositiveResourceName: string,
      yNegativeResourceName: string,
      zPositiveResourceName: string,
      zNegativeResourceName: string
    ): THREE.CubeTexture {
      const key =
        xPositiveResourceName +
        '|' +
        xNegativeResourceName +
        '|' +
        yPositiveResourceName +
        '|' +
        yNegativeResourceName +
        '|' +
        zPositiveResourceName +
        '|' +
        zNegativeResourceName;
      const loadedThreeTexture = this._loadedThreeCubeTextures.get(key);
      if (loadedThreeTexture) {
        return loadedThreeTexture;
      }

      const cubeTexture = new THREE.CubeTexture();
      // Faces on X axis need to be swapped.
      cubeTexture.images[0] = this._getImageSource(xNegativeResourceName);
      cubeTexture.images[1] = this._getImageSource(xPositiveResourceName);
      // Faces on Y keep the same order.
      cubeTexture.images[2] = this._getImageSource(yPositiveResourceName);
      cubeTexture.images[3] = this._getImageSource(yNegativeResourceName);
      // Faces on Z keep the same order.
      cubeTexture.images[4] = this._getImageSource(zPositiveResourceName);
      cubeTexture.images[5] = this._getImageSource(zNegativeResourceName);
      // The images also need to be mirrored horizontally by users.

      cubeTexture.magFilter = THREE.LinearFilter;
      cubeTexture.minFilter = THREE.LinearFilter;
      cubeTexture.colorSpace = THREE.SRGBColorSpace;
      cubeTexture.needsUpdate = true;

      const resource = this._getImageResource(xPositiveResourceName);
      applyThreeTextureSettings(cubeTexture, resource);
      this._loadedThreeCubeTextures.set(key, cubeTexture);
      this._loadedThreeCubeTextureKeysByResourceName.add(
        xPositiveResourceName,
        key
      );
      this._loadedThreeCubeTextureKeysByResourceName.add(
        xNegativeResourceName,
        key
      );
      this._loadedThreeCubeTextureKeysByResourceName.add(
        yPositiveResourceName,
        key
      );
      this._loadedThreeCubeTextureKeysByResourceName.add(
        yNegativeResourceName,
        key
      );
      this._loadedThreeCubeTextureKeysByResourceName.add(
        zPositiveResourceName,
        key
      );
      this._loadedThreeCubeTextureKeysByResourceName.add(
        zNegativeResourceName,
        key
      );

      return cubeTexture;
    }

    /**
     * Return the three.js material associated to the specified resource name.
     * @param resourceName The name of the resource
     * @param options
     * @returns The requested material.
     */
    getThreeMaterial(
      resourceName: string,
      options: {
        useTransparentTexture: boolean;
        forceBasicMaterial: boolean;
        vertexColors: boolean;
      }
    ): THREE.Material {
      const loadedThreeMaterial = this._loadedThreeMaterials.get(
        resourceName,
        options
      );
      if (loadedThreeMaterial) return loadedThreeMaterial;

      const material = options.forceBasicMaterial
        ? new THREE.MeshBasicMaterial({
            map: this.getThreeTexture(resourceName),
            side: options.useTransparentTexture
              ? THREE.DoubleSide
              : THREE.FrontSide,
            transparent: options.useTransparentTexture,
            vertexColors: options.vertexColors,
          })
        : new THREE.MeshStandardMaterial({
            map: this.getThreeTexture(resourceName),
            side: options.useTransparentTexture
              ? THREE.DoubleSide
              : THREE.FrontSide,
            transparent: options.useTransparentTexture,
            metalness: 0,
            vertexColors: options.vertexColors,
          });
      this._loadedThreeMaterials.set(resourceName, options, material);
      return material;
    }

    /**
     * Return the PIXI video texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param resourceName The name of the resource to get.
     */
    getPIXIVideoTexture(resourceName: string) {
      if (resourceName === '') {
        return this._invalidTexture;
      }
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find video texture for resource "' + resourceName + '".'
        );
        return this._invalidTexture;
      }

      const texture = this._loadedTextures.get(resource);
      if (!texture) {
        return this._invalidTexture;
      }
      return texture;
    }

    private _getImageResource = (resourceName: string): ResourceData | null => {
      const resource = this._resourceLoader.getResource(resourceName);
      return resource && this.getResourceKinds().includes(resource.kind)
        ? resource
        : null;
    };

    /**
     * Return a PIXI texture which can be used as a placeholder when no
     * suitable texture can be found.
     */
    getInvalidPIXITexture() {
      return this._invalidTexture;
    }

    /**
     * Load the specified resources, so that textures are loaded and can then be
     * used by calling `getPIXITexture`.
     */
    async loadResource(resourceName: string): Promise<void> {
      const resource = this._resourceLoader.getResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find texture for resource "' + resourceName + '".'
        );
        return;
      }
      await this._loadTexture(resource);
    }

    async processResource(resourceName: string): Promise<void> {
      // Do nothing because images are light enough to be parsed in background.
    }

    /**
     * Load the specified resources, so that textures are loaded and can then be
     * used by calling `getPIXITexture`.
     * @param onProgress Callback called each time a new file is loaded.
     */
    async _loadTexture(
      resource: ResourceData,
      textureToUpdate?: PIXI.Texture
    ): Promise<void> {
      const existingTexture = this._loadedTextures.get(resource);
      if (!textureToUpdate && isTextureReady(existingTexture)) {
        return;
      }

      try {
        const loadedTexture =
          resource.kind === 'video'
            ? await this._loadVideoTexture(resource)
            : await this._loadImageTexture(resource);

        const texture =
          textureToUpdate ||
          (existingTexture && !isTextureReady(existingTexture)
            ? existingTexture
            : null);
        if (texture && !texture.destroyed) {
          texture.source = loadedTexture.source;
          texture.update();
          loadedTexture.destroy(false);
          this._loadedTextures.set(resource, texture);
          applyTextureSettings(texture, resource);
          return;
        }

        this._loadedTextures.set(resource, loadedTexture);
        // TODO What if 2 assets share the same file with different settings?
        applyTextureSettings(loadedTexture, resource);
      } catch (error) {
        logFileLoadingError(resource.file, error as Error);
        const resourceUrl = this._resourceLoader.getFullUrl(resource.file);
        PIXI.Assets.unload(resourceUrl).catch(() => {});
        throw error;
      }
    }

    private async _loadImageTexture(
      resource: ResourceData
    ): Promise<PIXI.Texture> {
      const resourceUrl = this._resourceLoader.getFullUrl(resource.file);
      const image = PIXI.DOMAdapter.get().createImage() as HTMLImageElement;
      image.crossOrigin = getResourceCrossOrigin(
        this._resourceLoader,
        resource.file
      );

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error('Unable to load image file ' + resource.file));
        image.src = resourceUrl;

        if (image.complete) {
          resolve();
        }
      });

      return PIXI.Texture.from(image, true);
    }

    private async _loadVideoTexture(
      resource: ResourceData
    ): Promise<PIXI.Texture> {
      const resourceUrl = this._resourceLoader.getFullUrl(resource.file);
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = getResourceCrossOrigin(
        this._resourceLoader,
        resource.file
      );
      videoElement.preload = 'auto';
      videoElement.playsInline = true;
      videoElement.autoplay = false;
      videoElement.src = resourceUrl;

      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          videoElement.removeEventListener('loadeddata', onLoaded);
          videoElement.removeEventListener('canplay', onLoaded);
          videoElement.removeEventListener('error', onError);
        };
        const onLoaded = () => {
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error('Unable to load video file ' + resource.file));
        };

        videoElement.addEventListener('loadeddata', onLoaded);
        videoElement.addEventListener('canplay', onLoaded);
        videoElement.addEventListener('error', onError);
        videoElement.load();
      });

      return PIXI.Texture.from(
        {
          resource: videoElement,
          autoLoad: false,
          autoPlay: false,
          crossorigin: videoElement.crossOrigin,
        } as PIXI.VideoSourceOptions,
        true
      );
    }

    /**
     * Return a texture containing a circle filled with white.
     * @param radius The circle radius
     * @param pixiRenderer The renderer used to generate the texture
     */
    getOrCreateDiskTexture(
      radius: float,
      pixiRenderer: PIXI.Renderer
    ): PIXI.Texture {
      let particleTexture = this._diskTextures.get(radius);
      if (!particleTexture) {
        const graphics = new PIXI.Graphics();
        graphics.circle(0, 0, radius).fill(
          gdjs.rgbToHexNumber(255, 255, 255)
        );
        particleTexture = pixiRenderer.generateTexture({ target: graphics });
        graphics.destroy();

        this._diskTextures.set(radius, particleTexture);
      }
      return particleTexture;
    }

    /**
     * Return a texture filled with white.
     * @param width The texture width
     * @param height The texture height
     * @param pixiRenderer The renderer used to generate the texture
     */
    getOrCreateRectangleTexture(
      width: float,
      height: float,
      pixiRenderer: PIXI.Renderer
    ): PIXI.Texture {
      const key = `${width}_${height}`;
      let particleTexture = this._rectangleTextures.get(key);
      if (!particleTexture) {
        const graphics = new PIXI.Graphics();
        graphics.rect(0, 0, width, height).fill(
          gdjs.rgbToHexNumber(255, 255, 255)
        );
        particleTexture = pixiRenderer.generateTexture({ target: graphics });
        graphics.destroy();

        this._rectangleTextures.set(key, particleTexture);
      }
      return particleTexture;
    }

    /**
     * Return a texture rescaled according to given dimensions.
     * @param width The texture width
     * @param height The texture height
     * @param pixiRenderer The renderer used to generate the texture
     */
    getOrCreateScaledTexture(
      imageResourceName: string,
      width: float,
      height: float,
      pixiRenderer: PIXI.Renderer
    ): PIXI.Texture {
      const key = `${imageResourceName}_${width}_${height}`;
      let particleTexture = this._scaledTextures.get(key);
      if (!particleTexture) {
        const container = new PIXI.Container();
        const sprite = new PIXI.Sprite({
          texture: this.getPIXITexture(imageResourceName),
        });
        sprite.width = width;
        sprite.height = height;
        container.addChild(sprite);
        particleTexture = pixiRenderer.generateTexture({ target: container });
        container.destroy({ children: true });

        this._scaledTextures.set(key, particleTexture);
      }
      return particleTexture;
    }

    /**
     * To be called when the game is disposed.
     * Clear caches of loaded textures and materials.
     */
    dispose(): void {
      this._loadedTextures.clear();

      const threeTextures: THREE.Texture[] = [];
      this._loadedThreeTextures.values(threeTextures);
      this._loadedThreeTextures.clear();
      for (const threeTexture of threeTextures) {
        threeTexture.dispose();
      }
      for (const cubeTexture of this._loadedThreeCubeTextures.values()) {
        cubeTexture.dispose();
      }
      this._loadedThreeCubeTextures.clear();
      this._loadedThreeCubeTextureKeysByResourceName.clear();

      this._loadedThreeMaterials.disposeAll();

      for (const pixiTexture of this._diskTextures.values()) {
        if (pixiTexture.destroyed) {
          continue;
        }

        pixiTexture.destroy();
      }
      this._diskTextures.clear();

      for (const pixiTexture of this._rectangleTextures.values()) {
        if (pixiTexture.destroyed) {
          continue;
        }

        pixiTexture.destroy();
      }
      this._rectangleTextures.clear();

      for (const pixiTexture of this._scaledTextures.values()) {
        if (pixiTexture.destroyed) {
          continue;
        }

        pixiTexture.destroy();
      }
      this._scaledTextures.clear();
    }

    unloadResource(resourceData: ResourceData): void {
      const resourceName = resourceData.name;
      const texture = this._loadedTextures.getFromName(resourceName);
      if (texture) {
        texture.destroy(true);
        this._loadedTextures.delete(resourceData);
      }

      const threeTexture = this._loadedThreeTextures.get(resourceName);
      if (threeTexture) {
        threeTexture.dispose();
        this._loadedThreeTextures.remove(resourceName);
      }

      this._loadedThreeMaterials.dispose(resourceName);

      const cubeTextureKeys =
        this._loadedThreeCubeTextureKeysByResourceName.getValuesFor(
          resourceName
        );
      if (cubeTextureKeys) {
        for (const cubeTextureKey of cubeTextureKeys) {
          const cubeTexture = this._loadedThreeCubeTextures.get(cubeTextureKey);
          if (cubeTexture) {
            cubeTexture.dispose();
            this._loadedThreeCubeTextures.delete(cubeTextureKey);
          }
        }
      }
    }
  }

  class ArrayMap<K, V> {
    map = new Map<K, Array<V>>();

    getValuesFor(key: K): Array<V> | undefined {
      return this.map.get(key);
    }

    add(key: K, value: V): void {
      let values = this.map.get(key);
      if (!values) {
        values = [];
        this.map.set(key, values);
      }
      values.push(value);
    }

    deleteValuesFor(key: K): void {
      this.map.delete(key);
    }

    clear(): void {
      this.map.clear();
    }
  }

  class ThreeMaterialCache {
    private _flaggedMaterials = new Map<string, THREE.Material>();
    private _materialFlaggedKeys = new ArrayMap<string, string>();

    /**
     * Return the three.js material associated to the specified resource name
     * and options.
     * @param resourceName The name of the resource
     * @param options
     * @returns The requested material.
     */
    get(
      resourceName: string,
      {
        useTransparentTexture,
        forceBasicMaterial,
        vertexColors,
      }: {
        useTransparentTexture: boolean;
        forceBasicMaterial: boolean;
        vertexColors: boolean;
      }
    ): THREE.Material | null {
      const flaggedKey = `${resourceName}|${useTransparentTexture ? 1 : 0}|${
        forceBasicMaterial ? 1 : 0
      }|${vertexColors ? 1 : 0}`;
      return this._flaggedMaterials.get(flaggedKey) || null;
    }

    /**
     * Set the three.js material associated to the specified resource name
     * and options.
     * @param resourceName The name of the resource
     * @param options
     * @param material The material to add to the cache
     */
    set(
      resourceName: string,
      {
        useTransparentTexture,
        forceBasicMaterial,
        vertexColors,
      }: {
        useTransparentTexture: boolean;
        forceBasicMaterial: boolean;
        vertexColors: boolean;
      },
      material: THREE.Material
    ): void {
      const cacheKey = `${resourceName}|${useTransparentTexture ? 1 : 0}|${
        forceBasicMaterial ? 1 : 0
      }|${vertexColors ? 1 : 0}`;
      this._flaggedMaterials.set(cacheKey, material);
      this._materialFlaggedKeys.add(resourceName, cacheKey);
    }

    /**
     * Delete and dispose all the three.js material associated to the specified
     * resource name.
     * @param resourceName The name of the resource
     */
    dispose(resourceName: string): void {
      const flaggedKeys = this._materialFlaggedKeys.getValuesFor(resourceName);
      if (flaggedKeys) {
        for (const flaggedKey of flaggedKeys) {
          const threeMaterial = this._flaggedMaterials.get(flaggedKey);
          if (threeMaterial) {
            threeMaterial.dispose();
          }
          this._flaggedMaterials.delete(flaggedKey);
        }
      }
      this._materialFlaggedKeys.deleteValuesFor(resourceName);
    }

    /**
     * Delete and dispose all the three.js material in the cache.
     */
    disposeAll(): void {
      for (const material of this._flaggedMaterials.values()) {
        material.dispose();
      }
      this._flaggedMaterials.clear();
      this._materialFlaggedKeys.clear();
    }
  }

  //Register the class to let the engine use it.
  /** @category Resources > Images/Textures */
  export const ImageManager = gdjs.PixiImageManager;
  /** @category Resources > Images/Textures */
  export type ImageManager = gdjs.PixiImageManager;
}
