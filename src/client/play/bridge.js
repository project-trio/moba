import SocketIO from 'socket.io-client'

import CommonConsts from 'common/constants'

import Local from '@/play/local'

//LOCAL

console.log('CONNECTING', Local.TESTING)
const socketUrl = Local.TESTING ? `http://localhost:${CommonConsts.PORT}` : window.location.origin
const uid = localStorage.getItem('uid')
const uauth = localStorage.getItem('auth')
let params
if (uid && uauth) {
	params = {query: 'id=' + uid + '&auth=' + uauth}
}
const socket = SocketIO(socketUrl, params)

socket.on('connect', () => {
	Local.playerId = socket.id
	console.log('Connected', Local.playerId)

	socket.on('auth', (data) => {
		console.log('authed', data)
		//TODO
	})
})

//PUBLIC

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

}
