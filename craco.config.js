const path = require('path');
const webpack = require('webpack');

module.exports = {
  babel: {
    plugins: [
      ['styled-jsx/babel', { optimizeForSpeed: true }]
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
        "assert": require.resolve("assert/"),
        "url": require.resolve("url/"),
        "process": require.resolve("process/browser"),
      };

      // Добавляем дополнительные плагины для поддержки библиотек блокчейна
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Устанавливаем целевую платформу для Solana библиотек
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'react-native$': 'react-native-web',
      };

      // Отключаем минификацию для лучшей отладки на Vercel
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization.minimize = true;
        // Если есть проблемы, можно установить в false для отладки
      }

      // Настройка для больших бандлов
      webpackConfig.performance = {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
        hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
      };

      return webpackConfig;
    }
  },
  // Добавляем поддержку IE11 (опционально)
  babel: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['>0.2%', 'not dead', 'not op_mini all'],
          },
        },
      ],
    ],
    plugins: [
      '@babel/plugin-proposal-nullish-coalescing-operator',
      '@babel/plugin-proposal-optional-chaining',
    ],
  },
  // Оптимизация сборки
  jest: {
    configure: {
      moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
      },
    },
  },
}; 