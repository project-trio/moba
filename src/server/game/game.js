const SocketIO = require('socket.io')

const Config = require('./config')

const Util = require.main.require('./utils/util')

//CONSTRUCTOR

const games = []

class Game {

  constructor (size) {
    this.players = {}
    this.isActive = false
    this.counts = [0, 0]
    this.id = Util.uid()
    this.size = size
    this.game = null
    this.state = 'OPEN'
    this.serverUpdate = 0
    this.started = false
    this.hostId = null

    console.log('Created game', this.id)
    games.push(this)
  }

//PRIVATE

  activePlayerCount () {
    let result = 0
    for (let pid in this.players) {
      const player = this.players[pid]
      if (player.isActive) {
        result += 1
      }
    }
    return result
  }

  playerCount () {
    return this.counts[0] + this.counts[1]
  }

  checkFull () {
    return this.playerCount() >= this.size * 2
  }

//STATE

  canStart () {
    if (this.counts[0] === this.counts[1]) {
      // const minSize = Math.ceil(this.size / 2) //TODO later
      return true
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
    const pid = player.id
    if (!this.players[pid]) {
      if (this.state !== 'OPEN') {
        return false
      }
      if (!this.hostId) {
        this.hostId = pid
      }
      const team = this.counts[1] < this.counts[0] ? 1 : 0
      const teamSize = this.counts[team]
      this.counts[team] += 1
      this.players[pid] = player
      player.isActive = true
      player.team = team
      player.teamIndex = teamSize


      if (this.checkFull()) {
        this.state = 'FULL'
        this.state = 'READY' //TODO temp
      }
      this.broadcast('add player', { ready: this.canStart(), players: this.formattedPlayers() })
      player.join(this)

    }
    return { gid: this.id, host: this.hostId, size: this.size, ready: this.canStart(), players: this.formattedPlayers() }
  }

  remove (player) {
    const pid = player.id
    if (this.players[pid]) {
      if (this.started) {
        player.isActive = false
      } else {
        this.counts[player.team] -= 1
        delete this.players[pid]
      }

      const removeId = this.id
      console.log('Removed', removeId, this.activePlayerCount())
      if (this.activePlayerCount() > 0) {
        if (!this.started) {
          this.state = 'OPEN'
        }
        this.broadcast('player left', { ready: this.canStart(), players: this.formattedPlayers() })
      } else {
        this.state = 'CLOSED'
        this.started = false
        for (let pid in this.players) {
          const player = this.players[pid]
          player.game = null
        }
        for (let idx = 0; idx < games.length; idx += 1) {
          if (games[idx].id === removeId) {
            games.splice(idx, 1)
            break
          }
        }
      }
      return true
    }
  }

//METHODS

  start (updatesUntilStart) {
    this.broadcast('start game', {
      players: this.formattedPlayers(),
      updates: Config.updateDuration,
      ticks: Config.tickDuration,
      updatesUntilStart: updatesUntilStart,
    })
    this.state = 'STARTED'
    this.started = true
    console.log('Started game', this.id)
  }

  teamBroadcast (team, name, message) {
    for (let pid in this.players) {
      const player = this.players[pid]
      if (player.team === team) {
        player.emit(name, message)
      }
    }
  }

  broadcast (name, message) {
    SocketIO.io.to(this.id).emit(name, message)
  }

}

Game.all = games

module.exports = Game
