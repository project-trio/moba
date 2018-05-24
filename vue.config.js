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
