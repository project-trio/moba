'use strict';

const Webpack = require('webpack');

const config = require('./webpack.config.js');

config.debug = false;

config.plugins = [
	new Webpack.optimize.DedupePlugin(),
	new Webpack.optimize.UglifyJsPlugin({
		output: {
			comments: false,
		},
		compress: {
			warnings: false,
			screw_ie8: true,
		},
	}),
];

module.exports = config;
