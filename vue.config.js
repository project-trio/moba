const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {

	lintOnSave: true,
	productionSourceMap: false,

	devServer: {
		open: true,
		port: 8090,
		proxy: {
			'/api': {
				target: 'http://192.168.0.11:8091',
				changeOrigin: true,
			},
		},
	},

	configureWebpack: config => {
		config.entry.app = './src/client/main.js'

		// delete config.entry.app
		// config.entry.public = './src/client/main.js'
		// config.entry.admin = './src/client/admin/main.js'
		// config.plugins.push(
		// 	new HtmlWebpackPlugin({
		// 		filename: 'index.html',
		// 		template: 'public/index.html',
		// 		chunks: [ 'public', 'vendor' ],
		// 	})
		// )
		// config.plugins.push(
		// 	new HtmlWebpackPlugin({
		// 		filename: 'admin.html',
		// 		template: 'public/admin.html',
		// 		chunks: [ 'admin', 'vendor' ],
		// 	}),
		// )

		config.module.rules.push({
			test: /\.(vox|typeface)$/,
			loader: 'url-loader',
			query: {
				limit: 1,
			},
		})
	},

	// chainWebpack: config => {
	// 	config.entryPoints
	// 		.delete('app')
	// 	config.entry('public')
	// 		.add('./src/client/main.js')
	// 		.end()
	// 	config.entry('admin')
	// 		.add('./src/client/admin/main.js')
	// 		.end()
	// 	config.plugin('html')
	// 		.tap(args => {
	// 			args[0].chunks = [ 'public', 'vendor', 'manifest' ],
	// 			args[1] = {
	// 				filename: 'admin.html',
	// 				template: '/public/admin.html',
	// 				chunks: [ 'admin', 'vendor', 'manifest' ],
	// 			}
	// 			return args
	// 		})
	//
	// 	config.module
	// 		.rule('vox')
	// 			.test(/\.(vox|typeface)$/)
	// 			.use('url')
	// 				.loader('url-loader')
	// 				.options({
	// 					query: {
	// 						limit: 1,
	// 					},
	// 				})
	// },

}
