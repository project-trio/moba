const Socket = require('socket.io')

const CommonConsts = require.main.require('../common/constants')
const CommonMaps = require.main.require('../common/maps')

const queue = require.main.require('./app/queue')

const Game = require.main.require('./game/game')

//LOCAL

const broadcastWith = function (withPlayers, withGames) {
	const data = {}
	if (withPlayers) {
		data.online = lobby.playerCount
	}
	if (withGames) {
		data.games = Game.getList()
	}
	Socket.io.to('lobby').emit('lobby', data)
}

const createGame = function (player, mode, size, map, joining, autoStart) {
	const response = {}
	if (player.game) {
		response.error = 'Already in a game'
	} else if (mode !== 'tutorial' && CommonConsts.GAME_MODES.map((mode) => mode.name).indexOf(mode) === -1) {
		response.error = 'Invalid game mode'
	} else if (mode !== 'tutorial' && CommonConsts.GAME_SIZES.indexOf(size) === -1) {
		response.error = 'Invalid game size'
	} else if (mode !== 'bots' && size > 1 && !CommonConsts.TESTING && player.name !== 'kiko ') {
		response.error = 'You need to register before creating a game larger than 1v1'
	} else if (!map) {
		response.error = 'Please choose a map'
	} else {
		const mapData = CommonMaps[map]
		if (!mapData) {
			response.error = 'Invalid map'
		} else if (!joining && size < mapData.minSize) { //TODO remove joining
			response.error = 'Chosen map too big for game size'
		} else if (!joining && mapData.maxSize && size > mapData.maxSize) {
			response.error = 'Chosen map too small for game size'
		} else {
			const game = new Game(mode, size, map, autoStart)
			if (joining) {
				const joinData = game.add(player)
				if (joinData.error) {
					game.destroy()
					response.error = joinData.error
					response.backToLobby = true
				}
			}
			if (!response.error) {
				broadcastWith(false, true)
				response.gid = game.id
			}
		}
	}
	return response
}

const join = function(player, gid, callback) {
	const games = Game.all
	for (const game of games) {
		if (game.id === gid) {
			const gameData = game.add(player)
			if (gameData.error) {
				callback({ error: gameData.error })
				return false
			}
			callback(gameData)
			return true
		}
	}
	callback({error: "Game doesn't exist"})
}

const quickJoin = function (player, mode, size, map) {
	const games = Game.all
	for (const game of games) {
		if (game.mode === game && game.size === size && game.map === map) {
			const gameData = game.add(player)
			if (!gameData.error) {
				return { gid: game.id }
			}
		}
	}
	return createGame(player, mode, size, map, true, true)
}

//PUBLIC

const lobby = {

	playerCount: 0,

	broadcastWith: broadcastWith,

	register (socket, player) {
		socket.on('start game', (data, callback) => {
			const game = player.game
			const response = {}
			if (game) {
				if (game.hostId === socket.id) {
					if (game.canStart()) {
						game.start()
						broadcastWith(false, true)
					} else {
						response.error = 'Waiting for players to join'
					}
				} else {
					response.error = 'You are not the host'
				}
			} else {
				response.error = 'Game not found'
			}
			callback(response)
		})

		socket.on('lobby action', (data, callback) => {
			console.log('lobby action', data)
			if (player.game && data.leaving !== player.game.id) {
				callback({ reenter: player.game.id })
				return
			}
			if (data.action !== 'queue') {
				queue.remove(player)
			}
			if (data.action === 'enter') {
				if (player.game && data.leaving) {
					player.leaveGame()
				}
				socket.join('lobby')
				callback({ online: lobby.playerCount, games: Game.getList() })
			} else {
				socket.leave('lobby')
				if (data.action === 'queue') {
					queue.add(player, data)
				} else if (data.action === 'leave') {
					player.leaveGame()
				} else if (data.action === 'quick') {
					const gameResponse = quickJoin(player, data.mode, data.size, data.map)
					callback(gameResponse)
				} else if (data.action === 'create') {
					const gameResponse = createGame(player, data.mode, data.size, data.map, false, false)
					callback(gameResponse)
				} else if (data.action === 'join') {
					join(player, data.gid, callback)
				} else {
					console.error('Unknown lobby action', data)
				}
			}
		})

		socket.on('queue', (data, _callback) => {
			player.updateQueue(data)
		})
	},
}

module.exports = lobby
