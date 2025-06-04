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
      // Добавляем полифиллы
      webpackConfig.resolve.fallback = {
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          https: require.resolve('https-browserify'),
          http: require.resolve('stream-http'),
          zlib: require.resolve('browserify-zlib'),
          assert: require.resolve('assert'),
        url: require.resolve('url'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        fs: false,
        path: false,
      };

      // Добавляем плагины
      webpackConfig.plugins = [
        ...(webpackConfig.plugins || []),
        new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
      ];

      // Добавляем алиасы для модулей
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'process/browser': require.resolve('process/browser')
      };

      return webpackConfig;
    }
  },
}; 