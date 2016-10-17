'use strict';

const path = require('path');

module.exports = {

	debug: true,

	entry: [
		'babel-polyfill',
		// './src/client/scripts/perf.js', //SAMPLE
		'./src/client/scripts/main.js',
	],

	output: {
		filename: 'bundle.js',
		path: './public',
	},

	resolve: {
		root: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'src/client'), path.resolve(__dirname, 'src/client/scripts')],
		extensions: ['', '.js', '.css'],
	},

	module: {
		loaders: [
			{ test: /\.css$/, loader: 'style-loader!css-loader' },
			{ test: /\.png$/, loader: 'url-loader?limit=4096' },
			{ test: /\.vox$/, loader: 'url-loader?limit=1' },
			{ test: /\.(json)$/, loader: 'json-loader' },

			{
				include: [path.resolve(__dirname, 'src')],
				test: /\.js?$/,
				loader: 'babel',
				query: {
					plugins: ['transform-runtime'],
					presets: ['es2015'],
				},
			},
		],
	},

	externals: {
		'jquery': 'jQuery',
	},

};
