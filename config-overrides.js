const path = require("path");
const fs = require("fs");
const webpack = require('webpack');
const WasmPackPlugin = require('@wasm-tool/wasm-pack-plugin');

module.exports = function override(config, env) {
  console.log(config);

  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify"),
      "path": require.resolve("path-browserify"),
      "vm": false,
      "url": require.resolve("url")
  })
  config.resolve.fallback = fallback;
  config.plugins = (config.plugins || []).concat([
      new webpack.ProvidePlugin({
          process: 'process/browser',
          Buffer: ['buffer', 'Buffer']
      })
  ]);

  // 配置webpack忽略有问题的包
  config.resolve.alias = {
    ...config.resolve.alias,
    '@base-org/account': false
  };
  
  // 或者使用IgnorePlugin忽略这个包
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /@base-org\/account/
    })
  );

  /*
  config.plugins = (config.plugins || []).concat([
      new WasmPackPlugin({
          crateDirectory: path.resolve(__dirname, './src/tdengine/'),
      }),
  ])
  */



  // web3subscriber配置已移除，使用zkwasm-minirollup-browser替代

  const wasmExtensionRegExp = /\.wasm$/;
  config.resolve.extensions.push('.wasm');

  config.experiments = {
    asyncWebAssembly: true
  }

  config.module.rules.forEach(rule => {
    (rule.oneOf || []).forEach(oneOf => {
      if (oneOf.loader && oneOf.loader.indexOf('file-loader') >= 0) {
        oneOf.exclude.push(wasmExtensionRegExp)
      }
    })
  })

  config.module.rules.push({
          test: /\.m?js$/,
          resolve: {
                  fullySpecified: false,
          },
  });

  return config
}
