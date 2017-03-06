import Lobby from 'game/lobby'
import Loop from 'render/loop'

export default {

  init () {
    require('play/bridge')

    Lobby.connect('quick')
    Loop.start() //TODO delay

    require('game/events')
  },

}
