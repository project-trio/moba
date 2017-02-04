'use strict';

const path = require('path');

module.exports = {

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
		modules: [
			path.resolve(__dirname, 'src'),
			path.resolve(__dirname, 'src/client'),
			path.resolve(__dirname, 'src/client/scripts'),
			'node_modules',
		],
		extensions: ['.js', '.css'],
	},

	module: {
		loaders: [
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'},
				],
			},
			{
				test: /\.png$/,
				use: [
					{loader: 'url-loader?limit=4096'},
				],
			},
			{
				test: /\.vox$/,
				use: {loader: 'url-loader?limit=1'},
			},
		],
	},

	externals: {
		'jquery': 'jQuery',
	},

};
