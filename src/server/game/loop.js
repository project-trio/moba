const lobby = require.main.require('./app/lobby')

const Config = require.main.require('./game/config')
const Game = require.main.require('./game/game')

const startTime = process.hrtime()

//LOCAL

let loopCount = 0

const loop = function () {
	for (const game of Game.all) {
		if (game.started) {
			let actionFound = false
			const actionData = []
			const currentUpdate = game.serverUpdate
			const onSelectionScreen = currentUpdate <= game.updatesUntilStart
			const gamePlayers = game.players
			for (let pidx = 0; pidx < gamePlayers.length; pidx += 1) {
				const player = gamePlayers[pidx]
				if (onSelectionScreen) {
					if (player.switchUnit) {
						player.shipName = player.switchUnit
						actionData[pidx] = { unit: player.shipName }
						player.switchUnit = null
					}
				} else {
					const playerActions = []
					const submittingSkills = [false, false, false]

					if (player.bot) {
						if (currentUpdate - player.actionUpdate > player.updatesUntilAuto) {
							const clickX = Math.round(Math.random() * 100 * game.mapWidth)
							const clickY = Math.round(Math.random() * 100 * game.mapHeight)
							playerActions[0] = [ null, null, [clickX, clickY] ]
							player.updatesUntilAuto = Math.ceil(Math.random() * 50)
						}
					} else {
						const pendingActionCount = player.actions.length
						if (pendingActionCount) {
							let hasTarget = false
							for (let ai = pendingActionCount - 1; ai >= 0; ai -= 1) {
								const action = player.actions[ai]
								const target = action.target
								if (target) {
									if (hasTarget) {
										continue
									}
									hasTarget = true
								}
								const skillIndex = action.skill
								if (skillIndex !== undefined) {
									if (submittingSkills[skillIndex]) {
										continue
									}
									submittingSkills[skillIndex] = true
								}
								playerActions.push([ skillIndex, null, target ])
							}
							player.actions = []
						}

						const levelupIndex = player.levelNext
						if (levelupIndex !== null) {
							playerActions.push([ levelupIndex, true ])
							player.levelNext = null
						}
					}
					if (playerActions.length > 0) {
						if (player.bot) {
							player.actionUpdate = currentUpdate
						} else {
							actionFound = true
						}
						actionData[pidx] = playerActions
					}
				}
			}
			if (actionFound) {
				game.idleCount = 0
			} else if (game.idleCount > Config.maxIdleUpdates) {
				console.log(game.id, 'Game timed out due to inactivity')
				game.broadcast('closed')
				game.destroy()
				continue
			} else {
				game.idleCount += 1
			}
			game.broadcast('update', { update: currentUpdate, actions: actionData })
			game.serverUpdate = currentUpdate + 1
		} else if (game.autoStart && game.checkFull()) {
			if (game.autoStart > 1) {
				game.start()
				lobby.broadcastWith(false, true)
			} else {
				game.autoStart += 1
			}
		}
	}

	const diff = process.hrtime(startTime)
	const msSinceStart = diff[0] * 1000 + diff[1] / 1000000
	loopCount += 1
	setTimeout(loop, Config.updateDuration * loopCount - msSinceStart)
}

//PUBLIC

module.exports = {

	init () {
		loop()
	},

}
