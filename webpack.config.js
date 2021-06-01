const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const envD = require('./src/config.dev.json');
// const env = require('/src/config.deployment.json');

const mode = "development";

module.exports = (env) => {
    env = envD;
    return {
        mode: mode,
        entry: '/src/scripts/index.ts',
        devtool: 'inline-source-map',
        devServer: {
            contentBase: './dist',
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
                {
                    test: /\.s[ac]ss$/i,
                    use: [
                        "style-loader",
                        "css-loader",
                        "sass-loader",
                    ],
                },
                // {
                //     test: /\.pug$/,
                //     use: 'pug-loader',
                //     exclude: /node_modules/,
                // },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.pug', '.html', '.scss', '.css'],
        },
        plugins: [
            new HtmlWebpackPlugin({
                title: 'Development',
            }),
        ],
        output: {
            filename: 'page.js',
            path: path.resolve(__dirname, 'dist'),
        },
    }
};