/*
 * GDevelop JS Platform
 * Copyright 2013-2016 Florian Rival (Florian.Rival@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */
namespace gdjs {
  const logger = new gdjs.Logger('Image manager');

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
      texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    }
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
   * ImageManager loads and stores textures used by the runtime.
   * @category Resources > Images/Textures
   */
  export class ImageManagerImpl implements gdjs.ResourceManager {
    _threeAnimationFrameTextureManager: any;
    private _invalidImageSource: HTMLCanvasElement;
    private _invalidTexture: PIXI.Texture | null = null;

    /**
     * Map associating a resource name to the loaded PixiJS texture.
     */
    private _loadedTextures = new gdjs.ResourceCache<PIXI.Texture>();

    /**
     * Map associating a resource name to the loaded Three.js texture.
     */
    private _loadedThreeTextures: Hashtable<THREE.Texture>;
    private _loadedImageSources = new gdjs.ResourceCache<HTMLImageElement>();
    private _loadedVideoSources = new gdjs.ResourceCache<HTMLVideoElement>();
    private _loadedThreeMaterials = new ThreeMaterialCache();
    private _loadedThreeCubeTextures = new Map<string, THREE.CubeTexture>();
    private _loadedThreeCubeTextureKeysByResourceName = new ArrayMap<
      string,
      string
    >();

    private _resourceLoader: gdjs.ResourceLoader;

    /**
     * @param resourceLoader The resources loader of the game.
     */
    constructor(resourceLoader: gdjs.ResourceLoader) {
      this._resourceLoader = resourceLoader;
      this._invalidImageSource = document.createElement('canvas');
      this._invalidImageSource.width = 192;
      this._invalidImageSource.height = 192;
      const invalidContext = this._invalidImageSource.getContext('2d');
      if (invalidContext) {
        invalidContext.fillStyle = '#ff00ff';
        invalidContext.fillRect(0, 0, 192, 192);
      }
      this._loadedThreeTextures = new Hashtable();
    }

    getResourceKinds(): ResourceKind[] {
      return resourceKinds;
    }

    /**
     * Return the legacy Pixi texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param resourceName The name of the resource
     * @returns The requested texture, or a placeholder if not found.
     */
    getLegacyPixiTexture(resourceName: string): PIXI.Texture {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find texture for resource "' + resourceName + '".'
        );
        return this.getLegacyInvalidPixiTexture();
      }

      const existingTexture = this._loadedTextures.get(resource);
      if (!existingTexture) {
        const imageSource = this._loadedImageSources.get(resource);
        if (!imageSource) {
          return this.getLegacyInvalidPixiTexture();
        }

        return this._cachePixiTextureFromImageSource(resource, imageSource);
      }
      if (existingTexture.destroyed) {
        logger.error('Texture for ' + resourceName + ' is not valid anymore.');
        return this.getLegacyInvalidPixiTexture();
      }
      if (!existingTexture.valid) {
        logger.error(
          'Texture for ' +
            resourceName +
            ' is not valid anymore (or never was).'
        );
        return this.getLegacyInvalidPixiTexture();
      }

      return existingTexture;
    }

    /**
     * Return the legacy Pixi texture associated to the specified resource name.
     * If not found in the loaded textures, this method will try to load it.
     * Warning: this method should only be used in specific cases that cannot rely on
     * the initial resources loading of the game, such as the splashscreen.
     * @param resourceName The name of the resource
     * @returns The requested texture, or a placeholder if not valid.
     */
    getOrLoadLegacyPixiTexture(resourceName: string): PIXI.Texture {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find texture for resource "' + resourceName + '".'
        );
        return this.getLegacyInvalidPixiTexture();
      }

      const existingTexture = this._loadedTextures.get(resource);
      if (existingTexture) {
        if (existingTexture.valid) {
          return existingTexture;
        } else {
          logger.error(
            'Texture for ' +
              resourceName +
              ' is not valid anymore (or never was).'
          );
          return this.getLegacyInvalidPixiTexture();
        }
      }

      logger.log('Loading texture for resource "' + resourceName + '"...');
      if (resource.kind === 'video') {
        const file = resource.file;
        const url = this._resourceLoader.getFullUrl(file);
        const texture = PIXI.Texture.from(url, {
          resourceOptions: {
            crossorigin: this._resourceLoader.checkIfCredentialsRequired(file)
              ? 'use-credentials'
              : 'anonymous',
          },
        }).on('error', (error) => {
          logFileLoadingError(file, error);
        });
        if (!texture) {
          throw new Error(
            'Texture loading by PIXI returned nothing for file ' +
              file +
              ' behind url ' +
              url
          );
        }
        applyTextureSettings(texture, resource);
        this._loadedTextures.set(resource, texture);
        return texture;
      }

      const imageSource = this._loadedImageSources.get(resource);
      if (imageSource) {
        return this._cachePixiTextureFromImageSource(resource, imageSource);
      }

      const file = resource.file;
      const url = this._resourceLoader.getFullUrl(file);
      const texture = PIXI.Texture.from(url, {
        resourceOptions: {
          crossorigin: this._resourceLoader.checkIfCredentialsRequired(file)
            ? 'use-credentials'
            : 'anonymous',
        },
      }).on('error', (error) => {
        logFileLoadingError(file, error);
      });
      applyTextureSettings(texture, resource);
      this._loadedTextures.set(resource, texture);
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
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        throw new Error(
          `Can't load texture for missing resource "${resourceName}".`
        );
      }

      const cachedImageSource = this._loadedImageSources.get(resource);
      if (!cachedImageSource) {
        throw new Error(
          `Three texture source for "${resourceName}" is not loaded yet.`
        );
      }

      return cachedImageSource;
    }

    private _cachePixiTextureFromImageSource(
      resource: ResourceData,
      imageSource: HTMLImageElement
    ): PIXI.Texture {
      const existingTexture = this._loadedTextures.get(resource);
      if (existingTexture && !existingTexture.destroyed && existingTexture.valid) {
        return existingTexture;
      }

      const texture = PIXI.Texture.from(imageSource);
      applyTextureSettings(texture, resource);
      this._loadedTextures.set(resource, texture);
      return texture;
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
      // Use standard cubemap order: +X, -X, +Y, -Y, +Z, -Z.
      cubeTexture.images[0] = this._getImageSource(xPositiveResourceName);
      cubeTexture.images[1] = this._getImageSource(xNegativeResourceName);
      // Faces on Y keep the same order.
      cubeTexture.images[2] = this._getImageSource(yPositiveResourceName);
      cubeTexture.images[3] = this._getImageSource(yNegativeResourceName);
      // Faces on Z keep the same order.
      cubeTexture.images[4] = this._getImageSource(zPositiveResourceName);
      cubeTexture.images[5] = this._getImageSource(zNegativeResourceName);
      cubeTexture.flipY = false;

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
     * Return the legacy Pixi video texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param resourceName The name of the resource to get.
     */
    getLegacyPixiVideoTexture(resourceName: string) {
      if (resourceName === '') {
        return this.getLegacyInvalidPixiTexture();
      }
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        logger.warn(
          'Unable to find video texture for resource "' + resourceName + '".'
        );
        return this.getLegacyInvalidPixiTexture();
      }

      const texture = this._loadedTextures.get(resource);
      if (texture) {
        return texture;
      }

      const videoSource = this._loadedVideoSources.get(resource);
      if (!videoSource) {
        return this.getLegacyInvalidPixiTexture();
      }

      const videoTexture = PIXI.Texture.from(videoSource, {
        resourceOptions: {
          autoPlay: false,
        },
      });
      applyTextureSettings(videoTexture, resource);
      this._loadedTextures.set(resource, videoTexture);
      return videoTexture;
    }

    private _getImageResource = (resourceName: string): ResourceData | null => {
      const resource = this._resourceLoader.getResource(resourceName);
      return resource && this.getResourceKinds().includes(resource.kind)
        ? resource
        : null;
    };

    /**
     * Return a legacy Pixi texture which can be used as a placeholder when no
     * suitable texture can be found.
     */
    getLegacyInvalidPixiTexture() {
      if (!this._invalidTexture || this._invalidTexture.destroyed) {
        this._invalidTexture = PIXI.Texture.from(this._invalidImageSource);
      }
      return this._invalidTexture;
    }

    getResourceUrl(resourceName: string): string | null {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        return null;
      }

      return this._resourceLoader.getFullUrl(resource.file);
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
    async _loadTexture(resource: ResourceData): Promise<void> {
      if (resource.kind !== 'video' && this._loadedImageSources.get(resource)) {
        return;
      }
      if (
        resource.kind === 'video' &&
        (this._loadedTextures.get(resource) || this._loadedVideoSources.get(resource))
      ) {
        return;
      }
      const resourceUrl = this._resourceLoader.getFullUrl(resource.file);
      try {
        if (resource.kind === 'video') {
          await new Promise<void>((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'auto';
            video.playsInline = true;
            video.crossOrigin = this._resourceLoader.checkIfCredentialsRequired(
              resource.file
            )
              ? 'use-credentials'
              : 'anonymous';
            video.onloadedmetadata = () => {
              this._loadedVideoSources.set(resource, video);
              resolve();
            };
            video.onerror = () => {
              reject(new Error('Video loading failed for ' + resourceUrl));
            };
            video.src = resourceUrl;
            video.load();
          });
        } else {
          const imageSource = await this._loadImageSource(resource);
          this._loadedImageSources.set(resource, imageSource);
        }
      } catch (error) {
        logFileLoadingError(resource.file, error);
        throw error;
      }
    }

    private async _loadImageSource(
      resource: ResourceData
    ): Promise<HTMLImageElement> {
      const cachedImageSource = this._loadedImageSources.get(resource);
      if (cachedImageSource) {
        return cachedImageSource;
      }

      const image = new Image();
      image.crossOrigin = this._resourceLoader.checkIfCredentialsRequired(
        resource.file
      )
        ? 'use-credentials'
        : 'anonymous';

      const imageUrl = this._resourceLoader.getFullUrl(resource.file);
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error('Image loading failed for ' + imageUrl));
        image.src = imageUrl;
      });

      return image;
    }

    /**
     * To be called when the game is disposed.
     * Clear caches of loaded textures and materials.
     */
    dispose(): void {
      this._loadedTextures.clear();
      this._loadedImageSources.clear();
      this._loadedVideoSources.clear();

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

      if (this._invalidTexture && !this._invalidTexture.destroyed) {
        this._invalidTexture.destroy();
      }
      this._invalidTexture = null;
    }

    unloadResource(resourceData: ResourceData): void {
      const resourceName = resourceData.name;
      const texture = this._loadedTextures.getFromName(resourceName);
      if (texture) {
        texture.destroy(true);
        this._loadedTextures.delete(resourceData);
      }
      this._loadedImageSources.delete(resourceData);
      const videoSource = this._loadedVideoSources.get(resourceData);
      if (videoSource) {
        videoSource.pause();
        videoSource.removeAttribute('src');
        videoSource.load();
        this._loadedVideoSources.delete(resourceData);
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
  export const ImageManager = gdjs.ImageManagerImpl;
  /** @category Resources > Images/Textures */
  export type ImageManager = gdjs.ImageManagerImpl;
}
