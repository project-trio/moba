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
		rules: [
			{
				test: /\.css$/,
				use: [
					{loader: 'style-loader'},
					{loader: 'css-loader'},
				],
			},
			{
				test: /\.png$/,
				loader: 'url-loader?limit=4096',
			},
			{
				test: /\.vox$/,
				loader: 'url-loader?limit=1',
			},
			{ 
				test: /\.js$/,
				loader: 'babel-loader',
				include: [path.resolve(__dirname, 'src')],
				options: {
					// plugins: ['transform-runtime'],
					presets: ['es2015'],
				},
			}
		],
	},

	externals: {
		'jquery': 'jQuery',
	},

};
