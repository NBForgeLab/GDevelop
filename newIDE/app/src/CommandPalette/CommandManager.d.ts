import * as React from 'react';
import { type CommandName } from './CommandsList';

type CommandHandler = () => void | Promise<void>;

export type SimpleCommand = {
  handler: CommandHandler;
  icon?: React.ReactNode;
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

declare class CommandManager implements CommandManagerInterface {
  _commands: { [key: string]: Command };
  registerCommand: (commandName: CommandName, command: Command) => void;
  deregisterCommand: (commandName: CommandName, command?: Command) => void;
  getNamedCommand: (
    commandName: CommandName
  ) => NamedCommand | null | undefined;
  getAllNamedCommands: () => Array<NamedCommand>;
}

export default CommandManager;
