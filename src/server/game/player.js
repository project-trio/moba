module.exports = class Player {

  constructor (client) {
    this.client = client
    this.id = client.pid
    this.game = null
    this.team = null
    this.teamIndex = null
    this.serverUpdate = 0
    this.name = client.name
    this.shipName = 'glitch'
    this.actions = []
    this.message = null

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

}
