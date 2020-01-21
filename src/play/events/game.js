import router from '@/app/router'
import store from '@/app/store'

import Bridge from '@/play/events/bridge'

import Local from '@/play/local'

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
		const player = Local.game.playerForId(data.id)
		data.from = player.name
		data.team = player.team
	}
	store.state.chatMessages.push(data)
})
