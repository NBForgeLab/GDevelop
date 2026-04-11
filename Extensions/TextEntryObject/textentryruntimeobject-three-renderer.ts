/*
 * GDevelop JS Platform
 * 2013 Florian Rival (Florian.Rival@gmail.com)
 */
namespace gdjs {
  /**
   * The renderer for a TextEntryRuntimeObject using Three.js.
   * @category Renderers > Text Entry
   * @deprecated Use TextInput object instead
   */
  class TextEntryRuntimeObjectThreeRenderer {
    _object: gdjs.TextEntryRuntimeObject;
    _pressHandler: any;

    constructor(runtimeObject: gdjs.TextEntryRuntimeObject) {
      this._object = runtimeObject;
      this._pressHandler = (event: KeyboardEvent) => {
        if (!this._object.isActivated()) {
          return;
        }

        const key = event.key;
        if (key === 'Backspace') {
          const currentString = this._object.getString();
          this._object.setString(currentString.slice(0, -1));
        } else if (key.length === 1) {
          // Only add printable characters
          this._object.setString(this._object.getString() + key);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', this._pressHandler);
      }
    }

    onDestroy(): void {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', this._pressHandler);
      }
    }

    getString(): string {
      return this._object.getString();
    }

    updateString(): void {
      // Nothing to do - string is stored in the object
    }

    activate(enable: boolean): void {
      // Nothing to do - activation is handled by the object
    }
  }

  /**
   * @category Renderers > Text Entry
   * @deprecated Use TextInput object instead
   */
  export const TextEntryRuntimeObjectRenderer =
    TextEntryRuntimeObjectThreeRenderer;

  /**
   * @category Renderers > Text Entry
   * @deprecated Use TextInput object instead
   */
  export type TextEntryRuntimeObjectRenderer =
    TextEntryRuntimeObjectThreeRenderer;
}
