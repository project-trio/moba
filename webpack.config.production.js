'use strict';

const Webpack = require('webpack');

const config = require('./webpack.config.js');

config.plugins = [
	new Webpack.optimize.UglifyJsPlugin({
		output: {
			comments: false,
		},
		compress: {
			screw_ie8: true,
		},
	}),
];

module.exports = config;
