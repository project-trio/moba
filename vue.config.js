module.exports = {

	productionSourceMap: false,

	devServer: {
		open: true,
		port: 8090,
		proxy: {
			'/socket.io': {
				target: 'http://localhost:8091',
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
				limit: 1024,
				esModule: false,
			})
			.end()
		config.optimization.minimizer('terser').tap((args) => {
			args[0].terserOptions.compress.drop_console = true
			return args
		})
	},
}
