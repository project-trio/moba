import router from '@/client/router'
import store from '@/client/store'

import Bridge from '@/client/play/events/bridge'

import Local from '@/client/play/local'

//SOCKET

export default {

	init () {
		Bridge.on('closed', () => {
			store.state.game.active = false
			window.alert('Game closed due to inactivity')
			router.replace({ name: 'Lobby' })
		})

		Bridge.on('update', (data) => {
			const game = Local.game
			if (game && !game.finished) {
				const update = data.update
				if (game.serverUpdate !== update - 1) {
					console.error('Invalid update', game.serverUpdate, update)
				}
				game.enqueueUpdate(update, data.actions)
				Bridge.emit('updated', { update: update })
			}
		})

		Bridge.on('msg', (data) => {
			if (Local.game) {
				const player = Local.game.player(data.id)
				data.from = player.name
				data.team = player.team
			}
			store.state.chatMessages.push(data)
		})
	},

}
