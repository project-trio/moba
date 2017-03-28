module.exports = class Player {

  constructor (client) {
    this.client = client

    this.id = client.pid
    this.game = null
    this.team = null
    this.teamIndex = null
    this.name = client.name
    this.shipName = 'sunken'

    this.serverUpdate = 0
    this.actions = []
    this.levelNext = null
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
