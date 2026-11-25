import * as React from 'react';
import CommandManager, { type CommandManagerInterface } from './CommandManager';
import useValueWithInit from '../Utils/UseRefInitHook';

const CommandsContext: React.Context<any> =
  React.createContext<CommandManagerInterface>(new CommandManager());

type Props = {
  children: React.ReactNode;
};

export const CommandsContextProvider = (
  props: Props
): React.ReactElement<any> => {
  const commandManager = useValueWithInit<CommandManager>(
    () => new CommandManager()
  );

  return (
    <CommandsContext.Provider value={commandManager}>
      {props.children}
    </CommandsContext.Provider>
  );
};

export default CommandsContext;
