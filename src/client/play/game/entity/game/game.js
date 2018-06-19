import store from '@/client/store'

import Local from '@/client/play/local'
import Render from '@/client/play/render/render'

import AreaOfEffect from '@/client/play/game/entity/attack/aoe'
import Bullet from '@/client/play/game/entity/attack/bullet'

import Tutorial from '@/client/play/game/tutorial'

import GameMap from '@/client/play/game/entity/game/map'
import Player from '@/client/play/game/entity/game/player'
import Unit from '@/client/play/game/entity/unit/unit'

export default function (gid, mode, size) {
	let players = []

	let updateCount = 0
	let updateQueue = {}

	let updateDuration
	let tickDuration
	let ticksPerUpdate
	let renderedSinceUpdate = false
	let ticksRendered = 0
	let updatesUntilStart = 0
	let lastTickTime
	let tickOffsets = -4

	this.id = gid
	this.size = size
	this.started = false
	this.playing = false
	this.finished = false
	this.serverUpdate = -1
	this.bots = mode === 'bots'
	this.tutorial = mode === 'tutorial'

	// Update

	this.calculateTicksToRender = function (currentTime) {
		const tickOffsetTime = tickOffsets * ticksPerUpdate * tickDuration / 2
		return Math.floor((currentTime - lastTickTime - tickOffsetTime) / tickDuration)
	}

	this.performTicks = function (ticksToRender) {
		let renderTime
		let ticksRenderedForFrame = 0
		const maxTicksToRender = ticksToRender > 9 ? Math.min(1000, Math.pow(ticksToRender, 0.75)) : 1
		while (ticksToRender > 0) {
			renderTime = ticksRendered * tickDuration
			store.state.game.renderTime = renderTime

			if (ticksRendered % ticksPerUpdate === 0) {
				if (dequeueUpdate(renderTime)) {
					store.state.game.missingUpdate = false
				} else {
					tickOffsets += 1
					if (ticksToRender > ticksPerUpdate) {
						store.state.game.missingUpdate = true
					}
					// p('Missing update', ticksToRender, tickOffsets)
					break
				}
			}
			if (renderTime > 0) {
				AreaOfEffect.update(renderTime, Unit.all())
				Bullet.update(renderTime, tickDuration, false)
				Unit.update(renderTime, tickDuration, false, this.retro)
				this.map.update(renderTime, this.retro)
			} else if (renderTime === 0) {
				this.startPlaying()
			}

			ticksRendered += 1
			ticksToRender -= 1
			lastTickTime += tickDuration

			if (ticksRenderedForFrame >= maxTicksToRender) {
				break
			}
			ticksRenderedForFrame += 1
		}
		if (ticksToRender === 0) {
			renderedSinceUpdate = true
		}
		return true
	}

	const dequeueUpdate = function (_renderTime) {
		const nextUpdate = updateQueue[updateCount]
		if (!nextUpdate) {
			return false
		}
		const onSelectionScreen = updateCount <= updatesUntilStart
		updateQueue[updateCount] = null
		updateCount += 1

		for (let idx = nextUpdate.length - 1; idx >= 0; idx -= 1) { // 'action' response
			const playerActions = nextUpdate[idx]
			if (!playerActions) {
				continue
			}
			const player = players[idx]
			if (!player) {
				console.error('Update invalid for player', idx, playerActions)
				continue
			}
			if (onSelectionScreen) {
				const playerUnitName = playerActions.unit
				if (playerUnitName) {
					const storePlayer = store.state.game.players[idx]
					storePlayer.shipName = playerUnitName
				}
			} else {
				const ship = player.unit
				if (!ship) {
					console.error('Update invalid for ship', idx, player, nextUpdate, Unit.all())
					if (Local.TESTING) {
						window.alert('No ship')
					}
					continue
				}
				for (let idx = ship.queuedForActivation.length - 1; idx >= 0; idx -= 1) {
					ship.queuedForActivation[idx] = false
				}
				for (let ai = playerActions.length - 1; ai >= 0; ai -= 1) {
					const action = playerActions[ai]
					const skillIndex = action[0]
					const skillLevelup = action[1]
					if (skillLevelup) {
						ship.levelupSkill(skillIndex)
					} else {
						const target = action[2]
						if (target || skillIndex !== null) {
							ship.enqueue(skillIndex, target)
						}
					}
				}
			}
		}
		return true
	}

	// Play

	this.enqueueUpdate = function (update, actions) {
		if (update >= 9 && this.updatePanel) {
			if (update > 9) {
				this.updatePanel.end()
			}
			this.updatePanel.begin()
		}
		this.serverUpdate = update
		updateQueue[update] = actions
		if (renderedSinceUpdate) {
			const behindUpdates = update - updateCount
			if (behindUpdates > 0) {
				tickOffsets -= behindUpdates
				renderedSinceUpdate = false
				p('Catching up to server update', [behindUpdates, tickOffsets])
			}
		}
	}

	this.centerOnUnit = function () {
		const position = Local.unit.container.position
		this.map.track(position.x, position.y, false)
	}

	this.startPlaying = function () {
		if (this.playing) {
			console.error('game already playing')
			return
		}
		const teamsIndex = [ 0, 0 ]
		for (const player of players) {
			const teamIndex = teamsIndex[player.team]
			teamsIndex[player.team] += 1
			player.createShip(teamIndex)
		}
		Local.unit = Local.player.unit
		store.setSelectedUnit(Local.unit)

		this.playing = true
		store.state.game.playing = true

		this.centerOnUnit()

		if (mode === 'tutorial') {
			Tutorial.start()
		}
	}

	// Setup

	this.destroy = function () {
		Local.destroy()
		Unit.destroy()
		Bullet.destroy()
		AreaOfEffect.destroy()
		Render.destroy()
		if (this.map) {
			this.map.destroy()
		}
		store.resetGameState()
	}

	this.start = function () {
		if (this.started) {
			console.error('game already started')
			return
		}
		store.state.game.active = true

		Render.create()
		Unit.init()
		Bullet.init()
		AreaOfEffect.init()

		this.started = true

		Local.player = this.playerForId(store.state.playerId)

		const gameContainer = Render.group()
		this.container = gameContainer
		this.map = new GameMap(this.mapName, gameContainer)
		Render.add(gameContainer)

		ticksPerUpdate = updateDuration / tickDuration
		ticksRendered = -updatesUntilStart * ticksPerUpdate
		// p('STARTED', updateDuration, tickDuration, ticksPerUpdate, ticksRendered)

		// status = 'STARTED'
		lastTickTime = performance.now()

		this.map.build(players.length)
	}

	this.end = function (winningTeam) {
		this.finished = true
		this.playing = false
		store.state.game.active = false
		store.state.game.playing = false
		store.state.game.winningTeam = winningTeam
	}

	this.killTower = function (byTeam, isRetro) {
		if (!isRetro) {
			for (const player of players) {
				if (player.team === byTeam) {
					player.unit.awardExperience(1000)
				}
			}
		}
	}

	// Players

	this.playerForId = function (id) {
		for (const player of players) {
			if (player.id === id) {
				return player
			}
		}
		return null
	}

	this.updatePlayer = function (gameData) {
		const pid = gameData.pid
		const player = players[pid]
		const storePlayer = store.state.game.players[pid]
		if (!player || !storePlayer) {
			console.error('Updated player DNE', player, storePlayer, gameData, players)
			return
		}
		// p(gameData, store.state.game.players)
		player.isActive = gameData.joined
		storePlayer.isActive = gameData.joined
		store.state.chatMessages.push({ name: player.name, team: player.team, active: player.isActive })
	}

	this.updatePlayers = function (gameData) {
		if (this.started) {
			console.error('Cannot replace players for already started game')
			return
		}
		players = []
		store.state.game.players = gameData.players
		for (const playerInfo of gameData.players) {
			players.push(new Player(playerInfo))
			playerInfo.isActive = true
		}

		if (gameData.updates !== undefined) {
			updateDuration = gameData.updates
			tickDuration = gameData.ticks
			Local.tickDuration = tickDuration
			updatesUntilStart = gameData.updatesUntilStart
		}
		if (gameData.host) {
			store.state.game.host = gameData.host
		}
		store.state.game.ready = gameData.ready
	}

	this.setMap = function (mapName) {
		this.mapName = mapName
		this.retro = mapName === 'retro'
		store.state.game.retro = this.retro
		if (this.retro) {
			store.state.local.skills.levels = [1, 1, 1]
			store.state.local.skills.leveled = 1
		}
	}

}
