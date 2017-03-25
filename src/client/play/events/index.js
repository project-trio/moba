import Bridge from '@/play/events/bridge'
import GameEvents from '@/play/events/game'
import LobbyEvents from '@/play/events/lobby'

export default {

	init () {
		Bridge.init()
		GameEvents.init()
		LobbyEvents.init()
	},

}
