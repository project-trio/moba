import router from '@/router'
import store from '@/store'

import Bridge from '@/play/events/bridge'

import Local from '@/play/local'

import Game from '@/play/game/entity/game/game'

export default {

  connect (name, data, callback) {
    if (!data) {
      data = {}
    }
    data.action = name
    Bridge.emit('lobby action', data, callback)
  },

  init () {
    Bridge.on('lobby', (data) => {
      console.log('lobby', data)
      if (data.online) {
        store.state.game.playersOnline = data.online
      }
      if (data.games) {
        store.state.game.list = data.games
      }
    })

    Bridge.on('join game', (data) => {
      console.log('join game', data)
      const routeObject = { name: 'Join', params: { gid: data.gid } }
      if (router.currentRoute.name === 'Create') {
        router.replace(routeObject)
      } else {
        router.push(routeObject)
      }
    })

    Bridge.on('add player', (data) => {
      console.log('Add ' + data)
      Local.game.updatePlayers(data)
    })

    Bridge.on('remove player', (data) => {
      console.log('Del ' + data)
      Local.game.updatePlayers(data)
    })

    Bridge.on('start game', (data) => {
      if (!Local.game) {
        console.log('Backfilling game', data)
        Local.game = new Game(data.gid, data.size)
      } else {
        console.log('Start game', data)
      }
      Local.game.updatePlayers(data)
      router.replace({ name: 'Game' })
    })
  },

}
