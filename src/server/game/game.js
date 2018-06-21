const SocketIO = require('socket.io')

const { TESTING, UPDATE_DURATION } = require.main.require('../common/constants')

const Util = require.main.require('./utils/util')

const Player = require.main.require('./game/player')

//CONSTRUCTOR

const games = []

class Game {

	constructor (mode, size, map, autoStart) {
		this.players = []
		this.id = Util.uid()
		this.mode = mode
		this.botMode = mode === 'bots'
		this.size = size
		this.game = null
		this.state = 'OPEN'
		this.serverUpdate = 0
		this.idleCount = 0
		this.started = false
		this.hostId = null
		this.autoStart = autoStart ? 1 : 0
		this.updatesUntilStart = mode === 'tutorial' ? 0 : ((TESTING ? 5 : 20) * 1000 / UPDATE_DURATION)

		if (this.botMode) {
			const firstTeam = 1 //SAMPLE
			for (let teamIndex = 0; teamIndex < size; teamIndex += 1) {
				const player = new Player(null)
				this.team(player, firstTeam)
			}
			if (TESTING || size >= 10) {
				const secondTeam = 1 - firstTeam
				for (let teamIndex = 0; teamIndex < size - 1; teamIndex += 1) {
					const player = new Player(null)
					this.team(player, secondTeam)
				}
			}
		}

		this.setMap(map)

		console.log('Created game', this.id, mode, size, map)
		games.push(this)
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
		return this.players.length
	}

	checkFull () {
		return this.playerCount() >= this.size * 2
	}

//STATE

	setMap (map) {
		this.map = map
		this.retro = map === 'retro'
		for (const player of this.players) {
			player.setRetro(this.retro)
		}
	}

	teamCounts () {
		const results = [ 0, 0 ]
		for (const player of this.players) {
			results[player.team] += 1
		}
		return results
	}

	canStart () {
		const playerCount = this.players.length
		if (playerCount) {
			if (this.botMode) {
				return true
			}
			if (playerCount % 2 === 0) {
				// const minSize = Math.ceil(this.size / 2) //TODO later
				return true
			}
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

	team (player, team) {
		this.players.push(player)
		player.reset(team)
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
			const teamCounts = this.teamCounts()
			this.team(player, teamCounts[0] <= teamCounts[1] ? 0 : 1)
			player.setRetro(this.retro, this.mode === 'tutorial')

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
			if (this === games[idx]) {
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
				this.players.splice(removeIndex, 1)
			}

			if (this.activePlayerCount() <= 0) {
				this.destroy()
				return true
			}
			if (!this.started) {
				this.state = 'OPEN'
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
			updatesUntilStart: this.updatesUntilStart,
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
