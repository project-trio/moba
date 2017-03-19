import TrigCache from '@/play/external/trigcache'

import Local from '@/play/local'
import Render from '@/play/render/render'
import store from '@/store'

import GameMap from '@/play/game/entity/game/map'
import Player from '@/play/game/entity/game/player'
import Wave from '@/play/game/entity/game/wave'

import Bullet from '@/play/game/entity/unit/bullet'
import Unit from '@/play/game/entity/unit/unit'

//CONSTRUCTOR

const Game = function (gid, size) {

	const gameContainer = Render.group()
	this.container = gameContainer

	// let status
	let players = {}
	let teamSize = size
	let startTime

	let updateCount = 0
	let updateQueue = {}

	let updateDuration
	let tickDuration
	let ticksPerUpdate

	this.serverUpdate = -1
	this.running = false

	this.map = new GameMap(gameContainer)

	Render.add(gameContainer)

	// Update

	let ticksRendered = 0
	let lastTickTime
	let tickOffsetTime = 0

	this.logTicksRendered = function () {
		console.log(ticksRendered)
	}

	this.calculateTicksToRender = function (currentTime) {
		return Math.floor((currentTime - lastTickTime - tickOffsetTime) / tickDuration)
	}

	this.performTicks = function (ticksToRender, currentTime) {
		while (ticksToRender > 0) {
			const renderTime = ticksRendered * tickDuration
			if (ticksRendered % ticksPerUpdate == 0) {
				if (!dequeueUpdate(renderTime)) {
					tickOffsetTime += ticksToRender * tickDuration
					if (this.serverUpdate > 20) {
						console.log('Missing update', [ticksToRender, tickOffsetTime])
					}
					break
				}
			}
			Unit.update(renderTime, tickDuration, false)
			Bullet.update(renderTime, tickDuration, false)

			// if (renderTime % 45000 == 15000) {
			if (renderTime % 30000 == 3000) {
				Wave.spawn(this.map.minionData())
			}

			ticksRendered += 1
			ticksToRender -= 1
			lastTickTime += tickDuration
		}
		return true
	}

	const dequeueUpdate = function (renderTime) {
		const nextUpdate = updateQueue[updateCount]
		if (!nextUpdate) {
			return false
		}

		updateQueue[updateCount] = null
		updateCount += 1

		for (let pid in nextUpdate) {
			const player = players[pid]
			if (player) {
				const playerActions = nextUpdate[pid]
				const ship = player.unit
				for (let ai = playerActions.length - 1; ai >= 0; ai -= 1) {
					const action = playerActions[ai]
					const target = action.target
					const skillIndex = action.skill
					if (skillIndex !== undefined) {
						ship.performSkill(renderTime, skillIndex, target)
					} else if (target) {
						ship.setDestination(target[0], target[1], false)
					}
				}
			} else {
				console.log('Update invalid for player', pid)
			}
		}
		return true
	}

	// Play

	this.enqueueUpdate = function (update, actions) {
		this.serverUpdate = update
		updateQueue[update] = actions
		const behindUpdates = update - updateCount
		if (behindUpdates > 0) {
			tickOffsetTime -= behindUpdates * ticksPerUpdate * tickDuration
			if (updateCount > 20) {
				console.log('Catching up to server update', [behindUpdates, tickOffsetTime])
			}
		}
	}

	this.start = function (_updateDuration, _tickDuration) {
		Local.player = players[Local.playerId]

		TrigCache.prepare()

		updateDuration = _updateDuration
		tickDuration = _tickDuration
		ticksPerUpdate = updateDuration / tickDuration
		console.log('STARTED ' + updateDuration + ' ' + tickDuration + ' ' + ticksPerUpdate)
		console.log(Local.playerId, players)

		const mapType = teamSize <= 1 ? 'tiny' : (teamSize <= 3 ? 'small' : ('standard'))
		this.map.build(mapType)

		for (let pid in players) {
			const player = players[pid]
			if (player) {
				player.createShip()
			}
		}
		this.localUnit = Local.player.unit
		store.setShipName(this.localUnit.name)
		store.setSelectedUnit(this.localUnit)

		// status = 'STARTED'
		startTime = performance.now()
		lastTickTime = startTime
		this.enqueueUpdate(0, {})

		this.running = true
	}

	this.end = function (losingTeam) {
		this.running = false

		// const overText = Render.text('GAME OVER', centerX, centerY, {font: '64px Arial', fill: 0xff1010}, gameContainer)
		// const winnerText = Render.text('Team ' + (2-losingTeam) + ' won!', centerX, centerY + 88, {font: '44px Arial', fill: 0xff1010}, gameContainer)
	}

	// Players

	this.updatePlayers = function (playerData) {
		// teamSize = ? //TODO
		const serverPlayers = playerData.players
		players = {}
		for (let pid in serverPlayers) {
			const playerInfo = serverPlayers[pid]
			const team = parseInt(playerInfo.team, 10)
			const index = parseInt(playerInfo.index, 10)
			players[pid] = new Player(pid, team, index, playerInfo.name)
		}
	}

}

export default Game
