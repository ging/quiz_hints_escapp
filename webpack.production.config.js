const { resolve } = require('path');
const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;

class PrependProjectLicensePlugin {
  apply(compiler) {
    compiler.plugin('done', () => {
      const licensePath = resolve(__dirname, 'LICENSE');
      const outputPath = resolve(
        __dirname,
        'dist',
        'LICENSE'
      );

      const projectLicense = fs.readFileSync(licensePath, 'utf8').trim();
      const thirdPartyLicenses = fs.readFileSync(outputPath, 'utf8').trim();

      const separator =
        '=================================================================================================';

      const combined = [
        projectLicense,
        '',
        separator,
        'Additional Third-Party Dependencies',
        separator,
        '',
        thirdPartyLicenses,
        ''
      ].join('\n');

      fs.writeFileSync(outputPath, combined, 'utf8');
    });
  }
}

const config = {
  devtool: 'cheap-module-source-map',

  entry: [
    'babel-polyfill',
    'react',
    'react-dom',
    './main.js'
  ],

  context: resolve(__dirname, 'app'),

  output: {
    filename: 'bundle.js',
    path: resolve(__dirname, 'dist'),
    publicPath: '',
  },

  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new HtmlWebpackPlugin({
      template: `${__dirname}/app/index.html`,
      filename: 'index.html',
      inject: false,
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false,
    }),
    new webpack.optimize.UglifyJsPlugin({
      beautify: false
    }),
    new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }),
    new ExtractTextPlugin({ filename: './styles/style.css', disable: false, allChunks: true }),
    new CopyWebpackPlugin([{ from: './vendors', to: 'vendors' }]),
    new LicenseWebpackPlugin({
      outputFilename: 'LICENSE',
      excludedPackageTest: (packageName) => packageName === 'QuizHintsEscapp',
      licenseTypeOverrides: {
        'regenerator-runtime': 'BSD-2-Clause'
      },
      licenseTextOverrides: {
        'babel-polyfill': fs.readFileSync(
          resolve(__dirname, 'licenses/babel-polyfill.txt'), 'utf8'
        ),
        'regenerator-runtime': fs.readFileSync(
          resolve(__dirname, 'licenses/regenerator-runtime.txt'), 'utf8'
        ),
        'isarray': fs.readFileSync(
          resolve(__dirname, 'node_modules/isarray/LICENSE'), 'utf8'
        )
      },
      handleMissingLicenseText: (packageName, licenseType) => {
        console.warn('Falta texto de licencia:', packageName, licenseType);
        return null;
      }
    }),
    new PrependProjectLicensePlugin()
  ],

  module: {
    loaders: [
      /* {
        enforce: "pre",
        test: /\.(es6|jsx|js)$/,
        exclude: /node_modules/,
        loader: "eslint-loader"
      }, */
      {
        test: /\.es6$/,
        exclude: /(node_modules|bower_components)/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['es2015'],
                plugins: [require('babel-plugin-transform-object-rest-spread')],
            },
        },
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
                presets: ['es2015', 'react'],
            },
        },
      },
      {
          test: /\.css$/,
          use: [
              "style-loader",
              "css-loader",
          ],
      },
      {
          test: /\.(scss|sass)$/,
          exclude: /(node_modules|bower_components)/,
          use: [
              'style-loader',
              'css-loader',
              { loader: 'sass-loader', options: { sourceMap: true } },
          ],
      },
      { test: /\.(png|jpg|gif)$/, use: 'file-loader' },
      { test: /\.eot(\?v=\d+.\d+.\d+)?$/, use: 'file-loader' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, use: 'file-loader' },
      { test: /\.[ot]tf(\?v=\d+.\d+.\d+)?$/, use: 'file-loader' },
      { test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, use: 'file-loader' },
    ]
  },
  resolve: {
        // resolve.alias could be useful for resolving certain modules easily
        extensions: ['.js', '.jsx', '.es6'],
    }
};

module.exports = config;
