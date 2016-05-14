'use strict';

const CommonConsts = require('../common/constants');

//EXPRESS

const express = require('express');
const path = require('path');

const app = express();
const http = require('http').createServer(app);

//SOCKET.IO

const SocketIO = require('socket.io');
const io = SocketIO(http);
SocketIO.io = io;

//APP

app.use(express.static('public'));

app.get('*', (request, response, next)=>{
	response.sendFile(path.resolve(__dirname, '/public/index.html'));
});

//SETUP

require.main.require('./app/lobby');

//LISTEN

const port = process.env.PORT || CommonConsts.PORT;

http.listen(port);

console.log(`moba v${CommonConsts.VERSION} running on port ${port}`, '\n');
