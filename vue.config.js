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

	pages: {
		index: { entry: 'src/client/main.js' },
		admin: { entry: 'src/client/admin/main.js' },
	},

	chainWebpack (config) {
		config.module
			.rule('vox')
				.test(/\.(vox|typeface)$/)
				.use('url')
					.loader('url-loader')
					.options({
						query: {
							limit: 1,
						},
					})
	},
}
