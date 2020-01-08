import TrioClient from '@ky-is/trio-client'
import Vue from 'vue'

import App from './App'

import router from '@/client/router'
import store from '@/client/store'
import util from '@/client/helpers/util'
import storage from '@/client/helpers/storage'

import { TESTING } from '@/client/play/data/constants'

import '@/client/play/events'

import LobbyEvents from '@/client/play/events/lobby'
import Local from '@/client/play/local' /* eslint-disable-line no-unused-vars */

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
			return next({name: 'Tutorial'})
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
	LobbyEvents.connect('quick', { mode: 'tutorial', size: 0, map: 'tutorial' }, (response) => { //SAMPLE
	// LobbyEvents.connect('quick', { mode: 'bots', size: 1, map: 'tiny' }, (response) => { //SAMPLE
	// LobbyEvents.connect('quick', { mode: 'bots', size: 12, map: 'retro' }, (response) => { //SAMPLE
	// LobbyEvents.connect('quick', { mode: 'bots', size: 25, map: 'large' }, (response) => { //SAMPLE
		if (response.error) {
			console.error('quick', response)
		} else {
			router.push({ name: 'Join', params: { gid: response.gid } })
		}
	})
}

//SAMPLE
// if (router.currentRoute.name === 'Game') {
// 	if (!Local.game) {
// 		startupRoute()
// 	}
// } else if (router.currentRoute.name === 'Lobby') {
// 	startupRoute()
// }
