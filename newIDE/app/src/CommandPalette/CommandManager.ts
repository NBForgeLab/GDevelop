import { type ReactNode } from 'react';
import { type CommandName } from './CommandsList';
export type CommandHandler = () => void | Promise<any>;

export type SimpleCommand = {
  handler: CommandHandler;
  icon?: ReactNode;
};

export type CommandOption = {
  handler: CommandHandler;
  text: string;
  iconSrc?: string;
};

export type CommandWithOptions = {
  generateOptions: () => Array<CommandOption>;
};

export type Command = SimpleCommand | CommandWithOptions;

export type NamedCommand = Command & {
  name: CommandName;
};

export type NamedCommandWithOptions = CommandWithOptions & {
  name: CommandName;
};

export interface CommandManagerInterface {
  registerCommand: (commandName: CommandName, command: Command) => void;
  deregisterCommand: (commandName: CommandName, command?: Command) => void;
  getNamedCommand: (
    commandName: CommandName
  ) => NamedCommand | null | undefined;
  getAllNamedCommands: () => Array<NamedCommand>;
}

export default class CommandManager implements CommandManagerInterface {
  _commands: {
    [key in CommandName]?: Command;
  };

  constructor() {
    this._commands = {};
  }

  registerCommand = (commandName: CommandName, command: Command) => {
    if (this._commands[commandName]) return;
    // if (this._commands[commandName])
    //   return console.warn(
    //     `Tried to register command ${commandName}, but it is already registered.`
    //   );
    this._commands[commandName] = command;
  };

  deregisterCommand = (commandName: CommandName, command?: Command) => {
    // When a specific command is given, only remove it if it's still the
    // registered one: a component being unmounted or deactivated must not
    // remove the command that another component owns (as its registration was
    // refused, see `registerCommand`).
    if (command && this._commands[commandName] !== command) return;
    delete this._commands[commandName];
  };

  getNamedCommand = (
    commandName: CommandName
  ): NamedCommand | null | undefined => {
    const command = this._commands[commandName];
    if (command) return { name: commandName, ...command };
    return null;
  };

  getAllNamedCommands = (): Array<NamedCommand> => {
    const namedCommands: Array<NamedCommand> = [];
    (Object.keys(this._commands) as Array<CommandName>).forEach(
      (commandName) => {
        const command = this._commands[commandName];
        if (command) {
          namedCommands.push({ ...command, name: commandName });
        }
      }
    );
    return namedCommands;
  };
}
