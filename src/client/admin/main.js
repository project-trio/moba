import Vue from 'vue'
import App from './App'

Vue.config.productionTip = false
window.p = console.log

new Vue({
	el: '#app',
	components: { App },
	render (createElement) {
		return createElement(App)
	},
})
