const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
var WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
    'mode': 'production',
    'entry': {
        'app_js': ['./src/index.js'],
        'app_css': ['./src/style.scss'],
    },
    'plugins': [
        new WebpackNotifierPlugin({
            'title': 'play',
            'contentImage': path.join(__dirname, 'public/app/icons/icon-256x256.png'),
        }),
        new MiniCssExtractPlugin({
            'filename': '[name].css',
        }),
    ],
    'output': {
        'filename': '[name].js',
        'path': path.resolve(__dirname, 'public/build'),
    },
    'module': {
        'rules': [
            {
                'test': /\.scss$/,
                'exclude': '/node_modules/',
                'use': [
                    {
                        'loader': 'file-loader',
                        'options': {
                            'name': '[name].min.css',
                        }
                    },
                    'sass-loader',
                    //'style-loader',
                    //'css-loader',
                ],
            },
            {
                'test': /\.(png|svg|jpg|gif)$/,
                'use': [
                    'file-loader',
                ],
            },
        ],
    },
};
