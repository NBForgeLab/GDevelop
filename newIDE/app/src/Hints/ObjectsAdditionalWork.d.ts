import type { AlertMessageIdentifier } from '../MainFrame/Preferences/PreferencesContext';
import type { MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';

export type InfoBarDetails = {
  identifier: AlertMessageIdentifier;
  message: MessageDescriptor;
  touchScreenMessage: MessageDescriptor;
};

export type ObjectAddedOptions = {
  object: gdObject;
  layersContainer: gdLayersContainer;
  globalObjectsContainer: gdObjectsContainer | null;
  objectsContainer: gdObjectsContainer;
};

export type InstanceAddedOptions = {
  instance: gdInitialInstance;
  layersContainer: gdLayersContainer;
  globalObjectsContainer: gdObjectsContainer | null;
  objectsContainer: gdObjectsContainer;
};

export declare const onObjectAdded: (
  options: ObjectAddedOptions
) => InfoBarDetails | null | undefined;

export declare const onInstanceAdded: (
  options: InstanceAddedOptions
) => InfoBarDetails | null | undefined;
