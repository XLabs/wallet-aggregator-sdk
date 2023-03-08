const { ProvidePlugin } = require("webpack");

module.exports = function override(config, env) {
  return {
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        // {
        //   test: /\.js$/,
        //   enforce: "pre",
        //   use: ["source-map-loader"],
        //   resolve: {
        //     fullySpecified: false,
        //   }
        // },
        // {
        //   test: /\.wasm$/,
        //   type: "webassembly/async",
        // },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    plugins: [
      ...config.plugins,
      new ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      }),
    ],
    resolve: {
      ...config.resolve,
      fallback: {
        assert: "assert",
        buffer: "buffer",
        crypto: require.resolve("crypto-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        stream: require.resolve("stream-browserify"),
        os: require.resolve("os-browserify"),
        url: require.resolve("url"),
      },
    },
    experiments: {
      asyncWebAssembly: true,
    },
    ignoreWarnings: [/Failed to parse source map/],
  };
};
