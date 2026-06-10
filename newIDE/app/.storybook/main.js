module.exports = {
  framework: {
    name: '@storybook/react-vite',
  },

  stories: ['../src/stories/componentStories/**/*.stories.js'],
  staticDirs: ['../public'],

  addons: [
    {
      name: '@storybook/addon-essentials',
      options: {
        docs: false,
      },
    },
  ],

  async viteFinal(config) {
    config.build = config.build || {};
    config.build.cssMinify = 'esbuild';
    config.build.rolldownOptions = config.build.rolldownOptions || {};
    config.build.rolldownOptions.external = [
      ...(config.build.rolldownOptions.external || []),
      'react-dnd-html5-backend',
    ];
    config.plugins = config.plugins || [];
    config.plugins.push({
      name: 'resolve-sb-preview',
      resolveId(source) {
        if (source === './sb-preview/runtime.js') {
          return { id: './sb-preview/runtime.js', external: true };
        }
        return null;
      },
    });
    return config;
  },
};
