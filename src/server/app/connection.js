const Socket = require('socket.io')

const CommonConsts = require.main.require('../common/constants')

const User = require.main.require('./app/entity/user')

const lobby = require.main.require('./app/lobby')

const Game = require.main.require('./game/game')
const GameEvents = require.main.require('./game/events')
const Player = require.main.require('./game/player')

//LOCAL

const clientPlayers = {}

const getPlayerNames = function () {
	return Object.keys(clientPlayers)
}

//SOCEKTS

module.exports = {

	init () {
		Socket.io.use((socket, next) => {
			var query = socket.handshake.query
			if (query.v === CommonConsts.VERSION) {
				const pid = socket.client.id
				socket.pid = pid
				socket.name = query.name || 'test'
				next()
			} else {
				socket.emit('reload', {v: CommonConsts.VERSION})
			}
		})

		Socket.io.on('connection', (socket) => {
			if (!socket.name) {
				return
			}
			const pid = socket.pid
			const name = socket.name
			let player = clientPlayers[name]
			if (player) {
				const oldClient = player.client
				if (oldClient) {
					oldClient.replaced = true
					oldClient.disconnect()
				} else {
					lobby.playerCount += 1
				}
				player.client = socket
				player.id = socket.id //TODO unecessary with acount registration
			} else {
				player = new Player(socket)
				clientPlayers[name] = player
				lobby.playerCount += 1
				lobby.broadcastWith(true, false)
			}

			socket.on('admin', (data, callback) => {
				if (CommonConsts.TESTING || name === 'kiko ' || name === 'mod') {
					callback({ names: getPlayerNames(), games: Game.getList() })
				}
			})

			socket.on('disconnect', () => {
				console.log('Disconnected', socket.id)

				const removePlayerPermanently = player.disconnect()
				if (clientPlayers[name] && !socket.replaced) {
					if (removePlayerPermanently) {
						delete clientPlayers[name]
						player = null
					} else {
						player.client = null
					}
					lobby.playerCount -= 1
				}
				lobby.broadcastWith(true, removePlayerPermanently)
			})

			lobby.register(socket, player)
			GameEvents.register(socket, player)

			socket.emit('auth')
		})
	},

}
