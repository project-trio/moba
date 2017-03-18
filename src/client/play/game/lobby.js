import Bridge from '@/play/bridge'

import Local from '@/play/local'
import Game from '@/play/game/entity/game/game'

export default {

	connect (name) {
		Bridge.emit('lobby action', {action: name})
	},

	init () {
		Bridge.on('join game', (data) => {
			console.log('Joined', data)
			const newGame = new Game(data.gid, data.size)
			newGame.updatePlayers(data)
			Local.game = newGame
		})

		Bridge.on('add player', (data) => {
			console.log('Add ' + data)
			Local.game.updatePlayers(data)
		})

		Bridge.on('remove player', (data) => {
			console.log('Del ' + data)
			Local.game.updatePlayers(data)
		})

		Bridge.on('start game', (data) => {
			console.log('Start game')
			console.log(data)
			Local.game.updatePlayers(data)
			Local.game.start(data.updates, data.ticks)
		})
	},

}
