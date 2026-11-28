declare global {
  namespace Electron {
    interface App {
      /**
       * Emitted by @electron/remote/main when a renderer requests require(moduleName).
       */
      on(
        event: 'remote-require',
        listener: (
          event: Event & { returnValue?: unknown },
          webContents: WebContents,
          moduleName: string
        ) => void
      ): this;
    }
  }

  var args: Record<string, any> | undefined;
}

export {};
