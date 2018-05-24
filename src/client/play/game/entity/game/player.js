import store from '@/client/store'

import Local from '@/client/play/local'
import Ship from '@/client/play/game/entity/unit/ship'

const PLAYER_INSET = 64

//CONSTRUCTOR

export default class Player {

  constructor (pid, data) {
    this.id = pid
    this.unit = null
    this.name = data.name
    this.team = parseInt(data.team, 10)
    this.teamIndex = parseInt(data.teamIndex, 10)
    this.isLocal = pid === store.state.playerId
    this.chatAt = 0
    this.isActive = true
  }

//MANAGE

  spawnLocation () {
    const teamMp = this.team == 0 ? 1 : -1
    const indexMp = this.teamIndex % 2 == 0 ? -1 : 1

    const mapWidthHalf = Local.game.map.centerX()
    const mapHeightHalf = Local.game.map.centerY()
    const offset = 76
    const sx = mapWidthHalf + offset * (Math.floor(this.teamIndex / 2) + 1) * indexMp * teamMp
    const sy = (mapHeightHalf - PLAYER_INSET) * teamMp + mapHeightHalf
    return [sx, sy]
  }

  createShip () {
    const position = this.spawnLocation()
    const storeData = store.state.game.players[this.id]
    if (!storeData) {
      return console.error('No store data for player', this, store.state.game.players)
    }
    this.unit = new Ship(storeData.shipName, this, this.team, position[0], position[1], null, this.isLocal)
  }

  destroy () {
    if (this.unit) {
      this.unit.destroy()
      this.unit = null
      delete this.unit
    }
  }

}
