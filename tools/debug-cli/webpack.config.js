/* eslint-disable */
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: './cli.ts',
    mode: 'development',
    devtool: 'inline-source-map',
    target: 'node',
    externals: [nodeExternals()],
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};