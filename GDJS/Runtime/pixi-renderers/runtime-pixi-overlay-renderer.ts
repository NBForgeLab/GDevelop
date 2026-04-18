namespace gdjs {
  /**
   * Dedicated PixiJS overlay used for 2D layers rendered above the primary 3D canvas.
   * @category Renderers > Game
   */
  export class RuntimePixiOverlayRenderer {
    private _game: gdjs.RuntimeGame;
    private _canvas: HTMLCanvasElement;
    private _application: PIXI.Application | null = null;
    private _rootContainer: PIXI.Container;
    private _layerContainers = new Map<string, PIXI.Container>();
    private _initPromise: Promise<void>;
    private _isReady = false;

    constructor(game: gdjs.RuntimeGame, canvas: HTMLCanvasElement) {
      this._game = game;
      this._canvas = canvas;
      this._rootContainer = new PIXI.Container({ sortableChildren: true });
      this._initPromise = this._initialize();
    }

    private async _initialize(): Promise<void> {
      const application = new PIXI.Application();
      await application.init({
        canvas: this._canvas,
        width: this._game.getGameResolutionWidth(),
        height: this._game.getGameResolutionHeight(),
        backgroundAlpha: 0,
        antialias: this._game.getAntialiasingMode() !== 'none',
        autoDensity: false,
        clearBeforeRender: true,
      });
      application.stage.addChild(this._rootContainer);
      this._application = application;
      this._isReady = true;
    }

    isReady(): boolean {
      return this._isReady;
    }

    getApplication(): PIXI.Application | null {
      return this._application;
    }

    registerLayer(layerName: string, container: PIXI.Container): void {
      this._layerContainers.set(layerName, container);
      this._rootContainer.addChild(container);
    }

    unregisterLayer(layerName: string): void {
      const container = this._layerContainers.get(layerName);
      if (!container) {
        return;
      }

      this._rootContainer.removeChild(container);
      this._layerContainers.delete(layerName);
    }

    resize(width: number, height: number): void {
      if (!this._application) {
        return;
      }

      this._application.renderer.resize(width, height);
    }

    render(): void {
      if (!this._application || !this._isReady) {
        return;
      }

      this._application.renderer.render(this._application.stage);
    }

    async waitUntilReady(): Promise<void> {
      await this._initPromise;
    }

    destroy(): void {
      this._rootContainer.removeChildren();
      this._layerContainers.clear();
      this._application?.destroy(undefined, {
        context: true,
        texture: false,
        textureSource: false,
      });
      this._application = null;
      this._isReady = false;
    }
  }
}
