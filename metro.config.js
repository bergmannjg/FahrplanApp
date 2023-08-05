/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

'use strict';

const nodelibs = require('node-libs-react-native');
nodelibs.vm = require.resolve('vm-browserify');
nodelibs.net = require.resolve('react-native-tcp-socket');
nodelibs.tls = require.resolve('react-native-tcp-socket');

module.exports = {
    resolver: {
        extraNodeModules: { ...nodelibs, 'node:buffer': require.resolve('buffer/') }
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
