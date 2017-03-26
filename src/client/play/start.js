import LobbyEvents from '@/play/events/lobby'

import Loop from '@/play/render/loop'

export default {

  init () {
    LobbyEvents.connect('quick')
    Loop.start() //TODO delay
  },

}
