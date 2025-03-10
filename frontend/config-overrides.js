const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add fallback for node polyfills
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve?.fallback,
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "stream": require.resolve("stream-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "zlib": require.resolve("browserify-zlib"),
      "url": require.resolve("url/"),
      "assert": require.resolve("assert/"),
      "buffer": require.resolve("buffer/"),
      "process": false,
      "path": require.resolve("path-browserify"),
      "fs": false,
      "os": require.resolve("os-browserify/browser"),
      "net": false,
      "tls": false,
      "child_process": false
    },
    alias: {
      'process/browser': require.resolve('process/browser')
    }
  };

  // Add plugins
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ];

  // Ignore source-map-loader warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  return config;
} 