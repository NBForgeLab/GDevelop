import { t, Trans } from '@lingui/macro';
import { type I18n as I18nType } from '@lingui/core';

import * as React from 'react';
import Background from '../../UI/Background';
import EmptyMessage from '../../UI/EmptyMessage';
import PropertiesEditor from '../../PropertiesEditor';
import ResourcePreview from '../../ResourcesList/ResourcePreview';
import ResourcesLoader from '../../ResourcesLoader';
import propertiesMapToSchema from '../../PropertiesEditor/PropertiesMapToSchema';
import {
  type Schema,
  type Field,
  type Instance as SchemaInstance,
} from '../../PropertiesEditor/PropertiesEditorSchema';

import {
  type ResourceSource,
  type ResourceKind,
  type ResourceManagementProps,
} from '../../ResourcesList/ResourceSource';
import { type ResourceCustomPropertyConfig } from '../../Utils/ProjectSettingsReader';
import {
  type ResourceCustomPropertyValue,
  getResourceCustomPropertyValue,
  setResourceCustomPropertyValue,
} from '../../ResourcesList/ResourceUtils';
import useForceUpdate from '../../Utils/UseForceUpdate';
import { EmbeddedResourcesMappingTable } from './EmbeddedResourcesMappingTable';
import { Spacer } from '../../UI/Grid';
import ScrollView from '../../UI/ScrollView';
import { ColumnStackLayout } from '../../UI/Layout';
import AlertMessage from '../../UI/AlertMessage';
import Text from '../../UI/Text';
import { triggerOnResourceExternallyChanged } from '../../MainFrame/ResourcesWatcher';

type Props = {
  project: gdProject;
  resourcesLoader: typeof ResourcesLoader;
  resources: Array<gdResource>;
  onResourcePathUpdated: () => void;
  resourceManagementProps: ResourceManagementProps;
  i18n: I18nType;
};

export type ResourcePropertiesEditorInterface = {
  forceUpdate: () => void;
};

const coerceToBoolean = (
  value: ResourceCustomPropertyValue | null | undefined
): boolean => value === true || value === 'true' || value === 1;

const coerceToNumberOrNull = (
  value: ResourceCustomPropertyValue | null | undefined
): number | null => {
  if (value == null || value === '') return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
};

const coerceToString = (
  value: ResourceCustomPropertyValue | null | undefined
): string => (value == null ? '' : String(value));

const buildCustomPropertyField = (
  config: ResourceCustomPropertyConfig,
  forceUpdate: () => void
): Field => {
  const { name, label, description, default: configDefault } = config;
  const defaultValue = configDefault == null ? null : configDefault;
  const getLabel = () => label;
  const getDescription = () => description || '';
  const readValue = (
    resource: gdResource
  ): ResourceCustomPropertyValue | null | undefined =>
    getResourceCustomPropertyValue(resource, name, defaultValue);
  const setValue = (
    instance: SchemaInstance,
    newValue: ResourceCustomPropertyValue
  ) => {
    setResourceCustomPropertyValue(instance as gdResource, name, newValue);
    forceUpdate();
  };

  if (config.type === 'number') {
    return {
      name,
      getLabel,
      getDescription,
      valueType: 'number',
      getValue: (instance: SchemaInstance) =>
        coerceToNumberOrNull(readValue(instance as gdResource)),
      setValue,
    };
  }

  if (config.type === 'boolean') {
    return {
      name,
      getLabel,
      getDescription,
      valueType: 'boolean',
      getValue: (instance: SchemaInstance) =>
        coerceToBoolean(readValue(instance as gdResource)),
      setValue,
    };
  }

  return {
    name,
    getLabel,
    getDescription,
    valueType: 'string',
    getValue: (instance: SchemaInstance) =>
      coerceToString(readValue(instance as gdResource)),
    setValue,
  };
};

const buildCustomPropertiesSchema = (
  resourceCustomPropertyConfigs: Array<ResourceCustomPropertyConfig>,
  resourceKinds: Array<string>,
  forceUpdate: () => void
): Schema =>
  resourceCustomPropertyConfigs
    .filter((config) => {
      const configResourceKinds = config.resourceKinds;
      return (
        !configResourceKinds ||
        configResourceKinds.length === 0 ||
        resourceKinds.every((resourceKind) =>
          configResourceKinds.includes(resourceKind)
        )
      );
    })
    .map((config) => buildCustomPropertyField(config, forceUpdate));

const getPropertyNamesSharedByAllResources = (
  resources: Array<gdResource>
): Set<string> => {
  const sharedPropertyNames = resources.reduce<Set<string> | null>(
    (previousSharedPropertyNames, resource) => {
      const propertyNames = resource.getProperties().keys().toJSArray();
      return new Set(
        previousSharedPropertyNames
          ? propertyNames.filter((name) =>
              previousSharedPropertyNames.has(name)
            )
          : propertyNames
      );
    },
    null
  );
  return sharedPropertyNames || new Set();
};

const keepOnlyFieldsNamed = (schema: Schema, fieldNames: Set<string>): Schema =>
  schema.reduce<Schema>((fields, field) => {
    if ('children' in field && field.children) {
      const filteredChildren = keepOnlyFieldsNamed(field.children, fieldNames);
      if (filteredChildren.length) {
        fields.push({ ...field, children: filteredChildren });
      }
    } else if (
      !('name' in field) ||
      !field.name ||
      fieldNames.has(field.name)
    ) {
      fields.push(field);
    }
    return fields;
  }, []);

const renderEmpty = () => {
  return (
    <EmptyMessage>
      <Trans>
        Resources are automatically added to your project whenever you add an
        image, a font or a video to an object or when you choose an audio file
        in events. Choose a resource to display its properties.
      </Trans>
    </EmptyMessage>
  );
};

const ResourcePropertiesEditor = React.forwardRef<
  ResourcePropertiesEditorInterface,
  Props
>(
  (
    {
      project,
      resourcesLoader,
      resources,
      onResourcePathUpdated,
      resourceManagementProps,
      i18n,
    },
    ref
  ) => {
    const forceUpdate = useForceUpdate();
    React.useImperativeHandle(ref, () => ({ forceUpdate }));

    const resourceSources = React.useMemo(() => {
      const storageProvider = resourceManagementProps.getStorageProvider();
      return resources.length
        ? resourceManagementProps.resourceSources
            .filter((source) => source.kind === resources[0].getKind())
            .filter(
              ({ onlyForStorageProvider }) =>
                !onlyForStorageProvider ||
                onlyForStorageProvider === storageProvider.internalName
            )
            .filter((source) => !source.hideInResourceEditor)
        : [];
    }, [resourceManagementProps, resources]);

    const chooseResourcePath = React.useCallback(
      async (initialResourceSource: ResourceSource) => {
        const resource = resources[0];

        const { selectedResources, selectedSourceName } =
          await resourceManagementProps.onChooseResource({
            initialSourceName: initialResourceSource.name,
            multiSelection: false,
            resourceKind: resource.getKind() as ResourceKind,
          });
        if (!selectedResources.length) return; // No path was chosen by the user.
        const selectedResourceSource = resourceSources.find(
          (source) => source.name === selectedSourceName
        );
        if (!selectedResourceSource) return;

        const newResourceFile = selectedResources[0].getFile();
        resource.setFile(newResourceFile);
        triggerOnResourceExternallyChanged({
          identifier: newResourceFile,
        });

        // Important, we are responsible for deleting the resources that were given to us.
        // Otherwise we have a memory leak.
        selectedResources.forEach((resource) => resource.delete());

        onResourcePathUpdated();
        forceUpdate();

        await resourceManagementProps.onFetchNewlyAddedResources();
        resourceManagementProps.onNewResourcesAdded();
      },
      [
        resourceManagementProps,
        resources,
        onResourcePathUpdated,
        forceUpdate,
        resourceSources,
      ]
    );

    const isMultipleSelection = resources.length > 1;

    const schema: Schema = React.useMemo(
      () =>
        isMultipleSelection
          ? []
          : [
              {
                name: i18n._(t`Resource name`),
                valueType: 'string',
                disabled: () => 'always',
                getValue: (instance: SchemaInstance) =>
                  (instance as gdResource).getName(),
                setValue: (instance: SchemaInstance, newValue: string) =>
                  (instance as gdResource).setName(newValue),
              },
              {
                name: i18n._(t`File`),
                valueType: 'string',
                getValue: (instance: SchemaInstance) =>
                  (instance as gdResource).getFile(),
                setValue: (instance: SchemaInstance, newValue: string) => {
                  (instance as gdResource).setFile(newValue);
                  triggerOnResourceExternallyChanged({
                    identifier: newValue,
                  });
                },
                onEditButtonClick: () => {
                  const firstResourceSource = resourceSources[0];
                  if (firstResourceSource)
                    chooseResourcePath(firstResourceSource);
                },
                onEditButtonBuildMenuTemplate:
                  resourceSources.length > 1
                    ? (i18n: I18nType) =>
                        resourceSources.map((source) => ({
                          label: i18n._(source.displayName),
                          click: () => chooseResourcePath(source),
                        }))
                    : undefined,
              },
            ],
      [resourceSources, chooseResourcePath, i18n, isMultipleSelection]
    );

    const renderResourcesProperties = React.useCallback(() => {
      const properties = resources[0].getProperties();
      const fullResourceSchema = propertiesMapToSchema({
        properties,
        defaultValueProperties: null,
        getPropertyValue: (resource, name) =>
          resource.getProperties().get(name).getValue(),
        onUpdateProperty: (resource, name, value) => {
          resource.updateProperty(name, value);
          // Properties (like smoothing) change how the resource is displayed:
          // let the editors (scene editors, in-game editor...) reload it.
          triggerOnResourceExternallyChanged({
            identifier: resource.getFile(),
          });
          forceUpdate();
        },
        layersContainer: null,
        shouldDisabledFieldsWithMixedValues: false,
      });
      // Resources of different kinds can be selected together: only show
      // the properties they all have.
      const resourceSchema = isMultipleSelection
        ? keepOnlyFieldsNamed(
            fullResourceSchema,
            getPropertyNamesSharedByAllResources(resources)
          )
        : fullResourceSchema;

      const resourceKinds: Array<string> = [
        ...new Set(resources.map((resource) => resource.getKind())),
      ];
      const customPropertiesSchema = buildCustomPropertiesSchema(
        resourceManagementProps.resourceCustomPropertyConfigs,
        resourceKinds,
        forceUpdate
      );

      const fullSchema = schema
        .concat(resourceSchema)
        .concat(customPropertiesSchema);

      return (
        <ColumnStackLayout noMargin expand>
          {isMultipleSelection && (
            <Text>
              <Trans>
                {resources.length} resources selected. Changes will be applied
                to all of them.
              </Trans>
            </Text>
          )}
          {isMultipleSelection && fullSchema.length === 0 ? (
            <EmptyMessage>
              <Trans>
                These resources are of different kinds and have no property in
                common. Select resources of the same kind to edit their
                properties together.
              </Trans>
            </EmptyMessage>
          ) : (
            <PropertiesEditor schema={fullSchema} instances={resources} />
          )}
        </ColumnStackLayout>
      );
    }, [
      resources,
      schema,
      forceUpdate,
      resourceManagementProps,
      isMultipleSelection,
    ]);

    const renderPreview = () => {
      if (resources.length !== 1) return;

      return (
        <ResourcePreview
          resourceName={resources[0].getName()}
          resourcesLoader={resourcesLoader}
          project={project}
        />
      );
    };

    return (
      <Background maxWidth>
        {renderPreview()}
        <Spacer />
        <ScrollView>
          <ColumnStackLayout
            expand
            key={resources.map((resource) => '' + resource.ptr).join(';')}
          >
            {!resources || !resources.length
              ? renderEmpty()
              : renderResourcesProperties()}
            {resources.length > 0 &&
              resources.some(
                (resource) => resource.getKind() === 'javascript'
              ) && (
                <AlertMessage kind="info">
                  <Trans>
                    JavaScript files must be imported by an extension - by
                    choosing it the extension properties. Otherwise, it won't be
                    loaded by the game.
                  </Trans>
                </AlertMessage>
              )}
            <EmbeddedResourcesMappingTable resources={resources} />
          </ColumnStackLayout>
        </ScrollView>
      </Background>
    );
  }
);

export default ResourcePropertiesEditor;
