module.exports = class Player {

  constructor (client) {
    this.client = client
    this.id = client.pid
    this.name = client.name

    this.game = null
    this.team = null
    this.teamIndex = null
    this.isActive = false

    this.shipName = null
    this.switchUnit = null
    this.serverUpdate = null
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
    this.client.emit(name, message)
  }

  resetGame (team, teamIndex) {
    this.team = team
    this.teamIndex = teamIndex

    this.isActive = true
    this.shipName = 'boxy'
    this.switchUnit = null
    this.serverUpdate = 0
    this.actions = []
    this.levelNext = null
    this.chatAt = null
  },

  join (game) {
    this.game = game

    this.client.join(game.id)
  }

  leave () {
    if (this.game) {
      this.game.remove(this)
      this.game = null
    }
  }

}
