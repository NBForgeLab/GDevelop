const path = require('path');

const isBabelLoaderRule = rule =>
  rule &&
  ((typeof rule.loader === 'string' && rule.loader.includes('babel-loader')) ||
    (Array.isArray(rule.use) &&
      rule.use.some(
        useEntry =>
          useEntry &&
          typeof useEntry === 'object' &&
          typeof useEntry.loader === 'string' &&
          useEntry.loader.includes('babel-loader')
      )));

const isDefaultStorybookRuleToReplace = rule => {
  if (!rule) return false;
  if (
    rule.test instanceof RegExp &&
    (rule.test.toString() === /\.css$/.toString() ||
      rule.test.toString() === /\.md$/.toString())
  ) {
    return true;
  }
  if (
    (rule.type === 'asset/resource' || rule.type === 'asset') &&
    rule.test instanceof RegExp
  ) {
    return true;
  }
  return false;
};

module.exports = {
  env: config => ({
    PUBLIC_URL: '.',
    REACT_APP_ENV: '',
    ...config,
  }),
  framework: {
    name: '@storybook/react-webpack5',
  },

  features: {
    storyStoreV7: false,
  },

  stories: ['../src/stories/**/*.stories.js'],
  staticDirs: ['../public'],

  addons: [
    {
      name: '@storybook/addon-essentials',
      options: {
        docs: false,
      },
    },
  ],

  webpackFinal: async (config, { configType }) => {
    const isProd = configType === 'PRODUCTION';
    const localesDir = path.resolve(__dirname, '../src/locales');
    const assetFilename = isProd
      ? 'static/media/[name].[contenthash:8][ext]'
      : 'static/media/[path][name][ext]';

    // Let Babel load newIDE/app/.babelrc.json (and .storybook/.babelrc which
    // extends it), while excluding large compiled locale files and .d.ts files.
    const rules = (config.module && config.module.rules) || [];
    config.module.rules = rules
      .filter(rule => !isDefaultStorybookRuleToReplace(rule))
      .map(rule => {
        if (!isBabelLoaderRule(rule)) return rule;

        const existingExclude = Array.isArray(rule.exclude)
          ? rule.exclude
          : rule.exclude
          ? [rule.exclude]
          : [];

        return {
          ...rule,
          exclude: [...existingExclude, localesDir, /\.d\.ts$/],
        };
      });

    // Text files imported as strings (the public API of editor functions).
    config.module.rules.push({
      test: /\.(md|d\.ts)$/,
      type: 'asset/source',
    });

    // Web workers.
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: {
        loader: require.resolve('worker-loader'),
        options: {
          filename: '[name].[contenthash].worker.js',
        },
      },
    });

    // CSS Modules (*.module.css) and standard CSS.
    config.module.rules.push(
      {
        test: /\.module\.css$/,
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              modules: {
                localIdentName: isProd
                  ? '[hash:base64]'
                  : '[path][name]__[local]',
              },
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        sideEffects: true,
        use: [
          require.resolve('style-loader'),
          {
            loader: require.resolve('css-loader'),
            options: {
              importLoaders: 1,
              modules: false,
            },
          },
        ],
      }
    );

    // SVG imported from JS/MDX (ReactComponent + URL) vs referenced from CSS/assets.
    config.module.rules.push(
      {
        test: /\.svg$/,
        type: 'javascript/auto',
        issuer: {
          and: [/\.(ts|tsx|js|jsx|mjs|md|mdx)$/],
        },
        use: [
          {
            loader: require.resolve('@svgr/webpack'),
            options: {
              prettier: false,
              svgo: false,
              svgoConfig: {
                plugins: [{ removeViewBox: false }],
              },
              titleProp: true,
              ref: true,
            },
          },
          {
            loader: require.resolve('file-loader'),
            options: {
              name: isProd
                ? 'static/media/[name].[contenthash:8].[ext]'
                : 'static/media/[path][name].[ext]',
            },
          },
        ],
      },
      {
        test: /\.svg(\?.*)?$/,
        issuer: {
          not: [/\.(ts|tsx|js|jsx|mjs|md|mdx)$/],
        },
        type: 'asset/resource',
        generator: {
          filename: assetFilename,
        },
      }
    );

    // Images, fonts, and media assets.
    config.module.rules.push(
      {
        test: /\.(ico|jpg|jpeg|png|apng|gif|eot|otf|webp|ttf|woff|woff2|cur|ani|pdf)(\?.*)?$/,
        type: 'asset/resource',
        generator: {
          filename: assetFilename,
        },
      },
      {
        test: /\.(mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10000,
          },
        },
        generator: {
          filename: assetFilename,
        },
      }
    );

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Failed to parse source map/,
    ];

    return config;
  },
};
