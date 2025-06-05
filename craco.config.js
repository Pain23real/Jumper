const path = require('path');
const webpack = require('webpack');

module.exports = {
  babel: {
    presets: [
      [
        '@babel/preset-env',
        {
          loose: true
        }
      ],
      ['@babel/preset-react', { runtime: 'automatic' }]
    ],
    plugins: [
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining'
    ]
  },
  webpack: {
    configure: (webpackConfig) => {
      // Настройка resolve.fallback для полифиллов в браузере
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "fs": false,
        "path": false,
        "os": false,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "zlib": require.resolve("browserify-zlib"),
        "assert": require.resolve("assert"),
        "url": require.resolve("url"),
        "process": require.resolve("process/browser"),
        "util": require.resolve("util"),
        "net": false,
        "tls": false
      };

      // Добавляем aliases для правильного разрешения модулей
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-native$': 'react-native-web',
        'process/browser': require.resolve('process/browser'),
        'process': require.resolve('process/browser'),
      };

      // Добавляем дополнительные плагины для поддержки библиотек блокчейна
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Настройка для больших бандлов
      webpackConfig.performance = {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
        hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
      };

      // Добавляем правило для обработки .mjs файлов
      webpackConfig.module.rules.push({
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      });

      return webpackConfig;
    }
  },
  // Оптимизация сборки
  jest: {
    configure: {
      moduleNameMapping: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
    },
  },
}; 