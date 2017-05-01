const CommonConsts = require.main.require('../common/constants')

//EXPRESS

const express = require('express')
const path = require('path')

const app = express()
const http = require('http').createServer(app)

//SOCKET.IO

const SocketIO = require('socket.io')
const io = SocketIO(http)
SocketIO.io = io

//SETUP

const connection = require.main.require('./app/connection')
const loop = require.main.require('./game/loop')

connection.init()
loop.init()

//APP

app.use(express.static('dist'))

app.get('admin', (request, response, next) => {
  response.sendFile(path.resolve(__dirname, '../../dist/admin.html'))
})

app.get('*', (request, response, next) => {
  response.sendFile(path.resolve(__dirname, '../../dist/index.html'))
})

//LISTEN

const port = process.env.PORT || CommonConsts.PORT

http.listen(port)

console.log(`moba v${CommonConsts.VERSION} running on port ${port}`, '\n')
