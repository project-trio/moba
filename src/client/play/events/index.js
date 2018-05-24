import Bridge from '@/client/play/events/bridge'
import GameEvents from '@/client/play/events/game'
import LobbyEvents from '@/client/play/events/lobby'

export default {

	init () {
		Bridge.init()
		GameEvents.init()
		LobbyEvents.init()
	},

}
