import { Trans } from '@lingui/macro';

import * as React from 'react';
import SemiControlledTextField from '../../UI/SemiControlledTextField';
import ResourceSelectorWithThumbnail from '../../ResourcesList/ResourceSelectorWithThumbnail';
import { type EditorProps } from './EditorProps';
import { ResponsiveLineStackLayout, ColumnStackLayout } from '../../UI/Layout';

const gd: libGDevelop = (global as any).gd;

export default class TiledSpriteEditor extends React.Component<EditorProps> {
  render(): React.ReactNode {
    const {
      objectConfiguration,
      project,
      resourceManagementProps,
      projectScopedContainersAccessor,
      objectName,
      renderObjectNameField,
    } = this.props;
    const tiledSpriteConfiguration =
      gd.asTiledSpriteConfiguration(objectConfiguration);

    return (
      <ColumnStackLayout noMargin>
        {renderObjectNameField && renderObjectNameField()}
        <ResourceSelectorWithThumbnail
          project={project}
          resourceManagementProps={resourceManagementProps}
          projectScopedContainersAccessor={projectScopedContainersAccessor}
          resourceKind="image"
          resourceName={tiledSpriteConfiguration.getTexture()}
          defaultNewResourceName={objectName}
          onChange={(resourceName) => {
            tiledSpriteConfiguration.setTexture(resourceName);
            this.forceUpdate();
          }}
          floatingLabelText={<Trans>Select an image</Trans>}
        />
        <ResponsiveLineStackLayout noMargin noResponsiveLandscape>
          <SemiControlledTextField
            commitOnBlur
            floatingLabelText={<Trans>Default width (in pixels)</Trans>}
            fullWidth
            type="number"
            value={tiledSpriteConfiguration.getWidth().toString()}
            onChange={(value) => {
              tiledSpriteConfiguration.setWidth(parseInt(value, 10) || 0);
              this.forceUpdate();
            }}
          />
          <SemiControlledTextField
            commitOnBlur
            floatingLabelText={<Trans>Default height (in pixels)</Trans>}
            fullWidth
            type="number"
            value={tiledSpriteConfiguration.getHeight().toString()}
            onChange={(value) => {
              tiledSpriteConfiguration.setHeight(parseInt(value, 10) || 0);
              this.forceUpdate();
            }}
          />
        </ResponsiveLineStackLayout>
      </ColumnStackLayout>
    );
  }
}
