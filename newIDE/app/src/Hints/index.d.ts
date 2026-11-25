import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import { type AlertMessageIdentifier } from '../MainFrame/Preferences/PreferencesContext';

export type Hint = {
  kind: 'warning' | 'info';
  message: MessageDescriptor;
  identifier?: AlertMessageIdentifier;
};

export declare const getDeprecatedBehaviorsInformation: () => {
  [key: string]: { warning: MessageDescriptor };
};

export declare const getExtraObjectsInformation: () => {
  [key: string]: Array<Hint>;
};

export declare const getExtraInstructionInformation: (
  type: string
) => Hint | null | undefined;
