import * as React from 'react';
import { type CommandName } from './CommandsList';

type CommandHandler = () => void | Promise<void>;

type SimpleCommand = {
  handler: CommandHandler;
  icon?: React.ReactNode;
};

type CommandOption = {
  handler: CommandHandler;
  text: string;
  iconSrc?: string;
};

type CommandWithOptions = {
  generateOptions: () => Array<CommandOption>;
};

export declare const useCommand: (
  commandName: CommandName,
  enabled: boolean,
  command: SimpleCommand
) => void;

export declare const useCommandWithOptions: (
  commandName: CommandName,
  enabled: boolean,
  command: CommandWithOptions
) => void;

export declare const UseCommandHook: React.ComponentType<{
  name: CommandName;
  enabled: boolean;
  command: SimpleCommand;
}>;

export declare const UseCommandWithOptionsHook: React.ComponentType<{
  name: CommandName;
  enabled: boolean;
  command: CommandWithOptions;
}>;
