const Socket = require('socket.io')

//LOCAL

const queuedPlayers = []

const remove = function (player) {
  player.queueing = false
  const index = queuedPlayers.indexOf(player)
  if (index === -1) {
    console.error('UNKNOWN QUEUE PLAYER', player)
    return
  }
  queuedPlayers.splice(index, 1)
}

//PUBLIC

module.exports = {

  add (player, data) {
    player.join('queue')
    player.updateQueue(data)

    if (!player.queueing) {
      player.queueing = true
      queuedPlayers.push(player)

      this.update()
    }
  },

  update () {
    const queuedCount = queuedPlayers.length
    const maxCountSize = 10
    const queuedSizes = new Array(maxCountSize).fill(0).map((_, idx) => { return (idx + 1) * 2 })
    const readiedCounts = [...queuedSizes]
    for (let idx = queuedCount - 1; idx >= 0; idx -= 1) {
      const queued = queuedPlayers[idx]
      for (let size = maxCountSize; size >= queued.queueMin; size -= 1) {
        queuedSizes[size - 1] -= 1
        if (queued.queueReady) {
          readiedCounts[size - 1] -= 1
        }
      }
    }
    for (let size = readiedCounts.length; size >= 1; size -= 1) {
      if (readiedCounts[size - 1] <= 0) {
        const Game = require.main.require('./game/game')
        const map = size <= 2 ? 'tiny' : size <= 3 ? 'small' : size <= 6 ? 'standard' : 'large'
        const game = new Game('pvp', size, map, true)

        for (let idx = queuedCount - 1; idx >= 0; idx -= 1) {
          const queued = queuedPlayers[idx]
          if (queued.queueReady && queued.queueMin <= size) {
            remove(queued)
            const joinData = game.add(queued)
            if (joinData.error) {
              queued.emit('queue', { error: joinData.error })
            } else {
              queued.emit('queue', { gid: game.id })
            }
            if (game.checkFull()) {
              break
            }
          }
        }

        return this.update()
      }
    }

    Socket.io.to('queue').emit('queue', {
      players: queuedCount,
      available: queuedSizes,
    })
  },

  remove (player) {
    player.leave('queue')
    if (player.queueing) {
      remove(player)
      this.update()
    }
  },

}
