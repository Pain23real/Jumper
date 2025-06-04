const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для запросов к Solana API
  app.use(
    '/solana',
    createProxyMiddleware({
      target: 'https://api.mainnet-beta.solana.com',
      changeOrigin: true,
      pathRewrite: {
        '^/solana': '/'
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      }
    })
  );

  // Прокси для запросов к Solflare API
  app.use(
    '/solflare',
    createProxyMiddleware({
      target: 'https://solflare.com',
      changeOrigin: true,
      pathRewrite: {
        '^/solflare': '/'
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
      }
    })
  );
}; 