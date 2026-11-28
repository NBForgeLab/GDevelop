import { type MonacoApi } from './MonacoSetup';

export const setupAutocompletions = (monaco: MonacoApi): Promise<void> => {
  // No autocompletions are implemented in web-app
  // TODO: Could be provided by a compile time generation of a .d.ts
  // using TypeScript from the game engine sources, and have a script integrate the .d.ts
  // into newIDE sources (see LocalCodeEditorAutocompletions).
  return Promise.resolve();
};
