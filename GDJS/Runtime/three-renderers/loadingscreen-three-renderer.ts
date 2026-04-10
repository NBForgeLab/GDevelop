namespace gdjs {
  enum LoadingScreenState {
    NOT_STARTED,
    STARTED,
    FINISHED,
  }

  type ImageUrlProvider = {
    getResourceUrl(resourceName: string): string | null;
  };

  const clampOpacity = (value: number): number =>
    value < 0 ? 0 : value > 1 ? 1 : value;
  const colorNumberToCssHex = (color: number): string =>
    `#${color.toString(16).padStart(6, '0')}`;

  class LoadingScreenThreeRenderer {
    private _loadingScreenData: LoadingScreenData;
    private _isFirstLayout: boolean;
    private _isWatermarkEnabled: boolean;

    private _container: HTMLDivElement | null = null;
    private _backgroundImage: HTMLImageElement | null = null;
    private _logoImage: HTMLImageElement | null = null;
    private _progressBarFrame: HTMLDivElement | null = null;
    private _progressBarFill: HTMLDivElement | null = null;

    private _state: LoadingScreenState = LoadingScreenState.NOT_STARTED;
    private _startTimeInMs: float = 0;
    private _backgroundReadyTimeInMs: float = 0;
    private _lastFrameTimeInMs: float = 0;
    private _progressPercent: float = 0;

    constructor(
      runtimeGameRenderer: gdjs.RuntimeGameRenderer,
      imageManager: ImageUrlProvider,
      loadingScreenData: LoadingScreenData,
      isWatermarkEnabled: boolean,
      isFirstScene: boolean
    ) {
      this._loadingScreenData = loadingScreenData;
      this._isWatermarkEnabled = isWatermarkEnabled;
      this._isFirstLayout = isFirstScene;

      const parentElement =
        runtimeGameRenderer.getDomElementContainer() ||
        runtimeGameRenderer.getCanvas()?.parentElement;
      if (!parentElement) {
        return;
      }

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.overflow = 'hidden';
      container.style.pointerEvents = 'none';
      container.style.display = 'block';
      container.style.backgroundColor = colorNumberToCssHex(
        this._loadingScreenData.backgroundColor
      );
      parentElement.appendChild(container);
      this._container = container;

      if (loadingScreenData.backgroundImageResourceName) {
        const backgroundImageUrl = imageManager.getResourceUrl(
          loadingScreenData.backgroundImageResourceName
        );
        if (backgroundImageUrl) {
          const backgroundImage = document.createElement('img');
          backgroundImage.src = backgroundImageUrl;
          backgroundImage.style.position = 'absolute';
          backgroundImage.style.left = '50%';
          backgroundImage.style.top = '50%';
          backgroundImage.style.transform = 'translate(-50%, -50%)';
          backgroundImage.style.width = '100%';
          backgroundImage.style.height = '100%';
          backgroundImage.style.objectFit = 'cover';
          backgroundImage.style.opacity = '0';
          container.appendChild(backgroundImage);
          this._backgroundImage = backgroundImage;
        }
      }

      if (loadingScreenData.showGDevelopSplash && isFirstScene) {
        const logoImage = document.createElement('img');
        logoImage.src = gdjs.gdevelopLogo;
        logoImage.style.position = 'absolute';
        logoImage.style.left = '50%';
        logoImage.style.top = '50%';
        logoImage.style.transform = 'translate(-50%, -50%)';
        logoImage.style.maxWidth = '680px';
        logoImage.style.width = 'calc(100% - 70px)';
        logoImage.style.height = 'auto';
        logoImage.style.opacity = '0';
        container.appendChild(logoImage);
        this._logoImage = logoImage;
      }

      if (loadingScreenData.showProgressBar) {
        const progressBarFrame = document.createElement('div');
        progressBarFrame.style.position = 'absolute';
        progressBarFrame.style.border = `1px solid ${colorNumberToCssHex(
          this._loadingScreenData.progressBarColor
        )}`;
        progressBarFrame.style.opacity = '0';
        progressBarFrame.style.boxSizing = 'border-box';

        const progressBarFill = document.createElement('div');
        progressBarFill.style.height = '100%';
        progressBarFill.style.width = '0%';
        progressBarFill.style.backgroundColor = colorNumberToCssHex(
          this._loadingScreenData.progressBarColor
        );
        progressBarFrame.appendChild(progressBarFill);

        container.appendChild(progressBarFrame);
        this._progressBarFrame = progressBarFrame;
        this._progressBarFill = progressBarFill;
      }

      this._render(performance.now());
    }

    setPercent(percent: number): void {
      this._progressPercent = percent;
    }

    private _startLoadingScreen(): void {
      this._state = LoadingScreenState.STARTED;
      this._startTimeInMs = performance.now();
    }

    private _updatePositions(): void {
      const container = this._container;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      if (this._logoImage) {
        const border = width > height && width > 500 ? 150 : 35;
        this._logoImage.style.maxWidth = `${Math.min(680, Math.max(1, width - border * 2))}px`;
        this._logoImage.style.display =
          width > 200 && height > 200 ? 'block' : 'none';
      }

      if (this._progressBarFrame) {
        let progressBarWidth =
          (this._loadingScreenData.progressBarWidthPercent / 100) * width;
        if (
          this._loadingScreenData.progressBarMaxWidth > 0 &&
          progressBarWidth > this._loadingScreenData.progressBarMaxWidth
        ) {
          progressBarWidth = this._loadingScreenData.progressBarMaxWidth;
        }
        if (
          this._loadingScreenData.progressBarMinWidth > 0 &&
          progressBarWidth < this._loadingScreenData.progressBarMinWidth
        ) {
          progressBarWidth = this._loadingScreenData.progressBarMinWidth;
        }

        const progressBarHeight = this._loadingScreenData.progressBarHeight;
        const progressBarX = Math.floor(width / 2 - progressBarWidth / 2);
        const progressBarY =
          height < 350
            ? Math.floor(height - 10 - progressBarHeight)
            : Math.floor(height - 90 - progressBarHeight);

        this._progressBarFrame.style.left = `${progressBarX}px`;
        this._progressBarFrame.style.top = `${progressBarY}px`;
        this._progressBarFrame.style.width = `${progressBarWidth}px`;
        this._progressBarFrame.style.height = `${progressBarHeight}px`;
      }
    }

    private _setOpacity(element: HTMLElement | null, opacity: number): void {
      if (!element) return;
      element.style.opacity = `${clampOpacity(opacity)}`;
    }

    private _render(timeInMs: float): void {
      if (this._state !== LoadingScreenState.FINISHED) {
        requestAnimationFrame(() => this._render(performance.now()));
        this._renderIfNeeded(timeInMs);
      }
    }

    renderIfNeeded(): boolean {
      return this._renderIfNeeded(performance.now());
    }

    private _renderIfNeeded(timeInMs: float): boolean {
      if (timeInMs - this._lastFrameTimeInMs < 1000 / 60) {
        return false;
      }

      const container = this._container;
      if (!container) {
        return false;
      }

      const deltaTimeInMs = this._lastFrameTimeInMs
        ? timeInMs - this._lastFrameTimeInMs
        : 0;
      this._lastFrameTimeInMs = timeInMs;
      this._updatePositions();

      if (this._state === LoadingScreenState.FINISHED) {
        return true;
      }

      if (this._state === LoadingScreenState.NOT_STARTED) {
        if (
          !this._backgroundImage ||
          this._backgroundImage.complete ||
          !this._backgroundImage.src
        ) {
          this._startLoadingScreen();
        }
        return true;
      }

      const backgroundFadeInDuration =
        this._loadingScreenData.backgroundFadeInDuration;
      const backgroundOpacity =
        backgroundFadeInDuration > 0
          ? deltaTimeInMs / (backgroundFadeInDuration * 1000)
          : 1;

      this._setOpacity(
        this._backgroundImage,
        (parseFloat(this._backgroundImage?.style.opacity || '0') || 0) +
          backgroundOpacity
      );

      if (
        !this._backgroundImage ||
        parseFloat(this._backgroundImage.style.opacity || '0') >= 1
      ) {
        if (!this._backgroundReadyTimeInMs) {
          this._backgroundReadyTimeInMs = timeInMs;
        }

        const logoAndProgressFadeInDuration =
          this._loadingScreenData.logoAndProgressFadeInDuration;
        const logoAndProgressLogoFadeInDelay =
          this._loadingScreenData.logoAndProgressLogoFadeInDelay;

        if (
          timeInMs - this._backgroundReadyTimeInMs >
          logoAndProgressLogoFadeInDelay * 1000
        ) {
          const foregroundOpacity =
            logoAndProgressFadeInDuration > 0
              ? deltaTimeInMs / (logoAndProgressFadeInDuration * 1000)
              : 1;
          const nextLogoOpacity =
            (parseFloat(this._logoImage?.style.opacity || '0') || 0) +
            foregroundOpacity;
          const nextProgressOpacity =
            (parseFloat(this._progressBarFrame?.style.opacity || '0') || 0) +
            foregroundOpacity;
          this._setOpacity(this._logoImage, nextLogoOpacity);
          this._setOpacity(this._progressBarFrame, nextProgressOpacity);
        }
      }

      if (this._progressBarFill) {
        const progress = Math.min(1, (this._progressPercent + 1) / 100);
        this._progressBarFill.style.width = `${progress * 100}%`;
      }

      return true;
    }

    unload(): Promise<void> {
      const totalElapsedTime = (performance.now() - this._startTimeInMs) / 1000;
      const fadeInDuration = Math.min(
        this._loadingScreenData.showGDevelopSplash
          ? this._loadingScreenData.logoAndProgressLogoFadeInDelay +
              this._loadingScreenData.logoAndProgressFadeInDuration
          : Number.POSITIVE_INFINITY,
        this._loadingScreenData.backgroundImageResourceName ||
          this._loadingScreenData.backgroundColor
          ? this._loadingScreenData.backgroundFadeInDuration
          : Number.POSITIVE_INFINITY
      );

      if (
        !this._isFirstLayout ||
        (this._isWatermarkEnabled && totalElapsedTime < fadeInDuration / 2) ||
        totalElapsedTime > this._loadingScreenData.minDuration
      ) {
        this._finish();
        return Promise.resolve();
      }

      const remainingTime =
        this._loadingScreenData.minDuration - totalElapsedTime;
      this.setPercent(100);
      return new Promise((resolve) =>
        setTimeout(() => {
          this._finish();
          resolve();
        }, remainingTime * 1000)
      );
    }

    private _finish(): void {
      this._state = LoadingScreenState.FINISHED;
      this._container?.parentNode?.removeChild(this._container);
      this._container = null;
      this._backgroundImage = null;
      this._logoImage = null;
      this._progressBarFrame = null;
      this._progressBarFill = null;
    }
  }

  export const LoadingScreenRenderer = LoadingScreenThreeRenderer;
  export type LoadingScreenRenderer = LoadingScreenThreeRenderer;
}
