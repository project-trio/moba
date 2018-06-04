const SocketIO = require('socket.io')

const CommonConsts = require.main.require('../common/constants')
const CommonMaps = require.main.require('../common/maps')

const Util = require.main.require('./utils/util')

const Config = require.main.require('./game/config')
const Player = require.main.require('./game/player')

//CONSTRUCTOR

const games = []

class Game {

	constructor (mode, size, map, autoStart) {
		const mapData = CommonMaps[map]
		this.players = []
		this.counts = [0, 0]
		this.id = Util.uid()
		this.mode = mode
		this.botMode = mode === 'bots'
		this.size = size
		this.map = map
		this.retro = map === 'retro'
		this.mapWidth = mapData.width
		this.mapHeight = mapData.height
		this.game = null
		this.state = 'OPEN'
		this.serverUpdate = 0
		this.idleCount = 0
		this.started = false
		this.hostId = null
		this.autoStart = autoStart

		console.log('Created game', this.id)
		games.push(this)

		if (this.botMode) {
			let botTeam = 1
			this.counts[botTeam] = size
			for (let teamIndex = 0; teamIndex < size; teamIndex += 1) {
				const player = new Player(null)
				this.players.push(player)
				player.resetGame(botTeam, teamIndex, this.retro)
			}
			if (CommonConsts.TESTING || size >= 10) {
				botTeam = 0
				this.counts[botTeam] = size - 1
				for (let teamIndex = 0; teamIndex < size - 1; teamIndex += 1) {
					const player = new Player(null)
					this.players.push(player)
					player.resetGame(botTeam, teamIndex, this.retro)
				}
			}
		}
	}

//PRIVATE

	playerById (id) {
		for (const player of this.players) {
			if (player.id === id) {
				return player
			}
		}
		return null
	}

	activePlayerCount () {
		let result = 0
		for (const player of this.players) {
			if (!player.bot && player.isActive) {
				result += 1
			}
		}
		return result
	}

	playerCount () {
		return this.counts[0] + this.counts[1]
	}

	checkFull () {
		return this.playerCount() >= this.size * 2
	}

//STATE

	canStart () {
		if (this.botMode) {
			return this.counts[0]
		}
		if (this.counts[0] === this.counts[1]) {
			// const minSize = Math.ceil(this.size / 2) //TODO later
			return true
		}
		return false
	}

//JOIN

	formattedPlayers () {
		const broadcastPlayers = []
		for (const player of this.players) {
			broadcastPlayers.push(player.data())
		}
		return broadcastPlayers
	}

	add (player) {
		const pid = player.id
		if (this.playerById(pid)) {
			player.isActive = true
			this.broadcast('update player', { pid: pid, joined: true })
		} else {
			if (this.state !== 'OPEN') {
				return { error: `Unable to join: ${this.state} game` }
			}
			if (!this.hostId) {
				this.hostId = pid
			}
			const team = this.counts[0] <= this.counts[1] ? 0 : 1
			const teamSize = this.counts[team]
			this.counts[team] += 1
			this.players.push(player)
			player.resetGame(team, teamSize, this.retro)

			if (this.checkFull()) {
				this.state = 'FULL'
			}
			this.broadcast('players', { ready: this.canStart(), players: this.formattedPlayers() })
			player.joinGame(this)
		}
		return { gid: this.id, host: this.hostId, mode: this.mode, size: this.size, map: this.map, ready: this.canStart(), players: this.formattedPlayers() }
	}

	destroy () {
		this.state = 'CLOSED'
		this.started = false
		for (const player of this.players) {
			player.leaveGameRoom()
			player.game = null
		}
		this.players = {}

		for (let idx = games.length - 1; idx >= 0; idx -= 1) {
			if (games[idx].id === this.id) {
				games.splice(idx, 1)
				return
			}
		}
		console.log('ERR unable to remove deleted game', this.id)
	}

	remove (removePlayer) {
		const removeId = removePlayer.id
		const players = this.players
		let removeIndex = null
		for (let idx = 0; idx < players.length; idx += 1) {
			if (players[idx].id === removeId) {
				removeIndex = idx
				break
			}
		}
		if (removeIndex !== null) {
			if (this.started) {
				removePlayer.isActive = false
			} else {
				this.counts[removePlayer.team] -= 1
				this.players.splice(removeIndex, 1)
			}

			if (this.activePlayerCount() <= 0) {
				this.destroy()
				return true
			}
			if (!this.started) {
				this.state = 'OPEN'
				for (const remainingPlayer of this.players) {
					if (remainingPlayer.team === removePlayer.team && remainingPlayer.teamIndex > removePlayer.teamIndex) {
						remainingPlayer.teamIndex -= 1
					}
				}
				this.broadcast('players', { ready: this.canStart(), players: this.formattedPlayers() })
				return true
			}

			this.broadcast('update player', { pid: removeId, joined: false })
		}
	}

//METHODS

	start () {
		this.broadcast('start game', {
			gid: this.id,
			mode: this.mode,
			size: this.size,
			map: this.map,
			players: this.formattedPlayers(),
			updates: Config.updateDuration,
			ticks: Config.tickDuration,
			updatesUntilStart: Config.updatesUntilStart,
		})
		this.state = 'STARTED'
		this.started = true
		console.log('Started game', this.id)
	}

	teamBroadcast (team, name, message) {
		for (const player of this.players) {
			if (player.team === team) {
				player.emit(name, message)
			}
		}
	}

	broadcast (name, message) {
		SocketIO.io.to(this.id).emit(name, message)
	}

}

Game.all = games

Game.getList = function () {
	const result = []
	for (let idx = games.length - 1; idx >= 0; idx -= 1) {
		const game = games[idx]
		result.push({
			id: game.id,
			players: game.formattedPlayers(),
			state: game.state,
			mode: game.mode,
			size: game.size,
			map: game.map,
			update: game.serverUpdate,
		})
	}
	return result
}

module.exports = Game
