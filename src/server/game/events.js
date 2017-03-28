const SocketIO = require('socket.io')

const CommonConsts = require.main.require('../common/constants')

const Util = require.main.require('./utils/util')

const Config = require('./config')
const Game = require('./game')
const Player = require('./player')

const clientPlayers = {}
let playersOnline = 0

//LOCAL

const lobbyBroadcast = (data) => {
  SocketIO.io.to('lobby').emit('lobby', data)
}

const getGameList = function() {
  return Game.all.map(game => {
    return {
      id: game.id,
      players: game.formattedPlayers(),
      state: game.state,
      size: game.size,
    }
  })
}

const createGame = function(player, size, joining) {
  const game = new Game(size)
  if (joining && !game.add(player)) {
    return null
  }
  lobbyBroadcast({games: getGameList()})
  return game
}

const join = function(player, gid, callback) {
  const games = Game.all
  for (let idx = 0; idx < games.length; idx += 1) {
    const game = games[idx]
    if (game.id === gid) {
      const gameData = game.add(player)
      if (gameData) {
        callback(gameData)
        return true
      }
      callback({error: 'Unable to join'})
    }
  }
  callback({error: "Game doesn't exist"})
}

const quickJoin = function(player, size) {
  if (size > 0) {
    const games = Game.all
    for (let idx = 0; idx < games.length; idx += 1) {
      const game = games[idx]
      if (game.add(player)) {
        return game
      }
    }
  }
  return createGame(player, size, false)
}

//UPDATE

const startTime = process.hrtime()
const updateDuration = Config.updateDuration
let loopCount = 0

const loop = function() {
  const games = Game.all
  for (let idx = 0; idx < games.length; idx += 1) {
    const game = games[idx]
    if (game.started) {
      game.serverUpdate += 1

      const actionData = {}
      for (let pid in game.players) {
        const player = game.players[pid]
        const playerActions = []
        const submittingSkills = [false, false, false]

        const levelupIndex = player.levelNext
        if (levelupIndex !== null) {
          playerActions.push({ skill: levelupIndex, level: true })
          player.levelNext = null
          submittingSkills[levelupIndex] = true
        }

        let hasTarget = false
        for (let ai = player.actions.length - 1; ai >= 0; ai -= 1) {
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
        actionData[pid] = playerActions
        player.actions = []
      }
      game.broadcast('update', { update: game.serverUpdate, actions: actionData })
    } else if (game.readyToStart()) {
      game.start()
      lobbyBroadcast({games: getGameList()})
    }
  }

  const diff = process.hrtime(startTime)
  const msSinceStart = diff[0] * 1000 + diff[1] / 1000000
  loopCount += 1
  setTimeout(loop, updateDuration * loopCount - msSinceStart)
}

loop()

//PUBLIC

module.exports = {

  register (client) {
    const pid = client.pid
    const name = client.name
    let player = clientPlayers[name]
    if (player) {
      player.client.disconnect()
      player.client = client
    } else {
      player = new Player(client)
      clientPlayers[name] = player
      playersOnline += 1
      lobbyBroadcast({ online: playersOnline })
    }

    client.on('admin', (data, callback) => {
      if (CommonConsts.TESTING || name === 'kiko ') {
        console.log('Admin', pid)
        callback({games: games, players: clientPlayers})
      }
    })

    client.on('disconnect', () => {
      console.log('Disconnected', pid)
      let games = undefined
      if (player.leave()) {
        games = getGameList()
      }
      delete clientPlayers[name]
      playersOnline -= 1
      lobbyBroadcast({ online: playersOnline, games: games })
    })

    client.on('action', (data) => {
      if (player.actions.length > 10) {
        console.log('Action ERR: Too many actions')
        return
      }
      const skillIndex = data.skill
      if (skillIndex !== undefined) {
        if (data.level) {
          player.levelNext = skillIndex
          return
        }
      }
      player.actions.push(data)
    })

    client.on('team msg', (data) => {
      data.id = player.id
      player.game.teamBroadcast(player.team, 'msg', data)
    })

    client.on('updated', (data) => {
      player.serverUpdate = data.update
    })

    client.on('lobby action', (data, callback) => {
      console.log('lobby action', data)

      if (data.action === 'enter') {
        client.join('lobby')
        callback({ online: playersOnline, games: getGameList() })
      } else if (data.action === 'leave') {
        client.leave('lobby')
      } else if (data.action === 'quick') {
        const game = quickJoin(player, data.size)
        callback({ gid: game ? game.id : null })
      } else if (data.action === 'create') {
        const result = {}
        const gameSize = data.size
        if (gameSize > 0 && !CommonConsts.TESTING && player.name !== 'kiko ') {
          result.error = 'You need to register before creating a larger than 1p game'
        } else {
          const game = createGame(player, gameSize, true)
          if (game) {
            result.gid = game.id
          } else {
            result.error = 'You may already be in a game'
          }
        }
        callback(result)
      } else if (data.action === 'join') {
        join(player, data.gid, callback)
      } else {
        client.join('lobby')
      }
    })
  }

}
