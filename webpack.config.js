'use strict';

const path = require('path');

module.exports = {

	entry: './src/client/scripts/main.js',

	output: {
		filename: 'bundle.js',
		path: './public',
	},

	resolve: {
		root: [path.resolve('./src'), path.resolve('./src/client'), path.resolve('./src/client/scripts')],
		extensions: ['', '.js', '.css'],
	},

	module: {
		loaders: [
			{ test: /\.css$/, loader: 'style-loader!css-loader' },
			{ test: /\.png$/, loader: 'url-loader?limit=4096' },
			{ test: /\.vox$/, loader: 'url-loader?limit=1' },
			{ test: /\.(json)$/, loader: 'json-loader' },

			{
				test: /\.jsx?$/,
				exclude: /(node_modules)/,
				loader: 'babel',
				query: {
					presets: ['es2015'],
				},
			},
		],

		postLoaders: [
			{
				include: path.resolve(__dirname, 'node_modules/pixi.js'),
				loader: 'transform-loader/cacheable?brfs'
			}
		],
	},

	externals: {
		'jquery': 'jQuery',
	},

};
