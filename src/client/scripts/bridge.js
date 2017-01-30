'use strict';

const SocketIO = require('socket.io-client');

const CommonConsts = require('common/constants');

const Local = require('local');

//LOCAL

console.log('CONNECTING', Local.TESTING);
const socketUrl = Local.TESTING ? `http://localhost:${CommonConsts.PORT}` : window.location.origin;
const uid = localStorage.getItem('uid');
const uauth = localStorage.getItem('auth');
let params;
if (uid && uauth) {
	params = {query: 'id=' + uid + '&auth=' + uauth};
}
const socket = SocketIO(socketUrl, params);

socket.on('connect', ()=>{
	Local.playerId = socket.id;
	console.log('Connected', Local.playerId);

	socket.on('auth', (data)=>{
		console.log('authed', data);
		//TODO
	});
});

//PUBLIC

module.exports = {

	on: function(name, callback) {
		socket.on(name, callback);
	},

	emit: function(name, message, callback) {
		if (!socket) {
			return;
		}
		socket.emit(name, message, callback);
	},

};
