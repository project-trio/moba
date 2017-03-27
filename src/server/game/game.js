const SocketIO = require('socket.io')

const Config = require('./config')

const Util = require.main.require('./utils/util')

//CONSTRUCTOR

module.exports = class Game {

  constructor (size) {
    this.players = {}
    this.counts = [0, 0]
    this.id = Util.uid()
    this.size = size
    this.game = null
    this.state = 'OPEN'
    this.serverUpdate = 0
    this.started = false
    console.log('Created game', this.id)
  }

//PRIVATE

  playerCount () {
    return this.counts[0] + this.counts[1]
  }

  checkFull () {
    return this.playerCount() >= this.size * 2
  }

//STATE

  checkStart () {
    const state = this.state
    if (state == 'STARTED' || state == 'PLAYING') {
      return true
    }
    if (state == 'READY') {
      this.start()
    }
    return false
  }

//JOIN

  formattedPlayers () {
    const broadcastPlayers = {}
    for (let pid in this.players) {
      const player = this.players[pid]
      broadcastPlayers[pid] = player.data()
    }
    return broadcastPlayers
  }

  add (player) {
    if (this.state != 'OPEN') {
      return false
    }
    const pid = player.id
    if (!this.players[pid]) {
      const team = this.counts[1] < this.counts[0] ? 1 : 0
      const teamSize = this.counts[team]
      this.counts[team] += 1
      this.players[pid] = player
      player.team = team
      player.teamIndex = teamSize

      this.broadcast('add player', {players: this.formattedPlayers()})
      player.join(this)

      if (this.checkFull()) {
        this.state = 'FULL'
        this.state = 'READY' //TODO temp
      }
    }
    return {gid: this.id, size: this.size, players: this.formattedPlayers()}
  }

  remove (player) {
    if (!this.started) {
      const removePid = player.id
      for (let pid in this.players) {
        if (removePid == pid) {
          const player = this.players[pid]
          this.counts[player.team] -= 1
          delete this.players[pid]

          if (this.playerCount() == 0) {
            this.state = 'OPEN'
            this.broadcast('remove player', pid)
          } else {
            console.log('Game canceled ' + this.id)
            this.state = 'CLOSED'
            delete this
          }
          return true
        }
      }
    }
  }

//METHODS

  start () {
    this.broadcast('start game', {players: this.formattedPlayers(), updates: Config.updateDuration, ticks: Config.tickDuration})
    this.state = 'STARTED'
    this.started = true
    console.log('Started game ' + this.id)
  }

  teamBroadcast (team, name, message) {
    for (let pid in this.players) {
      const player = this.players[pid]
      player.emit(name, message)
    }
  }

  broadcast (name, message) {
    SocketIO.io.to(this.id).emit(name, message)
  }

}
