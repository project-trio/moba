import Events from '@/play/events'
import LobbyEvents from '@/play/events/lobby'

import Loop from '@/play/render/loop'

export default {

  init () {
    Events.init()
    LobbyEvents.connect('quick')
    Loop.start() //TODO delay
  },

}
