const SocketIO = require('socket.io')

const CommonConsts = require.main.require('../common/constants')

const lobby = require.main.require('./app/lobby')

const Config = require.main.require('./game/config')
const Game = require.main.require('./game/game')

const startTime = process.hrtime()

//LOCAL

let loopCount = 0

const loop = function () {
  const games = Game.all
  for (let idx = games.length - 1; idx >= 0; idx -= 1) {
    const game = games[idx]
    if (game.started) {
      let actionFound = false
      const actionData = {}
      const currentUpdate = game.serverUpdate
      const onSelectionScreen = currentUpdate <= Config.updatesUntilStart
      for (let pid in game.players) {
        const player = game.players[pid]
        if (onSelectionScreen) {
          if (player.switchUnit) {
            player.shipName = player.switchUnit
            actionData[pid] = { unit: player.shipName }
            player.switchUnit = null
          }
        } else {
          const playerActions = []
          const submittingSkills = [false, false, false]

          if (player.bot) {
            if (currentUpdate - player.actionUpdate > player.updatesUntilAuto) {
              const clickX = Math.round(Math.random() * 100 * game.mapWidth)
              const clickY = Math.round(Math.random() * 100 * game.mapHeight)
              playerActions[0] = { target: [clickX, clickY] }
              player.updatesUntilAuto = Math.ceil(Math.random() * 50)
            }
          } else {
            const levelupIndex = player.levelNext
            if (levelupIndex !== null) {
              playerActions.push({ skill: levelupIndex, level: true })
              player.levelNext = null
              submittingSkills[levelupIndex] = true
            }

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
                playerActions.push(action)
              }
              player.actions = []
            }
          }
          if (playerActions.length > 0) {
            if (player.bot) {
              player.actionUpdate = currentUpdate
            } else {
              actionFound = true
            }
            actionData[pid] = playerActions
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
    } else if (CommonConsts.TESTING && game.checkFull()) {
      game.start()
      lobby.broadcastWith(false, true)
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
