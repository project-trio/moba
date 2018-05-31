const Socket = require('socket.io')

const CommonConsts = require.main.require('../common/constants')

const Util = require.main.require('./utils/util')

const Config = require.main.require('./game/config')

//PUBLIC

module.exports = {

	register (socket, player) {
		socket.on('switch unit', (data) => {
			if (!player.game) {
				console.log('Action ERR: No game for player')
				return
			}
			const newShip = data.name
			const shipNames = player.game.retro ? CommonConsts.RETRO_SHIP_NAMES : CommonConsts.SHIP_NAMES
			if (shipNames.indexOf(newShip) !== -1) {
				player.switchUnit = newShip
			}
		})

		socket.on('action', (data) => {
			if (!player.game) {
				console.log('Action ERR: No game for player')
				return
			}
			if (player.game.serverUpdate < Config.updatesUntilStart) {
				console.log('Action ERR: Game not started yet')
				return
			}
			if (player.actions.length > 10) {
				console.log('Action ERR: Too many actions')
				return
			}
			if (data.skill !== undefined) {
				if (data.level) {
					player.levelNext = data.skill
					return
				}
			}
			player.actions.push(data)
		})

		socket.on('chat', (data, callback) => {
			const response = {}
			if (!player.game && !player.queueing) {
				response.error = 'Not in game'
			} else {
				const updateTime = Util.seconds() // player.game.serverUpdate
				if (updateTime <= player.chatAt + 1) {
					response.error = 'Chatting too fast!'
				} else {
					player.chatAt = updateTime
					data.at = updateTime
					if (player.queueing) {
						data.from = player.name
						Socket.io.to('queue').emit('msg', data)
					} else {
						data.id = player.id
						if (data.all) {
							player.game.broadcast('msg', data)
						} else {
							player.game.teamBroadcast(player.team, 'msg', data)
						}
					}
				}
			}
			callback(response)
		})

		socket.on('updated', (data) => {
			player.serverUpdate = data.update
		})
	},

}
