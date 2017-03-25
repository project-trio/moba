import router from '@/router'

import Bridge from '@/play/events/bridge'

import Local from '@/play/local'
import Game from '@/play/game/entity/game/game'

export default {

	connect (name, data, callback) {
		if (!data) {
			data = {}
		}
		data.action = name
		Bridge.emit('lobby action', data, callback)
	},

	init () {
		Bridge.on('join game', (data) => {
			console.log('Joined', data, router.currentRoute)
			const url = `/lobby/join/${data.gid}`
			if (router.currentRoute.name === 'Create') {
				router.replace(url)
			} else {
				router.push(url)
			}
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
			const newGame = new Game(data.gid, data.size)
			newGame.updatePlayers(data)
			newGame.start(data.updates, data.ticks)
			Local.game = newGame
		})
	},

}
