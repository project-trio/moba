const SocketIO = require('socket.io')

const CommonConsts = require.main.require('../common/constants')
const commonMaps = require.main.require('../common/maps')

const Util = require.main.require('./utils/util')

const Config = require('./config')
const Game = require('./game')
const Player = require('./player')

const MAXIMUM_IDLE_UPDATES = CommonConsts.TESTING ? 1000 : 1000

const clientPlayers = {}
let playersOnline = 0

const startTime = process.hrtime()
const updateDuration = Config.updateDuration
const updatesUntilStart = (CommonConsts.TESTING ? 10 : 30) * 1000 / updateDuration

//LOCAL

const lobbyBroadcast = (data) => {
  SocketIO.io.to('lobby').emit('lobby', data)
}
const lobbyBroadcastGames = () => {
  lobbyBroadcast({games: getGameList()})
}

const getPlayerNames = function() {
  return Object.keys(clientPlayers)
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
      map: game.map,
      update: game.serverUpdate,
    })
  }
  return result
}

const createGame = function(player, size, map, joining) {
  const response = {}
  if (player.game) {
    response.error = 'Already in a game'
  } else if (CommonConsts.GAME_SIZES.indexOf(size) === -1) {
    response.error = 'Invalid game size'
  } else if (size > 0 && !CommonConsts.TESTING && player.name !== 'kiko ') {
    response.error = 'You need to register before creating a larger than 1p game'
  } else if (!map) {
    response.error = 'Please choose a map'
  } else {
    const mapData = commonMaps[map]
    if (!mapData) {
      response.error = 'Invalid map'
    } else {
      const game = new Game(size, map)
      if (joining) {
        const joinData = game.add(player)
        if (joinData.error) {
          game.destroy(null)
          response.error = joinData.error
        }
      }
      if (!response.error) {
        lobbyBroadcastGames()
        response.gid = game.id
      }
    }
  }
  return response
}

const join = function(player, gid, callback) {
  const games = Game.all
  for (let idx = games.length - 1; idx >= 0; idx -= 1) {
    const game = games[idx]
    if (game.id === gid) {
      const gameData = game.add(player)
      if (gameData.error) {
        callback({ error: gameData.error })
        return false
      }
      callback(gameData)
      return true
    }
  }
  callback({error: "Game doesn't exist"})
}

const quickJoin = function(player, size, map) {
  if (size > 0) {
    const games = Game.all
    for (let idx = games.length - 1; idx >= 0; idx -= 1) {
      const game = games[idx]
      const gameData = game.add(player)
      if (!gameData.error) {
        return { gid: game.id }
      }
    }
  }
  return createGame(player, size, map, true)
}

const startGame = function (game) {
  game.start(updatesUntilStart)
  lobbyBroadcastGames()
}

//UPDATE

let loopCount = 0

const loop = function() {
  const games = Game.all
  for (let idx = games.length - 1; idx >= 0; idx -= 1) {
    const game = games[idx]
    if (game.started) {
      let actionFound = false
      const actionData = {}
      const onSelectionScreen = game.serverUpdate <= updatesUntilStart
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
          if (playerActions.length > 0) {
            actionData[pid] = playerActions
            actionFound = true
          }
        }
      }
      if (actionFound) {
        game.idleCount = 0
      } else if (game.idleCount > MAXIMUM_IDLE_UPDATES) {
        console.log(game.id, 'Game timed out due to inactivity')
        game.broadcast('closed')
        game.destroy(idx)
        continue
      } else {
        game.idleCount += 1
      }
      game.broadcast('update', { update: game.serverUpdate, actions: actionData })
      game.serverUpdate += 1
    } else if (CommonConsts.TESTING && game.checkFull()) {
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
        console.log('Admin', pid, getGameList())
        callback({ names: getPlayerNames(), games: getGameList() })
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

    client.on('switch unit', (data) => {
      player.switchUnit = data.name //TODO validate real
    })

    client.on('action', (data) => {
      if (!player.game) {
        console.log('Action ERR: No game for player')
        return
      }
      if (player.game.serverUpdate < updatesUntilStart) {
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

    client.on('chat', (data, callback) => {
      const response = {}
      if (!player.game) {
        response.error = 'Not in game'
      } else {
        const updateTime = Util.seconds() // player.game.serverUpdate
        if (updateTime <= player.chatAt + 1) {
          response.error = 'Chatting too fast!'
        } else {
          player.chatAt = updateTime
          data.id = player.id
          data.at = updateTime
          if (data.team) {
            player.game.teamBroadcast(player.team, 'msg', data)
          } else {
            player.game.broadcast('msg', data)
          }
        }
      }
      callback(response)
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
        const gameResponse = quickJoin(player, data.size, data.map)
        callback(gameResponse)
      } else if (data.action === 'create') {
        const gameResponse = createGame(player, data.size, data.map, false)
        callback(gameResponse)
      } else if (data.action === 'join') {
        join(player, data.gid, callback)
      } else {
        client.join('lobby')
      }
    })
  }

}
