import * as React from 'react';
import { ColumnStackLayout } from '../../UI/Layout';
import { Trans } from '@lingui/macro';
import {
  type Schema,
  type ActionButton,
  type Instance,
} from '../../PropertiesEditor/PropertiesEditorSchema';
import ShareExternal from '../../UI/CustomSvgIcons/ShareExternal';
import { CompactPropertiesEditorByVisibility } from '../../CompactPropertiesEditor/CompactPropertiesEditorByVisibility';
import propertiesMapToSchema from '../../PropertiesEditor/PropertiesMapToSchema';
import { useForceRecompute } from '../../Utils/UseForceUpdate';
import { type CompactInstanceBehaviorPropertiesEditorProps } from './CompactInstanceBehaviorPropertiesEditorProps.flow';

export const styles = {
  icon: {
    fontSize: 18,
  },
};

export const getSchemaWithOpenFullEditorButton = ({
  schema,
  fullEditorLabel,
  behavior,
  onOpenFullEditor,
}: {
  schema: Schema;
  fullEditorLabel: string | null | undefined;
  behavior: gdBehavior;
  onOpenFullEditor: () => void;
}): Schema => {
  if (!fullEditorLabel) return schema;

  const actionButton: ActionButton = {
    label: fullEditorLabel,
    disabled: 'onValuesDifferent',
    nonFieldType: 'button',
    showRightIcon: true,
    getIcon: (style) => <ShareExternal style={style} />,
    getValue: (behavior) => behavior.getName(),
    onClick: (behavior) => onOpenFullEditor(),
  };

  let added = false;
  schema.forEach((field) => {
    if ('children' in field && field.name === '') {
      field.children.push(actionButton);
      added = true;
    }
  });

  if (!added) schema.push(actionButton);

  return schema;
};

export const getPropertyValue = (
  behavior: gdBehavior,
  propertyName: string,
  initialInstance: gdInitialInstance
): string => {
  const behaviorName = behavior.getName();
  if (
    initialInstance.hasBehaviorOverridingNamed(behaviorName) &&
    initialInstance
      .getBehaviorOverriding(behaviorName)
      .hasPropertyValue(propertyName)
  ) {
    const behaviorOverriding =
      initialInstance.getBehaviorOverriding(behaviorName);
    return behaviorOverriding.getProperties().get(propertyName).getValue();
  }
  return behavior.getProperties().get(propertyName).getValue();
};

export const updateProperty = (
  project: gdProject,
  behavior: gdBehavior,
  propertyName: string,
  value: string,
  initialInstance: gdInitialInstance
): void => {
  const behaviorName = behavior.getName();
  const behaviorOverriding = initialInstance.hasBehaviorOverridingNamed(
    behaviorName
  )
    ? initialInstance.getBehaviorOverriding(behaviorName)
    : initialInstance.addNewBehaviorOverriding(
        project,
        behavior.getTypeName(),
        behaviorName
      );
  const behaviorProperties = behavior.getProperties();
  const inheritedValue = behaviorProperties.has(propertyName)
    ? behaviorProperties.get(propertyName).getValue()
    : null;
  if (inheritedValue === value) {
    behaviorOverriding.removeProperty(propertyName);
  } else {
    behaviorOverriding.updateProperty(propertyName, value);
  }
};

export const CompactInstanceBehaviorPropertiesEditor = ({
  project,
  behaviorMetadata,
  object,
  layersContainer,
  instancesAndBehaviors,
  onBehaviorUpdated,
  resourceManagementProps,
}: CompactInstanceBehaviorPropertiesEditorProps): React.ReactNode => {
  const [schemaRecomputeTrigger, forceRecomputeSchema] = useForceRecompute();

  const propertiesSchema: Schema = React.useMemo(() => {
    if (schemaRecomputeTrigger) {
      // schemaRecomputeTrigger allows to invalidate the schema when required.
    }
    if (instancesAndBehaviors.length === 0) {
      return [];
    }
    const behaviorProperties =
      instancesAndBehaviors[0].behavior.getProperties();
    return propertiesMapToSchema({
      properties: behaviorProperties,
      defaultValueProperties: behaviorProperties,
      getPropertyValue: (instance: Instance, propertyName: string) => {
        const { behavior, initialInstance } = instance as {
          behavior: gdBehavior;
          initialInstance: gdInitialInstance;
        };
        return getPropertyValue(behavior, propertyName, initialInstance);
      },
      onUpdateProperty: (
        instance: Instance,
        propertyName: string,
        value: string
      ) => {
        const { behavior, initialInstance } = instance as {
          behavior: gdBehavior;
          initialInstance: gdInitialInstance;
        };
        updateProperty(project, behavior, propertyName, value, initialInstance);
      },
      object,
      layersContainer,
      visibility: 'All',
      showcaseNonDefaultValues: true,
      hideResourceProperties: true,
      shouldDisabledFieldsWithMixedValues: false,
      propertyGroups: behaviorMetadata.getPropertyGroups(),
    });
  }, [
    schemaRecomputeTrigger,
    instancesAndBehaviors,
    object,
    layersContainer,
    project,
    behaviorMetadata,
  ]);

  return (
    <ColumnStackLayout expand noMargin noOverflowParent>
      <CompactPropertiesEditorByVisibility
        project={project}
        object={object}
        schema={propertiesSchema}
        instances={instancesAndBehaviors}
        onInstancesModified={onBehaviorUpdated}
        resourceManagementProps={resourceManagementProps}
        placeholder={<Trans>Nothing to configure for this behavior.</Trans>}
        customizeBasicSchema={null}
        onRefreshAllFields={forceRecomputeSchema}
      />
    </ColumnStackLayout>
  );
};
