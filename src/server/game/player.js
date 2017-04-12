const CommonConsts = require.main.require('../common/constants')
const CommonUtils = require.main.require('../common/utils')

const Util = require.main.require('./utils/util')

module.exports = class Player {

  constructor (client) {
    this.bot = !client
    if (client) {
      this.client = client
      this.id = client.pid
      this.name = client.name
    } else {
      const botId = `bot-${Util.code()}`
      this.id = botId
      this.name = botId
    }

    this.game = null
    this.team = null
    this.teamIndex = null
    this.isActive = false

    this.shipName = null
    this.switchUnit = null
    this.actionUpdate = null
    this.serverUpdate = null
    this.updatesUntilAuto = 0
    this.actions = null
    this.levelNext = null
    this.chatAt = null
  }

  data () {
    return {
      name: this.name,
      shipName: this.shipName,
      team: this.team,
      teamIndex: this.teamIndex,
    }
  }

  emit (name, message) {
    if (this.client) {
      this.client.emit(name, message)
    }
  }

  resetGame (team, teamIndex) {
    this.team = team
    this.teamIndex = teamIndex

    this.isActive = true
    this.shipName = this.client ? 'boxy' : CommonUtils.randomItem(CommonConsts.SHIP_NAMES)
    this.switchUnit = null
    this.actionUpdate = 0
    this.serverUpdate = 0
    this.actions = []
    this.levelNext = null
    this.chatAt = null
  }

  join (game) {
    this.game = game

    this.client.join(game.id)
  }

  leaveRoom () {
    if (this.game && this.client) {
      this.client.leave(this.game.id)
    }
  }

  leave () {
    if (this.game) {
      this.leaveRoom()
      const game = this.game
      this.game = null //TODO temp
      return game.remove(this)
    }
  }

}
