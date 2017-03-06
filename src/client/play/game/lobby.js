import Bridge from 'bridge'

import Local from 'local'
import Game from 'game/entity/game/game'

//LOCAL

const connectLobby = function (action) {
	Bridge.emit('lobby action', {action: action})
}

//SOCKET

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

//PUBLIC

export default {

	connect (name) {
		connectLobby(name)
	},

	listen (io) {
		io.on('join game', (data) => {
			console.log('Joined', data)
			const newGame = new Game(data.gid, data.size)
			newGame.updatePlayers(data)
			Local.game = newGame
		})

		io.on('add player', (data) => {
			console.log('Add ' + data)
			Local.game.updatePlayers(data)
		})

		io.on('remove player', (data) => {
			console.log('Del ' + data)
			Local.game.updatePlayers(data)
		})

		io.on('start game', (data) => {
			console.log('Start game')
			console.log(data)
			Local.game.updatePlayers(data)
			Local.game.start(data.updates, data.ticks)
		})
	},

}
