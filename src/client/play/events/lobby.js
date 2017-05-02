import router from '@/router'
import store from '@/store'

import Bridge from '@/play/events/bridge'

import Local from '@/play/local'

import Game from '@/play/game/entity/game/game'

const joinGame = function (gid) {
  const routeObject = { name: 'Join', params: { gid: gid } }
  if (router.currentRoute.name === 'Create' || router.currentRoute.name === 'Queue') {
    router.replace(routeObject)
  } else {
    p('join from', router.currentRoute.name)
    router.push(routeObject)
  }
}

export default {

  connect (name, data, callback) {
    if (!data) {
      data = {}
    }
    data.action = name

    Bridge.emit('lobby action', data, (response) => {
      const existingGid = response.reenter
      if (existingGid) {
        p('redirecting to game', existingGid)
        router.replace({ name: 'Join', params: { gid: existingGid } })
      } else if (callback) {
        callback(response)
      }
    })
  },

  init () {
    Bridge.on('lobby', (data) => {
      // p('lobby', data)
      if (data.online) {
        store.state.lobby.onlineCount = data.online
      }
      if (data.games) {
        store.state.lobby.games = data.games
      }
    })

    Bridge.on('queue', (data) => {
      // p('queue', data)
      const gid = data.gid
      if (gid) {
        joinGame(gid)
      } else {
        store.state.lobby.queue = data
      }
    })

    Bridge.on('join game', (data) => {
      // p('join game', data)
      joinGame(data.gid)
    })

    Bridge.on('players', (data) => {
      if (Local.game) {
        // p('players', data)
        Local.game.updatePlayers(data)
      } else {
        warn('No game for players', data)
      }
    })

    Bridge.on('update player', (data) => {
      if (Local.game) {
        // p('update player', data)
        Local.game.updatePlayer(data)
      } else if (!Local.TESTING) {
        warn('No game for player update', data)
      }
    })

    Bridge.on('start game', (data) => {
      if (!Local.game) {
        // if (Local.TESTING) { //TODO remove backfilling
        //   window.alert('Game not found')
        // }
        warn('Game not found', data)
        Local.game = new Game(data.gid, data.mode, data.size, data.map)
      } else {
        // p('Start game', data)
      }
      Local.game.updatePlayers(data)
      if (Local.game.player(store.state.playerId)) {
        router.replace({ name: 'Game' })
      } else {
        window.alert('Local player not found. You may be connected on another page. Please refresh and try again.')
        p(store.state.playerId, Local.game)
        router.replace({ name: 'Lobby' })
      }
    })
  },

}
