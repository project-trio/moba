import store from '@/client/store'

import Local from '@/client/play/local'
import Ship from '@/client/play/game/entity/unit/ship'

const spawnLocation = function (team, teamIndex) {
	let sx, sy
	const teamMp = team === 0 ? 1 : -1
	const mapWidthHalf = Local.game.map.centerX()
	const mapHeightHalf = Local.game.map.centerY()
	if (Local.game.retro) {
		const offset = 72
		const index = (teamIndex % 6) + 1
		const indexMp = teamIndex > 5 ? -1 : 1
		sx = mapWidthHalf + (8 + offset * index) * teamMp * indexMp
	} else {
		const indexMp = teamIndex % 2 === 0 ? -1 : 1
		const offset = 76
		sx = mapWidthHalf + offset * (Math.floor(teamIndex / 2) + 1) * indexMp * teamMp
	}
	const yInset = 60
	sy = (mapHeightHalf - yInset) * teamMp + mapHeightHalf
	return [sx, sy]
}

//CONSTRUCTOR

export default class Player {

	constructor (data) {
		this.storePlayer = data
		this.id = data.id
		this.unit = null
		this.name = data.name
		this.team = parseInt(data.team, 10)
		this.isLocal = data.id === store.state.playerId
		this.chatAt = 0
		this.isActive = true
	}

	createShip (teamIndex) {
		const position = spawnLocation(this.team, teamIndex)
		const storeData = store.playerForId(this.id)
		if (!storeData) {
			return console.error('No store data for player', this, store.state.game.players)
		}
		if (!storeData.shipName) {
			return console.error('No ship name for player', storeData, this)
		}
		this.unit = new Ship(storeData.shipName, this, this.team, position[0], position[1], null, this.isLocal, store.state.game.retro)
	}

	destroy () {
		if (this.unit) {
			this.unit.destroy()
			this.unit = null
			delete this.unit
		}
	}

}
