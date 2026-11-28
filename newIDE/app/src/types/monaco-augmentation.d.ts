import type * as monacoEditor from 'monaco-editor';
import 'react-monaco-editor';

// Module augmentation for react-monaco-editor@0.18.0: the runtime supports
// `editorWillUnmount`, which was omitted from its bundled `index.d.ts`.
declare module 'react-monaco-editor' {
  interface MonacoEditorProps {
    editorWillUnmount?: (
      editor: monacoEditor.editor.IStandaloneCodeEditor,
      monaco: typeof monacoEditor
    ) => void;
  }
}

export {};
