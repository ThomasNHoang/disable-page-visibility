import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default{
  mode: 'production',
  entry: {
    disable: path.resolve(__dirname, 'src', 'disable.ts'),
    background: path.resolve(__dirname, 'src', 'background.ts'),
    popup: path.resolve(__dirname, 'src', 'popup.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
    clean: true, // Clean the dist folder before each build
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      // Rule for TypeScript files
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
      },
      // Rule for CSS files
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  optimization: {
    // Enable minimizers
    minimize: true,
    minimizer: [
      '...', // This extends the default minimizers (like terser for JS)
      new CssMinimizerPlugin(), // Add the CSS minimizer
    ],
  },
  plugins: [
    // Plugin to extract CSS into separate files
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),

    // Plugin to handle the popup.html file
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'public', 'popup.html'), // Use this as a template
      filename: 'popup.html',
      chunks: ['popup'], // Inject only the 'popup' bundle
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
      },
    }),

    // Plugin to copy remaining static files
    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          // Exclude popup.html since HtmlWebpackPlugin is handling it
          globOptions: {
            ignore: ['**/popup.html'],
          },
        },
      ],
    }),
  ],
};
