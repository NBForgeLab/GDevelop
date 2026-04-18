namespace gdjs {
  const videoPixiLogger = new gdjs.Logger('Video object Pixi renderer');

  type SharedPixiVideoResource = {
    texture: PIXI.Texture;
    video: HTMLVideoElement;
    refCount: number;
  };

  const sharedPixiVideoResources = new Map<string, SharedPixiVideoResource>();

  const acquireSharedPixiVideoResource = (
    instanceContainer: gdjs.RuntimeInstanceContainer,
    resourceName: string
  ): SharedPixiVideoResource | null => {
    const existing = sharedPixiVideoResources.get(resourceName);
    if (existing) {
      existing.refCount++;
      return existing;
    }

    const resourceLoader = instanceContainer.getGame().getResourceLoader();
    const resource = resourceLoader.getResource(resourceName);
    if (!resource) {
      videoPixiLogger.warn(
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

    const texture = PIXI.Texture.from(video);
    const sharedResource = {
      texture,
      video,
      refCount: 1,
    };
    sharedPixiVideoResources.set(resourceName, sharedResource);
    return sharedResource;
  };

  const releaseSharedPixiVideoResource = (resourceName: string): void => {
    const shared = sharedPixiVideoResources.get(resourceName);
    if (!shared) return;

    shared.refCount--;
    if (shared.refCount > 0) return;

    shared.video.pause();
    shared.video.removeAttribute('src');
    shared.video.load();
    shared.texture.destroy(true);
    sharedPixiVideoResources.delete(resourceName);
  };

  export class VideoRuntimeObjectPixiRenderer {
    _object: gdjs.VideoRuntimeObject;
    _sprite: PIXI.Sprite;
    _sharedVideoResource: SharedPixiVideoResource | null = null;
    _displayWidth = 0;
    _displayHeight = 0;
    _explicitWidth = false;
    _explicitHeight = false;

    constructor(
      runtimeObject: gdjs.VideoRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._sharedVideoResource = acquireSharedPixiVideoResource(
        instanceContainer,
        this._object._videoResource
      );

      this._sprite = new PIXI.Sprite(
        this._sharedVideoResource
          ? this._sharedVideoResource.texture
          : PIXI.Texture.EMPTY
      );
      this._sprite.anchor.set(0, 0);
      this._sprite.eventMode = 'none';

      instanceContainer
        .getLayer(runtimeObject.getLayer())
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
      this._sprite.width = this._displayWidth || 0;
      this._sprite.height = this._displayHeight || 0;
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
      this._sprite.destroy();
      releaseSharedPixiVideoResource(this._object._videoResource);
      this._sharedVideoResource = null;
    }

    ensureUpToDate() {}

    updatePosition(): void {
      this._sprite.position.set(this._object.x, this._object.y);
      this._sprite.zIndex = this._object.getZOrder();
    }

    updateLoop(): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.loop = this._object._loop;
    }

    updateVolume(): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.volume = this._object._volume / 100;
    }

    updateAngle(): void {
      this._sprite.angle = this._object.angle;
    }

    updateOpacity(): void {
      this._sprite.alpha = this._object._opacity / 255;
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
      if (!source) return;
      const promise = source.play();
      if (promise !== undefined) {
        promise.catch(() => {
          videoPixiLogger.warn(
            'The video did not start because: video is invalid or no interaction with the game has been captured before.'
          );
        });
      }
    }

    pause() {
      const source = this._getHTMLVideoElementSource();
      if (source) source.pause();
    }

    stop() {
      const source = this._getHTMLVideoElementSource();
      if (!source) return;
      source.pause();
      source.currentTime = 0;
    }

    setLoop(enable: boolean): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.loop = enable;
    }

    setMute(enable: boolean): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.muted = enable;
    }

    isMuted(): boolean {
      const source = this._getHTMLVideoElementSource();
      return source ? source.muted : false;
    }

    setCurrentTime(value: number): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.currentTime = value;
    }

    setVolume(volume: number): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.volume = volume / 100;
    }

    getVolume(): number {
      const source = this._getHTMLVideoElementSource();
      return source ? source.volume : 0;
    }

    isPlayed(): boolean {
      const source = this._getHTMLVideoElementSource();
      return !!source && !source.paused && !source.ended;
    }

    isLooped(): boolean {
      const source = this._getHTMLVideoElementSource();
      return !!source && source.loop;
    }

    getDuration(): number {
      const source = this._getHTMLVideoElementSource();
      return source ? source.duration || 0 : 0;
    }

    isEnded(): boolean {
      const source = this._getHTMLVideoElementSource();
      return !!source && source.ended;
    }

    getCurrentTime(): number {
      const source = this._getHTMLVideoElementSource();
      return source ? source.currentTime || 0 : 0;
    }

    setPlaybackSpeed(playbackSpeed: number): void {
      const source = this._getHTMLVideoElementSource();
      if (source) source.playbackRate = playbackSpeed;
    }

    getPlaybackSpeed(): number {
      const source = this._getHTMLVideoElementSource();
      return source ? source.playbackRate : 1;
    }
  }
}
