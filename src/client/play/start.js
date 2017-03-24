import Lobby from '@/play/game/lobby'
import GameEvents from '@/play/game/events'

import Loop from '@/play/render/loop'

export default {

  init () {
    Lobby.init()
    Lobby.connect('quick')

    Loop.start() //TODO delay

    GameEvents.init()
  },

}
