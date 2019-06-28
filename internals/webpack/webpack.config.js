const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const argv = require('yargs').argv;
const cssnano = require('cssnano');
const appLocalesMomentPairs = require(path.join(process.cwd(), 'app/containers/App/constants')).appLocalesMomentPairs;
const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 4000;
const currentYear = new Date().getFullYear();

const config = {
  entry: path.join(process.cwd(), 'app/root'),

  output: {
    path: path.resolve(process.cwd(), 'build'),
    pathinfo: false,
    publicPath: '/',
    filename: isDev ? '[name].bundle.js' : '[name].[contenthash:8].bundle.js',
    chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash:8].chunk.js'
  },

  mode: isDev ? 'development' : 'production',

  devtool: isDev ? 'cheap-module-eval-source-map' : (isProd ? 'source-map' : false),

  devServer: {
    contentBase: path.join(process.cwd(), 'build'),
    port: 3000,
    host: '0.0.0.0',
    disableHostCheck: true,
    historyApiFallback: true,
    proxy: {
      '/web_api': `http://${API_HOST}:${API_PORT}`,
      '/auth/': `http://${API_HOST}:${API_PORT}`,
      '/widgets/': `http://${API_HOST}:3200`,
    },
  },

  ...!isDev && {
    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
      },
      minimizer: [
        new TerserPlugin({
          cache: true,
          parallel: true,
          sourceMap: true,
          terserOptions: {
            ecma: undefined,
            warnings: false,
            parse: {},
            compress: {},
            mangle: true,
            module: false,
            output: null,
            toplevel: false,
            nameCache: null,
            ie8: false,
            keep_classnames: undefined,
            keep_fnames: false,
            safari10: false
          }
        }),
        new OptimizeCSSAssetsPlugin({
          assetNameRegExp: /\.css$/g,
          cssProcessor: cssnano,
          cssProcessorPluginOptions: {
            preset: ['default', { discardComments: { removeAll: true } }],
          },
          canPrint: true
        })
      ]
    }
  },

  module: {
    rules: [
      {
        test: /\.(tsx?)|(js)$/,
        include: path.join(process.cwd(), 'app'),
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: isDev ? 'style-loader' : MiniCssExtractPlugin.loader },
          { loader: 'css-loader' },
        ],
      },
      {
        test: /\.(svg|jpg|png|gif)$/,
        use: [
          { loader: 'cache-loader' },
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        }
      },
      {
        test: /\.htaccess/,
        include: path.resolve(process.cwd(), 'app'),
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
          },
        },
      },
    ],
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        API_HOST: JSON.stringify(process.env.API_HOST),
        API_PORT: JSON.stringify(process.env.API_PORT),
        CROWDIN_PLUGIN_ENABLED: !!process.env.CROWDIN_PLUGIN_ENABLED,
        SEGMENT_API_KEY: JSON.stringify(process.env.SEGMENT_API_KEY),
        SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN),
        CI: JSON.stringify(process.env.CI),
        CIRCLECI: JSON.stringify(process.env.CIRCLECI),
        CIRCLE_BUILD_NUM: JSON.stringify(process.env.CIRCLE_BUILD_NUM),
        CIRCLE_SHA1: JSON.stringify(process.env.CIRCLE_SHA1),
        CIRCLE_BRANCH: JSON.stringify(process.env.CIRCLE_BRANCH),
      },
    }),

    new ForkTsCheckerWebpackPlugin({
      checkSyntacticErrors: true,
      tsconfig: path.join(process.cwd(), 'app/tsconfig.json'),
      silent: !!argv.json, // silent when trying to profile the chunks sizes
    }),

    new CleanWebpackPlugin(),

    new HtmlWebpackPlugin({
      template: 'app/index.html'
    }),

    // isDev && new BundleAnalyzerPlugin(),

    isDev && new webpack.ProgressPlugin(),

    !isDev && new webpack.HashedModuleIdsPlugin(),

    // remove all moment locales except 'en' and the ones defined in appLocalesMomentPairs
    !isDev && new MomentLocalesPlugin({
      localesToKeep: [...new Set(Object.values(appLocalesMomentPairs))]
    }),

    !isDev && new MomentTimezoneDataPlugin({
      startYear: 2012,
      endYear: currentYear + 10,
    }),

    !isDev && new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css'
    }),

    isProd && new SentryCliPlugin({
      include: path.resolve(process.cwd(), 'build'),
      release: process.env.CIRCLE_BUILD_NUM,
    })
  ].filter(Boolean),

  resolve: {
    modules: [path.resolve(process.cwd(), 'app'), 'node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
};

module.exports = config;
