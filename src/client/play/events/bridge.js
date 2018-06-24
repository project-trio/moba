import SocketIO from 'socket.io-client'

import { TESTING, VERSION } from '@/common/constants'

import store from '@/client/store'

//PUBLIC

let socket

export default {

	on (name, callback) {
		socket.on(name, callback)
	},

	emit (name, message, callback) {
		if (!socket) {
			return
		}
		socket.emit(name, message, callback)
	},

	init () {
		if (socket) {
			return
		}
		store.state.signin.loading = true

		const username = store.state.signin.username || 'test'
		const params = {query: `name=${username}&v=${VERSION}`}
		socket = SocketIO(params)

		socket.on('error', (error) => {
			p('error', error)
		})
		socket.on('connect', () => {
			store.state.playerId = socket.id
			p('Connected', store.state.playerId)
			store.state.signin.loading = false

			socket.on('auth', (_data) => {
				// p('authed', data)
			})

			socket.on('disconnect', (data) => {
				p('disconnect', data)
				if (!TESTING) {
					window.alert('Disconnected from the server. Reloading the page.')
				}
				window.location.reload(false)
			})
		})
	},

}
