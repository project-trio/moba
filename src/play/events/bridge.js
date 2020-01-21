import TrioClient from '@ky-is/trio-client'

import store from '@/app/store'

import { TESTING } from '@/play/data/constants'

const socket = TrioClient.connectTo('moba', store.state.signin.token, (token) => {
	store.signinToken(token)
}, (user) => {
	store.state.signin.user = user
}, (reconnectAttempts) => {
	store.state.signin.reconnect = reconnectAttempts
}, (error) => {
	console.log(error)
})

socket.on('disconnect', (data) => {
	if (!TESTING) {
		window.alert('Disconnected from the server. Reloading the page.')
	}
	window.location.reload(false)
})

export default socket
