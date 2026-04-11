/*
 * GDevelop JS Platform
 * 2013 Florian Rival (Florian.Rival@gmail.com)
 */
namespace gdjs {
  /**
   * The renderer for a DummyRuntimeObject using Three.js.
   * @category Renderers > Dummy
   * @internal This is an example extension.
   */
  export class DummyRuntimeObjectThreeRenderer {
    _object: gdjs.DummyRuntimeObject;
    _text: any;

    constructor(
      runtimeObject: gdjs.DummyRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._text = null;
    }

    getRendererObject() {
      return this._text;
    }

    ensureUpToDate() {
      // Nothing to do
    }

    updateOpacity(): void {
      // Nothing to do
    }

    updateString(): void {
      // Nothing to do
    }

    updatePosition(): void {
      // Nothing to do
    }

    setColor(rgbColor: string): void {
      // Nothing to do
    }

    getColor(): string {
      return '0;0;0';
    }

    getWidth(): float {
      return this._object.getWidth();
    }

    getHeight(): float {
      return this._object.getHeight();
    }
  }

  /**
   * @category Renderers > Dummy
   * @internal This is an example extension.
   */
  export const DummyRuntimeObjectRenderer = DummyRuntimeObjectThreeRenderer;

  /**
   * @category Renderers > Dummy
   * @internal This is an example extension.
   */
  export type DummyRuntimeObjectRenderer = DummyRuntimeObjectThreeRenderer;
}
