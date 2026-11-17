// @flow
import * as React from 'react';
import DesktopService from './DesktopService';
import URLSearchParams from 'url-search-params';
import debounce from 'lodash/debounce';
import { hexToRGBColor, isLightRgbColor } from './ColorTransformer';

export type AppArguments = { [string]: any };
type YesNoCancelDialogChoice = 'yes' | 'no' | 'cancel';

/**
 * The name of the key, in AppArguments, containing the array of
 * positional arguments (i.e: `["file1", "file2"]` in `ls file1 file2`).
 */
export const POSITIONAL_ARGUMENTS_KEY = '_';

const documentBackgroundColors: WeakMap<Document, string> = new WeakMap();
const documentToTargetId: WeakMap<Document, string> = new WeakMap();

/**
 * Register a mapping from a window Document to the target
 * used in window.open().
 */
export const registerDocumentTargetId = (doc: Document, frameName: string) => {
  documentToTargetId.set(doc, frameName);
};

export const unregisterDocumentTargetId = (doc: Document) => {
  documentToTargetId.delete(doc);
};

export const getDocumentTargetId = (doc: ?Document): ?string => {
  if (!doc) return null;
  return documentToTargetId.get(doc) || null;
};

// Per-navigator watcher state: each window's windowControlsOverlay gets its
// own debounced listener and set of callbacks.
type OverlayWatcherState = {|
  callbacks: Set<() => void>,
  debouncedHandler: () => void,
|};
const overlayWatchers: WeakMap<Object, OverlayWatcherState> = new WeakMap();

const getOrCreateOverlayWatcher = (
  windowControlsOverlay: Object
): OverlayWatcherState => {
  const existing = overlayWatchers.get(windowControlsOverlay);
  if (existing) return existing;

  const state: OverlayWatcherState = {
    callbacks: new Set<() => void>(),
    debouncedHandler: debounce(() => {
      for (const callback of state.callbacks) {
        callback();
      }
    }, 20),
  };
  windowControlsOverlay.addEventListener(
    'geometrychange',
    state.debouncedHandler
  );
  overlayWatchers.set(windowControlsOverlay, state);
  return state;
};

/**
 * Listen to the changes to the window controls provided by the operating system:
 *
 * - An installed PWA can have window controls displayed as overlay. If supported,
 * we set up a listener to detect any change and notify the caller.
 * - On Electron, the window controls are always integrated in the app - so this does nothing.
 *
 * Accepts an optional `targetWindow` parameter so that popped-out windows
 * (which have their own navigator) can watch their own overlay.
 */
export const useWindowControlsOverlayWatcher = ({
  onChanged,
  targetWindow,
}: {|
  onChanged: () => void,
  targetWindow?: typeof window,
|}) => {
  React.useEffect(
    () => {
      const win = targetWindow || window;
      // $FlowFixMe[incompatible-type] - this API is not handled by Flow.
      // $FlowFixMe[prop-missing]
      const { windowControlsOverlay } = win.navigator;
      if (!windowControlsOverlay) return;

      const state = getOrCreateOverlayWatcher(windowControlsOverlay);
      state.callbacks.add(onChanged);
      return () => {
        state.callbacks.delete(onChanged);
      };
    },
    [onChanged, targetWindow]
  );
};

/**
 * Various utilities related to the app window management.
 */
export default class Window {
  static setTitle(title: string) {
    if (DesktopService.isDesktop()) {
      try {
        DesktopService.setWindowTitle(title);
      } catch (err) {
        console.error(
          'Caught an error while calling DesktopService.setWindowTitle',
          err
        );
      }
    } else {
      document.title = title;
    }
  }

  static setWindowBackgroundColor(newColor: string, targetDocument?: Document) {
    const doc = targetDocument || document;

    if (!newColor) {
      // Be defensive against themes missing a color (for instance, a
      // newly added variable that an older or custom theme doesn't define):
      // skip the update rather than crashing.
      return;
    }

    if (documentBackgroundColors.get(doc) === newColor) {
      // Avoid potentially expensive DOM query/modification if no changes needed.
      return;
    }

    if (DesktopService.isDesktop()) {
      // Update the window controls and background colors on Windows/Linux.
      // For the main window, the main process resolves via event.sender.
      // For popped-out editor windows (opened via window.open and rendered
      // into via React portals), event.sender is always the main window's
      // webContents, so we pass the frameName and let the main process
      // resolve it to the correct BrowserWindow.
      DesktopService.setTitlebarOverlayOptions({
        color: newColor,
        // $FlowFixMe[incompatible-type]
        symbolColor: isLightRgbColor(hexToRGBColor(newColor))
          ? '#000000'
          : '#ffffff',
        targetId: documentToTargetId.get(doc),
      });
    }

    // Update the PWA titlebar/controls color (if it's an installed PWA).
    const metaElement = doc.querySelector('meta[name="theme-color"]');
    if (metaElement) {
      metaElement.setAttribute('content', newColor);
    }

    // Update the window background color. Update both `body` and `html` elements
    // to ensure the background color is visible when resized.
    const body = doc.body;
    if (body) {
      body.style.backgroundColor = newColor;
    }
    if (doc.documentElement) {
      doc.documentElement.style.backgroundColor = newColor;
    }

    documentBackgroundColors.set(doc, newColor);
  }

  static setBounds(x: number, y: number, width: number, height: number) {
    if (!DesktopService.isDesktop()) return;

    DesktopService.setWindowBounds(x, y, width, height);
  }

  static quit() {
    if (!DesktopService.isDesktop()) return;

    DesktopService.quitApp();
  }

  static show() {
    if (!DesktopService.isDesktop()) return;

    DesktopService.showWindow();
  }

  static hide(forceHide: boolean = false) {
    if (!DesktopService.isDesktop()) return;

    DesktopService.hideWindow(forceHide);
  }

  static onFocus(cb: () => void): any {
    if (!DesktopService.isDesktop()) return;

    return DesktopService.onIpcEvent('desktop-window-focus', cb);
  }

  static onBlur(cb: () => void): any {
    if (!DesktopService.isDesktop()) return;

    return DesktopService.onIpcEvent('desktop-window-blur', cb);
  }

  static onClose(cb: () => void): any {
    if (typeof window === 'undefined') return;
    window.addEventListener('beforeunload', cb);
    return () => window.removeEventListener('beforeunload', cb);
  }

  /** True when the app was launched with `--run-command` (CLI / CI mode). */
  static isRunningCommandFromCli(): boolean {
    const args = Window.getArguments();
    return !!args['run-command'];
  }

  /**
   * Return the arguments passed to the IDE, either from Electron
   * or from the web-app URL. The resulting object will have a key "_"
   * containing an array of string, representing all the arguments that
   * didn't have an option associated with them (see https://github.com/substack/minimist).
   * (On the web-app, this is emulated using the "project" argument).
   */
  static getArguments(): AppArguments {
    if (DesktopService.isDesktop()) {
      return DesktopService.getArguments();
    }

    const argumentsObject = {};
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, name) => (argumentsObject[name] = value));

    // Emulate the minimist behavior of putting the positional arguments
    // in "_".
    // $FlowFixMe[prop-missing]
    argumentsObject[POSITIONAL_ARGUMENTS_KEY] = argumentsObject.project
      ? [argumentsObject.project]
      : [];

    return argumentsObject;
  }

  /**
   * On web, removes a list of query params from the URL.
   */
  static removeArguments(argumentNames: string[]) {
    // On Electron, we don't have a way to modify global args.
    if (DesktopService.isDesktop()) return;

    const url = new URL(window.location.href);
    for (const argumentName of argumentNames) {
      url.searchParams.delete(argumentName);
    }
    window.history.replaceState({}, document.title, url.toString());
  }

  static addArguments(argumentNamesAndValues: { [key: string]: string }) {
    // On Electron, we don't have a way to modify global args.
    if (DesktopService.isDesktop()) return;

    const url = new URL(window.location.href);
    for (const argumentName in argumentNamesAndValues) {
      url.searchParams.set(argumentName, argumentNamesAndValues[argumentName]);
    }
    window.history.replaceState({}, document.title, url.toString());
  }

  static showMessageBox(
    message: string,
    type?: 'none' | 'info' | 'error' | 'question' | 'warning'
  ) {
    if (!DesktopService.isDesktop()) {
      alert(message);
      return;
    }

    DesktopService.showMessageBoxSync({
      message,
      type,
      buttons: ['OK'],
    });
  }

  static showYesNoCancelDialog(
    message: string,
    type?: 'none' | 'info' | 'error' | 'question' | 'warning'
  ): YesNoCancelDialogChoice {
    if (!DesktopService.isDesktop()) {
      // TODO: Find a way to display an alert with 3 buttons (not possible with the 3 native js method confirm, alert and prompt)
      // eslint-disable-next-line
      const answer = confirm(message);
      if (answer) return 'yes';
      return 'no';
    }

    const answer = DesktopService.showMessageBoxSync({
      message,
      type,
      cancelId: 1,
      buttons: ['Yes', 'Cancel', 'No'], // TODO: Check on Windows and Linux how these buttons are displayed.
      // On Mac, they are displayed vertically in the order Yes, No and Cancel from top to bottom.
    });
    switch (answer) {
      case 0:
        return 'yes';
      case 1:
        return 'cancel';
      case 2:
        return 'no';
      default:
        return 'cancel';
    }
  }

  static showConfirmDialog(
    message: string,
    type?: 'none' | 'info' | 'error' | 'question' | 'warning'
  ): any {
    if (!DesktopService.isDesktop()) {
      // eslint-disable-next-line
      return confirm(message);
    }

    const answer = DesktopService.showMessageBoxSync({
      message,
      type,
      cancelId: 1,
      buttons: ['OK', 'Cancel'],
    });
    return answer === 0;
  }

  static setUpContextMenu(targetWindow?: any) {
    const win = targetWindow || window;
    const doc = win.document;
    const textEditorSelectors = 'textarea, input, [contenteditable="true"]';

    if (DesktopService.isDesktop()) {
      win.addEventListener('contextmenu', function(e) {
        // Only show the context menu in text editors.
        if (!e.target.closest(textEditorSelectors)) return;

        // The 'contextmenu' event is emitted after 'selectionchange' has fired but possibly before the
        // visible selection has changed. Try to wait to show the menu until after that, otherwise the
        // visible selection will update after the menu dismisses and look weird.
        setTimeout(function() {
          DesktopService.showEditContextMenu(
            doc ? documentToTargetId.get(doc) || null : null
          );
        }, 30);
      });
    } else if (doc) {
      doc.addEventListener('contextmenu', function(e: any) {
        // Only show the context menu in text editors.
        if (!e.target.closest(textEditorSelectors)) {
          e.preventDefault();
          return false;
        }

        return true;
      });
    }
  }

  static openExternalURL(
    url: string,
    {
      shouldOpenInSameTabIfPossible,
    }: {|
      shouldOpenInSameTabIfPossible?: boolean,
    |} = {}
  ) {
    if (!url) return;

    if (DesktopService.isDesktop()) {
      DesktopService.openExternalURL(url);
      return;
    }

    window.open(url, shouldOpenInSameTabIfPossible ? '_self' : '_blank');
  }

  static getOrientation(): 'portrait' | 'landscape' {
    try {
      return window.screen.orientation.type.split('-')[0];
    } catch (error) {
      console.warn('An error occurred when reading screen orientation', error);
      return 'landscape';
    }
  }

  static hasMainMenu(): any {
    return DesktopService.isDesktop();
  }

  static isDev(): boolean {
    return DesktopService.isDev();
  }

  static isFullScreen(): boolean {
    return DesktopService.isWindowFullScreen();
  }

  static toggleMaximize() {
    DesktopService.toggleWindowMaximize();
  }
}
