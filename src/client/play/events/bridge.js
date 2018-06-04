import SocketIO from 'socket.io-client'

import CommonConsts from '@/common/constants'

import store from '@/client/store'

import Local from '@/client/play/local'

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
		const socketUrl = Local.TESTING ? `http://localhost:${CommonConsts.PORT}` : window.location.origin
		const username = store.state.signin.username || 'test'
		const params = {query: `name=${username}&v=${CommonConsts.VERSION}`}
		socket = SocketIO(socketUrl, params)

		socket.on('connect', () => {
			store.state.playerId = socket.id
			p('Connected', store.state.playerId)
			store.state.signin.loading = false

			socket.on('auth', (_data) => {
				// p('authed', data)
			})

			socket.on('disconnect', (data) => {
				p('disconnect', data)
				if (!Local.TESTING) {
					window.alert('Disconnected from the server. Reloading the page.')
				}
				window.location.reload(false)
			})
		})
	},

}
