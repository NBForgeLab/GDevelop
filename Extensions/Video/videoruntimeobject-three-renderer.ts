namespace gdjs {
  const logger = new gdjs.Logger('Video object Three renderer');

  type SharedVideoResource = {
    texture: THREE.VideoTexture;
    video: HTMLVideoElement;
    refCount: number;
  };

  const sharedVideoResources = new Map<string, SharedVideoResource>();

  const invalidVideoTexture = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  })();

  const acquireSharedVideoResource = (
    instanceContainer: gdjs.RuntimeInstanceContainer,
    resourceName: string
  ): SharedVideoResource | null => {
    const existingSharedResource = sharedVideoResources.get(resourceName);
    if (existingSharedResource) {
      existingSharedResource.refCount++;
      return existingSharedResource;
    }

    const resourceLoader = instanceContainer.getGame().getResourceLoader();
    const resource = resourceLoader.getResource(resourceName);
    if (!resource) {
      logger.warn(
        `Unable to find video resource "${resourceName}" for Video object.`
      );
      return null;
    }

    const video = document.createElement('video');
    video.preload = 'auto';
    video.playsInline = true;
    video.crossOrigin = resourceLoader.checkIfCredentialsRequired(resource.file)
      ? 'use-credentials'
      : 'anonymous';
    video.src = resourceLoader.getFullUrl(resource.file);
    video.load();

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;

    const sharedResource = {
      texture,
      video,
      refCount: 1,
    };
    sharedVideoResources.set(resourceName, sharedResource);
    return sharedResource;
  };

  const releaseSharedVideoResource = (resourceName: string): void => {
    const sharedResource = sharedVideoResources.get(resourceName);
    if (!sharedResource) {
      return;
    }

    sharedResource.refCount--;
    if (sharedResource.refCount > 0) {
      return;
    }

    sharedResource.video.pause();
    sharedResource.video.removeAttribute('src');
    sharedResource.video.load();
    sharedResource.texture.dispose();
    sharedVideoResources.delete(resourceName);
  };

  /**
   * The Three.js renderer for the VideoRuntimeObject.
   * @category Renderers > Video
   */
  export class VideoRuntimeObjectThreeRenderer {
    _object: gdjs.VideoRuntimeObject;
    _sprite: THREE.Sprite;
    _material: THREE.SpriteMaterial;
    _sharedVideoResource: SharedVideoResource | null = null;
    _textureWasValid = false;
    _displayWidth = 0;
    _displayHeight = 0;
    _explicitWidth = false;
    _explicitHeight = false;

    constructor(
      runtimeObject: gdjs.VideoRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._sharedVideoResource = acquireSharedVideoResource(
        instanceContainer,
        this._object._videoResource
      );

      this._material = new THREE.SpriteMaterial({
        map: this._sharedVideoResource
          ? this._sharedVideoResource.texture
          : invalidVideoTexture,
        transparent: true,
        opacity: 1,
      });
      this._sprite = new THREE.Sprite(this._material);
      this._sprite.center.set(0.5, 0.5);

      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._sprite, runtimeObject.getZOrder());

      const source = this._getHTMLVideoElementSource();
      if (source) {
        source.addEventListener('loadedmetadata', this._onLoadedMetadata);
      }

      this.updatePosition();
      this.updateAngle();
      this.updateOpacity();
      this.updateVolume();
      this.updateLoop();
    }

    private _onLoadedMetadata = () => {
      if (!this._explicitWidth) {
        this._displayWidth = this._sharedVideoResource?.video.videoWidth || 0;
      }
      if (!this._explicitHeight) {
        this._displayHeight = this._sharedVideoResource?.video.videoHeight || 0;
      }
      this._applySize();
      this.updatePosition();
    };

    private _applySize(): void {
      this._sprite.scale.set(
        this._displayWidth || 0,
        this._displayHeight || 0,
        1
      );
    }

    getRendererObject() {
      return this._sprite;
    }

    onDestroy() {
      this.stop();
      const source = this._getHTMLVideoElementSource();
      if (source) {
        source.removeEventListener('loadedmetadata', this._onLoadedMetadata);
      }
      this._sprite.removeFromParent();
      this._material.dispose();
      this._sprite.clear();
      releaseSharedVideoResource(this._object._videoResource);
      this._sharedVideoResource = null;
    }

    ensureUpToDate() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }

      if (!this._textureWasValid && source.readyState >= 1) {
        if (!this._explicitWidth) {
          this._displayWidth = source.videoWidth || this._displayWidth;
        }
        if (!this._explicitHeight) {
          this._displayHeight = source.videoHeight || this._displayHeight;
        }
        this._applySize();
        this.updatePosition();
        this._textureWasValid = true;
      }
    }

    updatePosition(): void {
      this._sprite.position.set(
        this._object.x + this._displayWidth / 2,
        -(this._object.y + this._displayHeight / 2),
        0
      );
    }

    updateLoop(): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.loop = this._object._loop;
    }

    updateVolume(): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.volume = this._object._volume / 100;
    }

    updateAngle(): void {
      this._material.rotation = gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._material.opacity = this._object._opacity / 255;
      this._material.needsUpdate = true;
    }

    getWidth(): float {
      return this._displayWidth;
    }

    getHeight(): float {
      return this._displayHeight;
    }

    setWidth(width: float): void {
      this._explicitWidth = true;
      this._displayWidth = width;
      this._applySize();
      this.updatePosition();
    }

    setHeight(height: float): void {
      this._explicitHeight = true;
      this._displayHeight = height;
      this._applySize();
      this.updatePosition();
    }

    _getHTMLVideoElementSource(): HTMLVideoElement | null {
      return this._sharedVideoResource?.video || null;
    }

    play() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      const promise = source.play();
      if (promise !== undefined) {
        promise.catch(() => {
          logger.warn(
            'The video did not start because: video is invalid or no interaction with the game has been captured before.'
          );
        });
      }
    }

    pause() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.pause();
    }

    stop() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.pause();
      source.currentTime = 0;
    }

    setLoop(enable: boolean): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.loop = enable;
    }

    setMute(enable: boolean): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.muted = enable;
    }

    isMuted(): boolean {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return false;
      }
      return source.muted;
    }

    setCurrentTime(value: number): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.currentTime = value;
    }

    setVolume(volume: number): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.volume = volume;
    }

    getVolume() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return 0;
      }
      return source.volume;
    }

    isPlayed(): boolean {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return false;
      }
      return !source.paused && !source.ended;
    }

    isLooped(): boolean {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return false;
      }
      return source.loop;
    }

    getCurrentTime(): float {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return 0;
      }
      return source.currentTime;
    }

    getDuration() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return 0;
      }
      return source.duration;
    }

    isEnded(): boolean {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return false;
      }
      return source.ended;
    }

    setPlaybackSpeed(playbackRate: number): void {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return;
      }
      source.playbackRate = playbackRate;
    }

    getPlaybackSpeed() {
      const source = this._getHTMLVideoElementSource();
      if (!source) {
        return 0;
      }
      return source.playbackRate;
    }
  }

  /**
   * @category Renderers > Video
   */
  export const VideoRuntimeObjectRenderer = VideoRuntimeObjectThreeRenderer;
  /**
   * @category Renderers > Video
   */
  export type VideoRuntimeObjectRenderer = VideoRuntimeObjectThreeRenderer;
}
