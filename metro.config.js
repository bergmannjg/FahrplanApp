/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

'use strict';

const nodelibs = require('node-libs-react-native');
nodelibs.vm = require.resolve('vm-browserify');
nodelibs.net = require.resolve('react-native-tcp');
nodelibs.tls = require.resolve('react-native-tcp');

// https://forums.expo.io/t/error-eperm-operation-not-permitted-lstat/19221

var getBlacklistRE = function getBlacklistRE() {
  return new RegExp("(.*\\android\\.*|.*\\__fixtures__\\.*|node_modules[\\\\]react[\\\\]dist[\\\\].*|website\\node_modules\\.*|heapCapture\\bundle\.js|.*\\__tests__\\.*)$");
}

module.exports = {
  resolver: {
    // "blacklistRE": getBlacklistRE(),
    extraNodeModules: nodelibs
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};
