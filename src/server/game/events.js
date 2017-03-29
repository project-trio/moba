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
  const result = []
  const games = Game.all
  for (let idx = games.length - 1; idx >= 0; idx -= 1) {
    const game = games[idx]
    result.push({
      id: game.id,
      players: game.formattedPlayers(),
      state: game.state,
      size: game.size,
    })
  }
  return result
}

const createGame = function(player, size, joining) {
  const response = {}
  if (player.game) {
    response.error = 'Already in a game'
  } else if (CommonConsts.GAME_SIZES.indexOf(size) === -1) {
    response.error = 'Invalid game size'
  } else if (size > 0 && !CommonConsts.TESTING && player.name !== 'kiko ') {
    response.error = 'You need to register before creating a larger than 1p game'
  } else {
    const game = new Game(size)
    if (joining && !game.add(player)) {
      response.error = 'Unable to join new game'
    } else {
      response.gid = game.id
    }
  }
  return response
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
        return { gid: game.id }
      }
    }
  }
  return createGame(player, size, false)
}

const startGame = function (game) {
  game.start()
  lobbyBroadcast({games: getGameList()})
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
    } else if ((CommonConsts.TESTING || game.size < 1) && game.checkFull()) {
      startGame(game)
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
      player.client.replaced = true
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
      if (clientPlayers[name] && !client.replaced) {
        delete clientPlayers[name]
        playersOnline -= 1
      }
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

    client.on('chat', (data) => {
      if (!player.game) {
        console.log('player does not have game')
        return
      }
      const updateTime = Util.seconds() // player.game.serverUpdate
      if (updateTime <= player.chatAt + 1) {
        console.log('chatting too fast')
        return
      }

      player.chatAt = updateTime
      data.id = player.id
      data.at = updateTime
      if (data.team) {
        player.game.teamBroadcast(player.team, 'msg', data)
      } else {
        player.game.broadcast(player.team, 'msg', data)
      }
    })

    client.on('updated', (data) => {
      player.serverUpdate = data.update
    })

    client.on('start game', (data, callback) => {
      const game = player.game
      const response = {}
      if (game) {
        if (game.hostId === pid) {
          if (game.canStart()) {
            startGame(game)
          } else {
            response.error = 'Waiting for players to join'
          }
        } else {
          response.error = 'You are not the host'
        }
      } else {
        response.error = 'Game not found'
      }
      callback(response)
    })

    client.on('lobby action', (data, callback) => {
      console.log('lobby action', data)

      if (data.action === 'enter') {
        if (player.game && data.leaving !== player.game.id) {
          callback({ gid: player.game.id })
        } else {
          client.join('lobby')
          callback({ online: playersOnline, games: getGameList() })
        }
      } else if (data.action === 'leave') {
        client.leave('lobby')
      } else if (data.action === 'leave game') {
        player.leave()
      } else if (data.action === 'quick') {
        const gameResponse = quickJoin(player, data.size)
        callback(gameResponse)
      } else if (data.action === 'create') {
        const gameResponse = createGame(player, data.size, true)
        callback(gameResponse)
      } else if (data.action === 'join') {
        join(player, data.gid, callback)
      } else {
        client.join('lobby')
      }
    })
  }

}
