import router from '@/router'
import store from '@/store'

import Bridge from '@/play/events/bridge'

import Local from '@/play/local'

//SOCKET

export default {

  init () {
    Bridge.on('closed', () => {
      window.alert('Game closed due to inactivity')
      Local.game.close()
      router.replace({ name: 'Lobby' })
    })

    Bridge.on('update', (data) => {
      const update = data.update
      if (Local.game.serverUpdate !== update - 1) {
        console.error('Invalid update', Local.game.serverUpdate, update)
      }
      Local.game.enqueueUpdate(update, data.actions)
      Bridge.emit('updated', { update: update })
    })

    Bridge.on('msg', (data) => {
      const player = Local.game.player(data.id)
      data.from = player.name
      data.team = player.team
      store.state.chatMessages.push(data)
    })
  },

}
