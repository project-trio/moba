'use strict';

const $ = require('jquery');

const Bridge = require('bridge');

const Local = require('local');
const Game = require('game/entity/game/game');

//LOCAL

const displaySection = function(name) {
	$('.section-lobby').hide();
	$('#lobby-'+name).show();
};

const connectLobby = function(action) {
	Bridge.emit('lobby action', {action: action});
};

const toggleLobby = function(visible) {
	$('#game-lobby').toggle(visible);
	$('#canvas').toggle(!visible);
};

//EVENTS

$('#username-form').on('submit', (event)=>{
	event.preventDefault();
	const username = $('#username-input').val();
	if (username.length > 3) {
		console.log(username);
		localStorage.setItem('username', username);
		Local.username = username;
		displaySection('start');
	}
	return false;
});

$('#lobby-start-quick').on('click', ()=>{
	displaySection('room');
	connectLobby('quick');
	//TODO quick join
	return false;
});

$('#lobby-start-enter').on('click', ()=>{
	displaySection('games');
	connectLobby('lobby');
	//TODO join lobby room
	return false;
});

$('.lobby-start-back').on('click', ()=>{
	Bridge.emit('leave lobby');
	displaySection('start');
	return false;
});

//SOCKET

Bridge.on('join game', (data)=>{
	console.log('Joined', data);
	const newGame = new Game(data.gid, data.size);
	newGame.updatePlayers(data);
	Local.game = newGame;
});

Bridge.on('add player', (data)=>{
	console.log('Add ' + data);
	Local.game.updatePlayers(data);
});

Bridge.on('remove player', (data)=>{
	console.log('Del ' + data);
	Local.game.updatePlayers(data);
});

Bridge.on('start game', (data)=>{
	console.log('Start game');
	console.log(data);
	toggleLobby(false);
	Local.game.updatePlayers(data);
	Local.game.start(data.updates, data.ticks);
});

//PUBLIC

module.exports = {

	displaySection: displaySection,

	toggle: toggleLobby,

	listen: function(io) {
		io.on('join game', (data)=>{
			console.log('Joined', data);
			const newGame = new Game(data.gid, data.size);
			newGame.updatePlayers(data);
			Local.game = newGame;
		});

		io.on('add player', (data)=>{
			console.log('Add ' + data);
			Local.game.updatePlayers(data);
		});

		io.on('remove player', (data)=>{
			console.log('Del ' + data);
			Local.game.updatePlayers(data);
		});

		io.on('start game', (data)=>{
			console.log('Start game');
			console.log(data);
			toggleLobby(false);
			Local.game.updatePlayers(data);
			Local.game.start(data.updates, data.ticks);
		});
	},

};
