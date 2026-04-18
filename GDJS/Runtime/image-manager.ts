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
    _pixiAnimationFrameTextureManager: any;
    private _invalidImageSource: HTMLCanvasElement;

    /**
     * Map associating a resource name to the loaded Three.js texture.
     */
    private _loadedThreeTextures: Hashtable<THREE.Texture>;
    private _loadedPixiTextures: Hashtable<PIXI.Texture>;
    private _loadedImageSources = new gdjs.ResourceCache<HTMLImageElement>();
    private _loadedVideoSources = new gdjs.ResourceCache<HTMLVideoElement>();
    private _loadedThreeMaterials = new ThreeMaterialCache();
    private _loadedThreeCubeTextures = new Map<string, THREE.CubeTexture>();
    private _loadedThreeCubeTextureKeysByResourceName = new ArrayMap<
      string,
      string
    >();

    private _resourceLoader: gdjs.ResourceLoader;
    private _placeholderThreeTexture: THREE.Texture | null = null;
    private _placeholderPixiTexture: PIXI.Texture | null = null;
    private _missingThreeTextureWarnings = new Set<string>();
    private _missingPixiTextureWarnings = new Set<string>();
    private _notReadyThreeTextureWarnings = new Set<string>();
    private _notReadyPixiTextureWarnings = new Set<string>();
    private _fallbackResourceNames = new Map<string, string>();

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
      this._loadedPixiTextures = new Hashtable();
    }

    /**
     * Get a placeholder Three.js texture for missing resources.
     * @returns A magenta placeholder texture
     */
    private _getPlaceholderThreeTexture(): THREE.Texture {
      if (this._placeholderThreeTexture) {
        return this._placeholderThreeTexture;
      }
      const placeholderTexture = new THREE.Texture(this._invalidImageSource);
      placeholderTexture.magFilter = THREE.NearestFilter;
      placeholderTexture.minFilter = THREE.NearestFilter;
      placeholderTexture.wrapS = THREE.RepeatWrapping;
      placeholderTexture.wrapT = THREE.RepeatWrapping;
      placeholderTexture.colorSpace = THREE.SRGBColorSpace;
      placeholderTexture.needsUpdate = true;
      this._placeholderThreeTexture = placeholderTexture;
      return this._placeholderThreeTexture;
    }

    private _getPlaceholderPixiTexture(): PIXI.Texture {
      if (this._placeholderPixiTexture) {
        return this._placeholderPixiTexture;
      }
      this._placeholderPixiTexture = PIXI.Texture.from(this._invalidImageSource);
      return this._placeholderPixiTexture;
    }

    getResourceKinds(): ResourceKind[] {
      return resourceKinds;
    }

    /**
     * Return the three.js texture associated to the specified resource name.
     * Returns a placeholder texture if not found.
     * @param resourceName The name of the resource
     * @returns The requested texture, or a placeholder if not found.
     */
    getThreeTexture(resourceName: string): THREE.Texture {
      // Handle empty or undefined resource names
      if (!resourceName) {
        return this._getPlaceholderThreeTexture();
      }

      const loadedThreeTexture = this._loadedThreeTextures.get(resourceName);
      if (loadedThreeTexture) {
        return loadedThreeTexture;
      }

      // Check if resource exists before trying to load it
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        if (!this._missingThreeTextureWarnings.has(resourceName)) {
          this._missingThreeTextureWarnings.add(resourceName);
          logger.warn(
            `Texture for resource "${resourceName}" not found. Using placeholder.`
          );
        }
        return this._getPlaceholderThreeTexture();
      }
      const loadedThreeTextureFromResolvedName = this._loadedThreeTextures.get(
        resource.name
      );
      if (loadedThreeTextureFromResolvedName) {
        this._loadedThreeTextures.put(resourceName, loadedThreeTextureFromResolvedName);
        return loadedThreeTextureFromResolvedName;
      }

      let image;
      try {
        image = this._getImageSource(resourceName);
      } catch (error) {
        if (!this._notReadyThreeTextureWarnings.has(resourceName)) {
          this._notReadyThreeTextureWarnings.add(resourceName);
          logger.warn(
            `Texture for resource "${resourceName}" is not ready yet. Using placeholder.`,
            error
          );
        }
        return this._getPlaceholderThreeTexture();
      }

      const threeTexture = new THREE.Texture(image);
      threeTexture.magFilter = THREE.LinearFilter;
      threeTexture.minFilter = THREE.LinearFilter;
      threeTexture.wrapS = THREE.RepeatWrapping;
      threeTexture.wrapT = THREE.RepeatWrapping;
      threeTexture.colorSpace = THREE.SRGBColorSpace;
      threeTexture.needsUpdate = true;

      applyThreeTextureSettings(threeTexture, resource);
      this._loadedThreeTextures.put(resourceName, threeTexture);
      if (resource.name !== resourceName) {
        this._loadedThreeTextures.put(resource.name, threeTexture);
      }

      return threeTexture;
    }

    getPixiTexture(resourceName: string): PIXI.Texture {
      if (!resourceName) {
        return this._getPlaceholderPixiTexture();
      }

      const loadedPixiTexture = this._loadedPixiTextures.get(resourceName);
      if (loadedPixiTexture) {
        return loadedPixiTexture;
      }

      const resource = this._getImageResource(resourceName);
      if (!resource) {
        if (!this._missingPixiTextureWarnings.has(resourceName)) {
          this._missingPixiTextureWarnings.add(resourceName);
          logger.warn(
            `Pixi texture for resource "${resourceName}" not found. Using placeholder.`
          );
        }
        return this._getPlaceholderPixiTexture();
      }
      const loadedPixiTextureFromResolvedName = this._loadedPixiTextures.get(
        resource.name
      );
      if (loadedPixiTextureFromResolvedName) {
        this._loadedPixiTextures.put(resourceName, loadedPixiTextureFromResolvedName);
        return loadedPixiTextureFromResolvedName;
      }

      let image;
      try {
        image = this._getImageSource(resourceName);
      } catch (error) {
        if (!this._notReadyPixiTextureWarnings.has(resourceName)) {
          this._notReadyPixiTextureWarnings.add(resourceName);
          logger.warn(
            `Pixi texture for resource "${resourceName}" is not ready yet. Using placeholder.`,
            error
          );
        }
        return this._getPlaceholderPixiTexture();
      }
      const pixiTexture = PIXI.Texture.from(image);
      if ((pixiTexture.source as any) && resource && !resource.smoothed) {
        (pixiTexture.source as any).scaleMode = PIXI.SCALE_MODES.NEAREST;
      }
      this._loadedPixiTextures.put(resourceName, pixiTexture);
      if (resource.name !== resourceName) {
        this._loadedPixiTextures.put(resource.name, pixiTexture);
      }
      return pixiTexture;
    }

    private _getImageSource(resourceName: string): HTMLImageElement {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        throw new Error(
          `Can't load texture source for missing resource "${resourceName}".`
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

    private _getImageResource = (resourceName: string): ResourceData | null => {
      const directResource = this._resourceLoader.getResource(resourceName);
      if (
        directResource &&
        this.getResourceKinds().includes(directResource.kind)
      ) {
        return directResource;
      }

      const cachedFallbackResourceName = this._fallbackResourceNames.get(
        resourceName
      );
      if (cachedFallbackResourceName) {
        const cachedFallbackResource = this._resourceLoader.getResource(
          cachedFallbackResourceName
        );
        if (
          cachedFallbackResource &&
          this.getResourceKinds().includes(cachedFallbackResource.kind)
        ) {
          return cachedFallbackResource;
        }
      }

      const resourcesMap = (this._resourceLoader as any)._resources as
        | Map<string, ResourceData>
        | undefined;
      if (!resourcesMap) {
        return null;
      }

      const expectedSuffix = '-' + resourceName;
      for (const resource of resourcesMap.values()) {
        if (!this.getResourceKinds().includes(resource.kind)) continue;
        if (
          resource.name === resourceName ||
          resource.file === resourceName ||
          resource.name.endsWith(expectedSuffix) ||
          resource.file.endsWith(expectedSuffix) ||
          resource.name.endsWith(resourceName) ||
          resource.file.endsWith(resourceName)
        ) {
          this._fallbackResourceNames.set(resourceName, resource.name);
          return resource;
        }
      }

      return null;
    };

    getResourceUrl(resourceName: string): string | null {
      const resource = this._getImageResource(resourceName);
      if (!resource) {
        return null;
      }

      return this._resourceLoader.getFullUrl(resource.file);
    }

    /**
     * Load the specified resources, so that textures are loaded and can then be
     * used by calling `getThreeTexture`.
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
     * used by calling `getThreeTexture`.
     * @param onProgress Callback called each time a new file is loaded.
     */
    async _loadTexture(resource: ResourceData): Promise<void> {
      if (resource.kind !== 'video' && this._loadedImageSources.get(resource)) {
        return;
      }
      if (resource.kind === 'video' && this._loadedVideoSources.get(resource)) {
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
      this._loadedImageSources.clear();
      this._loadedVideoSources.clear();

      const threeTextures: THREE.Texture[] = [];
      this._loadedThreeTextures.values(threeTextures);
      this._loadedThreeTextures.clear();
      for (const threeTexture of threeTextures) {
        threeTexture.dispose();
      }
      const pixiTextures: PIXI.Texture[] = [];
      this._loadedPixiTextures.values(pixiTextures);
      this._loadedPixiTextures.clear();
      for (const pixiTexture of pixiTextures) {
        pixiTexture.destroy(true);
      }
      for (const cubeTexture of this._loadedThreeCubeTextures.values()) {
        cubeTexture.dispose();
      }
      this._loadedThreeCubeTextures.clear();
      this._loadedThreeCubeTextureKeysByResourceName.clear();

      this._loadedThreeMaterials.disposeAll();
    }

    unloadResource(resourceData: ResourceData): void {
      const resourceName = resourceData.name;
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
      const pixiTexture = this._loadedPixiTextures.get(resourceName);
      if (pixiTexture) {
        pixiTexture.destroy(true);
        this._loadedPixiTextures.remove(resourceName);
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
