module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Prevent bundler from trying to polyfill or resolve `fs` (node-only) in browser
      webpackConfig.resolve = webpackConfig.resolve || {};
      webpackConfig.resolve.fallback = Object.assign({}, webpackConfig.resolve.fallback || {}, {
        fs: false
      });

      // Ignore noisy source-map-loader warnings about missing source maps
      // (face-api.js ships sourceMappingURLs pointing to TS sources not included in the package)
      webpackConfig.ignoreWarnings = webpackConfig.ignoreWarnings || [];
      webpackConfig.ignoreWarnings.push(/Failed to parse source map/);

      return webpackConfig;
    }
  }
};
