/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Добавляем полифиллы для Node.js модулей в браузере
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        process: require.resolve('process/browser'),
      };

      // Добавляем плагины для полифиллов
      config.plugins.push(
        new (require('webpack')).ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer'],
        })
      );
    }

    return config;
  },
  // Отключаем ESLint при сборке в Vercel (опционально)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Отключаем TypeScript проверки при сборке в Vercel (опционально)
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig; 