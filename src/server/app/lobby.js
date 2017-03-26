const Socket = require('socket.io')

const CommonConsts = require.main.require('../common/constants')

const User = require.main.require('./app/entity/user')
const GameEvents = require.main.require('./game/events')

Socket.io.use(function(socket, next) {
  var query = socket.handshake.query
  if (query.v === CommonConsts.VERSION) {
    const pid = socket.client.id
    socket.pid = pid
    socket.name = query.name || 'test'
    next()
  } else {
    socket.emit('reload', {v: CommonConsts.VERSION})
  }
})

Socket.io.on('connection', (socket) => {
  if (!socket.name) {
    return
  }
  GameEvents.register(socket)
  socket.emit('auth')
})
