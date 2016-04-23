'use strict';

const Socket = require('socket.io');

const User = require.main.require('./app/entity/user');

Socket.io.on('connection', (socket)=>{
	const pid = socket.client.id;
	socket.pid = pid;

	const query = socket.handshake.query;
	const uid = parseInt(query.id);
	const auth = query.auth;
	if (uid && auth) {
		User.authenticate(socket, uid, auth);
	} else { //TODO
		socket.name = 'test';
		require.main.require('./game/events').register(socket);
		socket.emit('auth');
	}
});
