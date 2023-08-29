/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const nodelibs = require('node-libs-react-native');
nodelibs.vm = require.resolve('vm-browserify');
nodelibs.net = require.resolve('react-native-tcp-socket');
nodelibs.tls = require.resolve('react-native-tcp-socket');

const config = {
    resolver: {
        extraNodeModules: { ...nodelibs, 'node:buffer': require.resolve('buffer/') }
    }
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);