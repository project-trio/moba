import TrioClient from '@ky-is/trio-client'
import Vue from 'vue'

import App from './App'

import router from '@/router'
import store from '@/store'
import util from '@/helpers/util'
import storage from '@/helpers/storage'

import { TESTING } from '@/play/data/constants'

import '@/play/events'

import LobbyEvents from '@/play/events/lobby'
import Local from '@/play/local' /* eslint-disable-line no-unused-vars */

// App

window.p = console.log
window.warn = console.warn
const emptyFunction = () => {}
console.log = console.warn = emptyFunction

Vue.config.productionTip = false

util.addListener(window, 'touchstart', emptyFunction)

//GUARD

router.beforeEach((to, from, next) => {
	if (to.name === 'Lobby') {
		if (!storage.get('tutorial')) {
			return next({ name: 'Tutorial' })
		}
	}
	next()
})

new Vue({
	el: '#app',
	components: { App },
	data: store,
	router,
	render (createElement) {
		return createElement(App)
	},
})

TrioClient.init(router)

const startupRoute = function () { /* eslint-disable-line no-unused-vars */
	if (!TESTING) {
		return
	}
	LobbyEvents.connect('quick', { mode: 'tutorial', size: 0, map: 'tutorial' })
}

//SAMPLE
// if (router.currentRoute.name === 'Game') {
// 	if (!Local.game) {
// 		startupRoute()
// 	}
// } else if (router.currentRoute.name === 'Lobby') {
// 	startupRoute()
// }
