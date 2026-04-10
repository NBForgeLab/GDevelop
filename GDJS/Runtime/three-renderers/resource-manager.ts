/**
 * Resource manager for loading and caching textures and models.
 * 
 * @category Renderers > Resources
 */
namespace gdjs {
  const logger = new gdjs.Logger('ResourceManager');

  /**
   * Resource manager for loading and caching textures and models.
   * @category Renderers > Resources
   */
  export class ThreeResourceManager {
    private _textures: Map<string, THREE.Texture> = new Map();
    private _models: Map<string, any> = new Map();
    private _textureLoader: THREE.TextureLoader;
    private _gltfLoader: THREE_ADDONS.GLTFLoader;
    private _loadingProgressCallback: ((progress: number) => void) | null = null;
    private _loadingManager: THREE.LoadingManager;

    constructor() {
      this._loadingManager = new THREE.LoadingManager();
      this._textureLoader = new THREE.TextureLoader(this._loadingManager);
      this._gltfLoader = new THREE_ADDONS.GLTFLoader(this._loadingManager);

      // Setup loading manager callbacks
      this._loadingManager.onProgress = (url, loaded, total) => {
        if (this._loadingProgressCallback) {
          this._loadingProgressCallback(loaded / total);
        }
      };

      this._loadingManager.onError = (url) => {
        logger.error(`Error loading resource: ${url}`);
      };
    }

    /**
     * Load a texture from a URL.
     */
    async loadTexture(url: string): Promise<THREE.Texture> {
      // Check cache first
      if (this._textures.has(url)) {
        return this._textures.get(url)!;
      }

      try {
        const texture = await this._textureLoader.loadAsync(url);

        // Set default texture properties
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        // Cache the texture
        this._textures.set(url, texture);

        return texture;
      } catch (error) {
        logger.error(`Failed to load texture: ${url}`, error);
        throw error;
      }
    }

    /**
     * Load a 3D model from a URL.
     */
    async loadModel(url: string): Promise<any> {
      // Check cache first
      if (this._models.has(url)) {
        return this._models.get(url)!;
      }

      try {
        const gltf = await this._gltfLoader.loadAsync(url);

        // Cache the model
        this._models.set(url, gltf);

        return gltf;
      } catch (error) {
        logger.error(`Failed to load model: ${url}`, error);
        throw error;
      }
    }

    /**
     * Get a loaded texture by URL.
     */
    getTexture(url: string): THREE.Texture | null {
      return this._textures.get(url) || null;
    }

    /**
     * Get a loaded model by URL.
     */
    getModel(url: string): any | null {
      return this._models.get(url) || null;
    }

    /**
     * Get a texture synchronously (must be preloaded).
     */
    getTextureSync(url: string): THREE.Texture | null {
      return this._textures.get(url) || null;
    }

    /**
     * Get a model synchronously (must be preloaded).
     */
    getModelSync(url: string): any | null {
      return this._models.get(url) || null;
    }

    /**
     * Dispose of all loaded resources.
     */
    dispose(): void {
      // Dispose all textures
      for (const texture of this._textures.values()) {
        texture.dispose();
      }
      this._textures.clear();

      // Dispose all models
      for (const gltf of this._models.values()) {
        // Dispose of the scene
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            }
          }
        });
      }
      this._models.clear();

      logger.info('All resources disposed.');
    }

    /**
     * Create a texture atlas from multiple images.
     */
    createAtlas(images: string[]): THREE.Texture {
      const canvas = document.createElement('canvas');

      // TODO: Implement proper atlas packing algorithm
      // For now, just create a simple horizontal strip
      const imageWidth = 256;
      const imageHeight = 256;

      canvas.width = imageWidth * images.length;
      canvas.height = imageHeight;

      // Draw all images on the canvas
      // Note: This is a simplified implementation
      // A proper implementation would load images asynchronously
      // and pack them efficiently

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      return texture;
    }

    /**
     * Set the loading progress callback.
     */
    setLoadingProgressCallback(callback: (progress: number) => void): void {
      this._loadingProgressCallback = callback;
    }

    /**
     * Preload multiple resources.
     */
    async preloadResources(
      textureUrls: string[],
      modelUrls: string[]
    ): Promise<void> {
      const promises: Promise<any>[] = [];

      // Load all textures
      for (const url of textureUrls) {
        promises.push(this.loadTexture(url));
      }

      // Load all models
      for (const url of modelUrls) {
        promises.push(this.loadModel(url));
      }

      await Promise.all(promises);
      logger.info('All resources preloaded.');
    }

    /**
     * Check if a texture is loaded.
     */
    isTextureLoaded(url: string): boolean {
      return this._textures.has(url);
    }

    /**
     * Check if a model is loaded.
     */
    isModelLoaded(url: string): boolean {
      return this._models.has(url);
    }

    /**
     * Remove a specific texture from the cache.
     */
    removeTexture(url: string): void {
      const texture = this._textures.get(url);
      if (texture) {
        texture.dispose();
        this._textures.delete(url);
      }
    }

    /**
     * Remove a specific model from the cache.
     */
    removeModel(url: string): void {
      const gltf = this._models.get(url);
      if (gltf) {
        gltf.scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            }
          }
        });
        this._models.delete(url);
      }
    }
  }
}
