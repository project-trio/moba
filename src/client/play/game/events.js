import Bridge from '@/play/bridge'

import Local from '@/play/local'

//SOCKET

export default {

	init () {
		Bridge.on('update', (data) => {
			const update = data.update
			if (Local.game.serverUpdate != update - 1) {
				if (Local.TESTING) {
					window.location.reload(false)
				} else {
					console.error('Invalid update ' + Local.game.serverUpdate + ' ' + update)
				}
			}
			Local.game.enqueueUpdate(update, data.moves)
			Bridge.emit('updated', {update: update})
		})
	},

}
