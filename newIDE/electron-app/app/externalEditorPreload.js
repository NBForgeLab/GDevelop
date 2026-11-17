const { contextBridge, ipcRenderer } = require('electron');

const externalEditorApi = Object.freeze({
  notifyReady: () => {
    ipcRenderer.send('external-editor-ready');
  },
  saveOutput: payload => {
    ipcRenderer.send('save-external-editor-output', payload);
  },
  setTitle: title => {
    ipcRenderer.send('external-editor-set-title', String(title || ''));
  },
  closeWindow: () => {
    ipcRenderer.send('external-editor-close');
  },
  onOpenInput: callback => {
    if (typeof callback !== 'function') return () => {};
    const wrapped = (_event, payload) => callback(payload);
    ipcRenderer.on('open-external-editor-input', wrapped);
    return () => {
      ipcRenderer.removeListener('open-external-editor-input', wrapped);
    };
  },
});

contextBridge.exposeInMainWorld('gdevelopExternalEditor', externalEditorApi);
