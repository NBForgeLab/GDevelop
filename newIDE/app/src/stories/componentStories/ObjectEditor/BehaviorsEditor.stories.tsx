import * as React from 'react';
import { action } from '@storybook/addon-actions';

// Keep first as it creates the `global.gd` object:
import { testProject } from '../../GDevelopJsInitializerDecorator';

import paperDecorator from '../../PaperDecorator';
import BehaviorsEditor from '../../../BehaviorsEditor';
import SerializedObjectDisplay from '../../SerializedObjectDisplay';
import fakeResourceManagementProps from '../../FakeResourceManagement';
import { getOrCreateObjectWithNotSynchronizedBehavior } from '../../MultiplayerObjects';

export default {
  title: 'ObjectEditor/BehaviorsEditor',
  component: BehaviorsEditor,
  decorators: [paperDecorator],
};

const BehaviorsEditorForObject = ({ object }: { object: gdObject }) => (
  <SerializedObjectDisplay object={object}>
    <BehaviorsEditor
      project={testProject.project}
      eventsFunctionsExtension={null}
      objects={[object]}
      layersContainer={testProject.testLayout.getLayers()}
      isChildObject={false}
      resourceManagementProps={fakeResourceManagementProps}
      projectScopedContainersAccessor={
        testProject.testSceneProjectScopedContainersAccessor
      }
      onUpdateBehaviorsSharedData={() => {}}
      openBehaviorEvents={async (...args) => {
        action('Open behavior events')(...args);
      }}
      onBehaviorsUpdated={action('onBehaviorsUpdated')}
      onWillInstallExtension={action('extension will be installed')}
      onExtensionInstalled={action('extension installed')}
      onCreateNewExtensionWithBehavior={action(
        'onCreateNewExtensionWithBehavior'
      )}
      isListLocked={false}
    />
  </SerializedObjectDisplay>
);

export const Default = (): React.ReactNode => (
  <SerializedObjectDisplay object={testProject.spriteObjectWithBehaviors}>
    <BehaviorsEditor
      project={testProject.project}
      eventsFunctionsExtension={null}
      objects={[testProject.spriteObjectWithBehaviors]}
      layersContainer={testProject.testLayout.getLayers()}
      isChildObject={false}
      resourceManagementProps={fakeResourceManagementProps}
      projectScopedContainersAccessor={
        testProject.testSceneProjectScopedContainersAccessor
      }
      onUpdateBehaviorsSharedData={() => {}}
      openBehaviorEvents={async (...args) => {
        action('Open behavior events')(...args);
      }}
      onBehaviorsUpdated={() => {}}
      onWillInstallExtension={action('extension will be installed')}
      onExtensionInstalled={action('extension installed')}
      onCreateNewExtensionWithBehavior={action(
        'onCreateNewExtensionWithBehavior'
      )}
      isListLocked={false}
    />
  </SerializedObjectDisplay>
);

export const WithoutAnyBehaviors = (): React.ReactNode => (
  <SerializedObjectDisplay object={testProject.spriteObjectWithoutBehaviors}>
    <BehaviorsEditor
      project={testProject.project}
      eventsFunctionsExtension={null}
      objects={[testProject.spriteObjectWithoutBehaviors]}
      layersContainer={testProject.testLayout.getLayers()}
      isChildObject={false}
      resourceManagementProps={fakeResourceManagementProps}
      projectScopedContainersAccessor={
        testProject.testSceneProjectScopedContainersAccessor
      }
      onUpdateBehaviorsSharedData={() => {}}
      openBehaviorEvents={async (...args) => {
        action('Open behavior events')(...args);
      }}
      onBehaviorsUpdated={() => {}}
      onWillInstallExtension={action('extension will be installed')}
      onExtensionInstalled={action('extension installed')}
      onCreateNewExtensionWithBehavior={action(
        'onCreateNewExtensionWithBehavior'
      )}
      isListLocked={false}
    />
  </SerializedObjectDisplay>
);

export const Locked = (): React.ReactNode => (
  <SerializedObjectDisplay object={testProject.spriteObjectWithBehaviors}>
    <BehaviorsEditor
      project={testProject.project}
      eventsFunctionsExtension={null}
      objects={[testProject.spriteObjectWithBehaviors]}
      layersContainer={testProject.testLayout.getLayers()}
      isChildObject={false}
      resourceManagementProps={fakeResourceManagementProps}
      projectScopedContainersAccessor={
        testProject.testSceneProjectScopedContainersAccessor
      }
      onUpdateBehaviorsSharedData={() => {}}
      openBehaviorEvents={async (...args) => {
        action('Open behavior events')(...args);
      }}
      onBehaviorsUpdated={() => {}}
      onWillInstallExtension={action('extension will be installed')}
      onExtensionInstalled={action('extension installed')}
      onCreateNewExtensionWithBehavior={action(
        'onCreateNewExtensionWithBehavior'
      )}
      isListLocked={true}
    />
  </SerializedObjectDisplay>
);

export const LockedWithoutAnyBehaviors = (): React.ReactNode => (
  <SerializedObjectDisplay object={testProject.spriteObjectWithoutBehaviors}>
    <BehaviorsEditor
      project={testProject.project}
      eventsFunctionsExtension={null}
      objects={[testProject.spriteObjectWithoutBehaviors]}
      layersContainer={testProject.testLayout.getLayers()}
      isChildObject={false}
      resourceManagementProps={fakeResourceManagementProps}
      projectScopedContainersAccessor={
        testProject.testSceneProjectScopedContainersAccessor
      }
      onUpdateBehaviorsSharedData={() => {}}
      openBehaviorEvents={async (...args) => {
        action('Open behavior events')(...args);
      }}
      onBehaviorsUpdated={() => {}}
      onWillInstallExtension={action('extension will be installed')}
      onExtensionInstalled={action('extension installed')}
      onCreateNewExtensionWithBehavior={action(
        'onCreateNewExtensionWithBehavior'
      )}
      isListLocked={true}
    />
  </SerializedObjectDisplay>
);

export const WithMultiplayerBehavior = (): React.ReactNode => (
  <BehaviorsEditorForObject
    object={getOrCreateObjectWithNotSynchronizedBehavior({
      name: 'MyMultiplayerObject',
      hasMultiplayerBehavior: true,
    })}
  />
);

export const WithoutMultiplayerBehavior = (): React.ReactNode => (
  <BehaviorsEditorForObject
    object={getOrCreateObjectWithNotSynchronizedBehavior({
      name: 'MyObjectWithoutMultiplayerBehavior',
      hasMultiplayerBehavior: false,
    })}
  />
);
