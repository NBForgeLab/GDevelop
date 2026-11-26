import { action } from '@storybook/addon-actions';
import { type HotReloadPreviewButtonProps } from '../HotReload/HotReloadPreviewButton';

/**
 * Fake "external editors" to be used in Storybook.
 */
const fakeHotReloadPreviewButtonProps: HotReloadPreviewButtonProps = {
  hasPreviewsRunning: false,
  launchProjectDataOnlyPreview: async () => {
    action('launchProjectDataOnlyPreview')();
  },
  launchProjectCodeAndDataPreview: async () => {
    action('launchProjectCodeAndDataPreview')();
  },
  launchProjectWithLoadingScreenPreview: async () => {
    action('launchProjectWithLoadingScreenPreview')();
  },
};

export default fakeHotReloadPreviewButtonProps;
