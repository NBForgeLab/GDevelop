const externalEditorBridge =
  typeof window !== 'undefined' ? window.gdevelopExternalEditor : null;

export const setTitle = title => {
  if (externalEditorBridge) externalEditorBridge.setTitle(title);
  else document.title = title;
};

export const closeWindow = () => {
  if (externalEditorBridge) externalEditorBridge.closeWindow();
  else {
    sendMessageToParentEditor('close');
  }
};

export const sendMessageToParentEditor = (id, payload) => {
  if (externalEditorBridge) {
    if (id === 'external-editor-ready') {
      externalEditorBridge.notifyReady();
    } else if (id === 'save-external-editor-output') {
      externalEditorBridge.saveOutput(payload);
    } else {
      console.error(`Unsupported external editor message "${id}".`);
    }
  } else if (window && window.opener) {
    window.opener.postMessage({
      id,
      payload,
    }, '*');
  } else {
    console.error(`Unable to send message ${id} to the main editor.`);
  }
};

export const onMessageFromParentEditor = (id, callback) => {
  if (externalEditorBridge) {
    if (id === 'open-external-editor-input') {
      return externalEditorBridge.onOpenInput(callback);
    }
    console.error(`Unsupported external editor event "${id}".`);
    return () => {};
  } else {
    window.addEventListener('message', event => {
      if (event.data.id === id) {
        callback(event.data.payload);
      }
    });
  }
};
