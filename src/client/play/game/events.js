import Bridge from 'bridge'

import Local from 'local'

//SOCKET

Bridge.on('update', (data) => {
	const update = data.update
	if (Local.game.serverUpdate != update - 1) {
		console.error('Invalid update ' + Local.game.serverUpdate + ' ' + update)
	}
	Local.game.enqueueUpdate(update, data.moves)
	Bridge.emit('updated', {update: update})
})
