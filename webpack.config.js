const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const precss = require('precss');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ES3Plugin = require("webpack-es3-plugin");
const Dotenv = require('dotenv-webpack');
const plugins = [
    new HtmlWebpackPlugin({
        template: './src/views/index.html'
    }),
    new MiniCssExtractPlugin({
        filename: './styles/[name].css',
        chunkFilename: './styles/[id].css',
    }),
    new Dotenv({
        path: './.env',
        safe: true, // load '.env.example' to verify the '.env' variables are all set. Can also be a string to a different file.
        allowEmptyValues: true, // allow empty variables (e.g. `FOO=`) (treat it as empty string, rather than missing)
        systemvars: true, // load all the predefined 'process.env' variables which will trump anything local per dotenv specs.
        silent: true, // hide any errors
        defaults: true // load '.env.defaults' as the default values if empty.
    })
];

const config = {
    entry: '/src/index.js',
    target: "web",
    devtool: 'source-map',
    devServer: {
        contentBase: './dist',
    },
    plugins,
    module: {
        rules: [
            {
                test: /\.(png|svg|jpg|jpeg|gif|ico|woff|woff2|eot|ttf|otf)$/i,
                use: {
                    loader: "file-loader",
                    options: {
                        name: "[name].[ext]",
                        outputPath: "/assets/"
                    }
                }
            },
            {
                test: /\.json$/i,
                loader: 'json-loader',
                type: "javascript/auto"
            },
            {
                test: /\.(c|d)sv$/i,
                use: ['dsv-loader']
            },
            {
                test: /\.tsv$/i,
                use: ['dsv-loader?delimiter=\t']
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                exclude: /node_modules/
            },
            {
                test: /\.html$/i,
                use: ['html-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.html', '.scss', '.css', '.json'],
    },
    output: {
        filename: 'scripts/page.js',
        path: path.resolve(__dirname, 'dist')
    },
    optimization: {
        minimize: false,
        minimizer: [new TerserPlugin({
            extractComments: true,
            terserOptions: {
                ecma: "es3",
                parse: {},
                compress: {},
                mangle: true,
                ie8: true
            }
        })],
        nodeEnv: process.env.mode || 'production'
    }
};

module.exports = (env, argv) => {

    argv.open = false;

    if (argv.mode === "production") {
        config.plugins.push(...[new CleanWebpackPlugin(), new ES3Plugin(),]);
        config.devtool = false;
    }
    config.module.rules.push({
        test: /\.(css|sass|scss)$/i,
        use: [{
            loader: MiniCssExtractPlugin.loader,
        },
            {
                loader: 'css-loader',
                options: {
                    sourceMap: argv.mode === "production",
                    importLoaders: 4
                }
            },
            {
                loader: "postcss-loader",
                options: {
                    postcssOptions: {
                        plugins: [
                            precss,
                            autoprefixer
                        ]
                    }
                }
            }, {
                loader: 'sass-loader',
                options: {
                    sourceMap: argv.mode === "production"
                }
            }
        ]
    });

    return config;
};