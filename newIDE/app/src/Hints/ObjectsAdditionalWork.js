// @flow
// (Cache clear comment)
import { type AlertMessageIdentifier } from '../MainFrame/Preferences/PreferencesContext';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import getObjectByName from '../Utils/GetObjectByName';

/*
 * Define additional logic which executes after an object/instance has been created.
 * Also, InfoBar can be used which could notify users of the additional changes.
 * Declare new identifier for infoBar in Mainframe/Preferences/PreferenceContext
 * and add it in hints/explanation list.
 */

export type InfoBarDetails = {|
  identifier: AlertMessageIdentifier,
  message: MessageDescriptor,
  touchScreenMessage: MessageDescriptor,
|};

type ObjectAddedOptions = {|
  object: gdObject,
  layersContainer: gdLayersContainer,
  globalObjectsContainer: gdObjectsContainer | null,
  objectsContainer: gdObjectsContainer,
|};

type InstanceAddedOptions = {|
  instance: gdInitialInstance,
  layersContainer: gdLayersContainer,
  globalObjectsContainer: gdObjectsContainer | null,
  objectsContainer: gdObjectsContainer,
|};

export const onObjectAdded = (options: ObjectAddedOptions): ?InfoBarDetails => {
  // $FlowFixMe[invalid-computed-prop]
  const additionalWork = objectType[options.object.getType()];
  if (additionalWork) {
    additionalWork.onObjectAdded(options);
    return additionalWork.getInfoBarDetails('onObjectAdded');
  }

  return null;
};

export const onInstanceAdded = (
  options: InstanceAddedOptions
): ?InfoBarDetails => {
  const { instance, globalObjectsContainer, objectsContainer } = options;
  const objectName = instance.getObjectName();
  const object = getObjectByName(
    globalObjectsContainer,
    objectsContainer,
    objectName
  );

  // $FlowFixMe[invalid-computed-prop]
  const additionalWork = object ? objectType[object.getType()] : null;
  if (additionalWork) {
    additionalWork.onInstanceAdded(options);
    return additionalWork.getInfoBarDetails('onInstanceAdded');
  }

  return null;
};

const objectType = {};
