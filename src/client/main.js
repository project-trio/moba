import Vue from 'vue'
import App from './App'

import { TESTING } from '@/common/constants'

import router from '@/client/router'
import store from '@/client/store'
import util from '@/client/helpers/util'
import storage from '@/client/helpers/storage'

import Local from '@/client/play/local'

import Events from '@/client/play/events'
import LobbyEvents from '@/client/play/events/lobby'

// App

window.p = console.log
window.warn = console.warn
const emptyFunction = () => {}
console.log = console.warn = emptyFunction

Vue.config.productionTip = false

const hasSignin = store.state.signin.username !== null
if (hasSignin) {
	Events.init()
}

util.addListener(window, 'touchstart', emptyFunction)

//GUARD

router.beforeEach((to, from, next) => {
	if (to.name === 'Start') {
		if (store.state.signin.username) {
			return next({name: 'Lobby'})
		}
	} else if (!store.state.signin.username) {
		if (!store.state.signin.email) {
			return next({name: 'Start'})
		}
	} else if (to.name === 'Lobby') {
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

//INIT

const startupRoute = function () {
	if (!TESTING) {
		router.replace({ name: 'Lobby' })
	} else {
		// LobbyEvents.connect('quick', { mode: 'tutorial', size: 0, map: 'tutorial' }, (response) => { //SAMPLE
		LobbyEvents.connect('quick', { mode: 'bots', size: 1, map: 'tiny' }, (response) => { //SAMPLE
		// LobbyEvents.connect('quick', { mode: 'bots', size: 12, map: 'retro' }, (response) => { //SAMPLE
		// LobbyEvents.connect('quick', { mode: 'bots', size: 25, map: 'large' }, (response) => { //SAMPLE
			if (response.error) {
				console.error('quick', response)
			} else {
				router.push({ name: 'Join', params: { gid: response.gid } })
			}
		})
	}
}

if (hasSignin) {
	if (router.currentRoute.name === 'Game') {
		if (!Local.game) {
			startupRoute()
		}
	} else if (router.currentRoute.name === 'Start') {
		startupRoute()
	}
} else if (router.currentRoute.name !== 'Start') {
	router.replace({ name: 'Start' })
}
