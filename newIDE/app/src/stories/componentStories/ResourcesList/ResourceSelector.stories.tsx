import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import { testProject } from '../../GDevelopJsInitializerDecorator';
import ResourceSelector from '../../../ResourcesList/ResourceSelector';
import fakeResourceExternalEditors from '../../FakeResourceExternalEditors';
import ResourcesLoader from '../../../ResourcesLoader';
import ResourceSelectorWithThumbnail from '../../../ResourcesList/ResourceSelectorWithThumbnail';
import { emptyStorageProvider } from '../../../ProjectsStorage/ProjectStorageProviders';
import fakeResourceManagementProps from '../../FakeResourceManagement';

export default {
  title: 'ResourcesList/ResourceSelector',
  component: ResourceSelector,
  decorators: [paperDecorator],
};

export const ImageNotSelected = (): React.ReactNode => (
  <ResourceSelector
    resourceKind="image"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName=""
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const ImageSelected = (): React.ReactNode => (
  <ResourceSelector
    resourceKind="image"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName="icon128.png"
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const ImageWithMultipleExternalEditors = (): React.ReactNode => (
  <ResourceSelector
    resourceKind="image"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={{
      getStorageProvider: () => emptyStorageProvider,
      onFetchNewlyAddedResources: async () => {},
      resourceSources: [],
      onChooseResource: () => Promise.reject('Unimplemented'),
      resourceExternalEditors: [
        ...fakeResourceExternalEditors,
        {
          name: 'fake-image-editor-2',
          createDisplayName: 'Create with Super Image Editor 2',
          editDisplayName: 'Edit with Super Image Editor 2',
          kind: 'image',
          edit: async (options: any) => {
            console.log('Open the image editor with these options:', options);
            return null;
          },
        },
      ],
      getStorageProviderResourceOperations: () => null,
      canInstallPrivateAsset: () => false,
      onNewResourcesAdded: () => {},
      onResourceUsageChanged: () => {},
      resourceCustomPropertyConfigs: [],
    }}
    initialResourceName=""
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const NotExisting = (): React.ReactNode => (
  <ResourceSelector
    resourceKind="image"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName="resource-that-does-not-exists-in-the-project"
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const ImageNoMargin = (): React.ReactNode => (
  <ResourceSelector
    margin="none"
    resourceKind="image"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName="icon128.png"
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const ImageWithThumbnail = (): React.ReactNode => (
  <ResourceSelectorWithThumbnail
    resourceKind="image"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    resourceName="icon128.png"
    onChange={action('on change')}
  />
);

export const Audio = (): React.ReactNode => (
  <ResourceSelector
    resourceKind="audio"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName="fake-audio1.mp3"
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const FontWithResetButton = (): React.ReactNode => (
  <ResourceSelector
    canBeReset
    resourceKind="font"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName="font.otf"
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);

export const FontNoMarginWithResetButton = (): React.ReactNode => (
  <ResourceSelector
    canBeReset
    margin="none"
    resourceKind="font"
    project={testProject.project}
    projectScopedContainersAccessor={
      testProject.testSceneProjectScopedContainersAccessor
    }
    resourceManagementProps={fakeResourceManagementProps}
    initialResourceName="font.otf"
    onChange={action('on change')}
    resourcesLoader={ResourcesLoader}
  />
);
