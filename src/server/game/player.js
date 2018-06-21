const CommonConsts = require.main.require('../common/constants')
const { randomItem } = require.main.require('../common/utils')

const queue = require.main.require('./app/queue')

const Util = require.main.require('./utils/util')

module.exports = class Player {

	constructor (client) {
		this.bot = !client
		this.client = client
		if (client) {
			this.id = client.pid
			this.name = client.name
		} else {
			const botId = `bot-${Util.code()}`
			this.id = botId
			this.name = botId
		}

		this.game = null
		this.team = null
		this.isActive = false

		this.shipName = null
		this.switchUnit = null
		this.actionUpdate = null
		this.serverUpdate = null
		this.updatesUntilAuto = 0
		this.actions = null
		this.levelNext = null
		this.chatAt = null

		this.queueing = false
		this.queueReady = false
		this.queueMin = 1
		this.queueMap = null
	}

	data () {
		return {
			id: this.id,
			name: this.name,
			shipName: this.shipName,
			team: this.team,
			bot: this.bot,
		}
	}

	emit (name, message) {
		if (this.client) {
			this.client.emit(name, message)
		}
	}

	reset (team) {
		this.team = team
		this.isActive = true
		this.switchUnit = null
		this.actionUpdate = 0
		this.serverUpdate = 0
		this.actions = []
		this.levelNext = null
		this.chatAt = null
	}

	setRetro (retro, tutorial) {
		const shipNames = retro ? CommonConsts.RETRO_SHIP_NAMES : CommonConsts.SHIP_NAMES
		this.shipName = this.client ? shipNames[tutorial ? 3 : 0] : randomItem(shipNames)
	}

	// Rooms

	join (room) {
		if (this.client) {
			this.client.join(room)
		}
	}

	leave (room) {
		if (this.client) {
			this.client.leave(room)
		}
	}

	// Game

	joinGame (game) {
		this.game = game

		this.join(game.id)
	}

	leaveGameRoom () {
		if (this.game) {
			this.leave(this.game.id)
		}
	}

	leaveGame () {
		if (this.game) {
			this.leaveGameRoom()
			const result = this.game.remove(this)
			this.game = null
			return result
		}
	}

	// Queue

	updateQueue (data) {
		this.queueReady = data.ready
		this.queueMin = data.size
		this.queueMap = data.map

		queue.update()
	}

	queueEnter () {
		this.join('queue')
	}

	queueLeave () {
		this.leave('queue')
	}

	disconnect () {
		queue.remove(this)

		return this.leaveGame()
	}
}
