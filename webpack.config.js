'use strict';

const path = require('path');

module.exports = {

	debug: true,

	entry: './src/client/scripts/main.js',
	// entry: './src/client/scripts/perf.js',

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
				test: /\.js?$/,
				exclude: /(node_modules)/,
				loader: 'babel',
				query: {
					presets: ['es2015'],
				},
			},
		],
	},

	externals: {
		'jquery': 'jQuery',
	},

};
