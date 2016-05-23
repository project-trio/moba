'use strict';

const SocketIO = require('socket.io');

const Config = require('./config');

const Util = require.main.require('./utils/util');

//CONSTRUCTOR

module.exports = function(size) {

	const playerIds = [[], []];
	const allPlayers = {};

	this.id = Util.uid();
	this.size = size;
	this.game = null;
	this.state = 'OPEN';
	this.serverUpdate = 0;
	this.started = false;

	console.log('Created game', this.id);

//PRIVATE

	const playerCount = function() {
		return playerIds[0].length + playerIds[1].length;
	};

	const checkFull = function() {
		return playerIds[0].length >= size && playerIds[1].length >= size;
	};

	const formattedPlayers = function() {
		const broadcastPlayers = {};
		for (let team in playerIds) {
			const teamPlayers = playerIds[team];
			for (let pidx in teamPlayers) {
				const pid = teamPlayers[pidx];
				const player = allPlayers[pid];
				broadcastPlayers[pid] = {id: pid, name: player.name, team: team, index: pidx};
			}
		}
		return broadcastPlayers;
	};

//STATE

	this.checkStart = function() {
		const state = this.state;
		if (state == 'STARTED' || state == 'PLAYING') {
			return true;
		}
		if (state == 'READY') {
			this.start();
		}
		return false;
	};

//JOIN

	this.players = function() {
		return allPlayers;
	};

	this.add = function(player) {
		if (this.state != 'OPEN') {
			return false;
		}
		const pid = player.id;
		if (allPlayers[pid]) {
			return true;
		}

		const team = playerIds[1].length < playerIds[0].length ? 1 : 0;
		playerIds[team].push(pid);
		allPlayers[pid] = player;

		this.broadcast('add player', {players: formattedPlayers(), teams: playerIds});
		player.join(this);
		player.emit('join game', {gid: this.id, size: size, players: formattedPlayers(), teams: playerIds});

		if (checkFull()) {
			this.state = 'FULL';
			this.state = 'READY'; //TODO temp
		}
		return true;
	};

	this.remove = function(player) {
		if (!this.started) {
			const pid = player.id;
			for (let tidx in playerIds) {
				const teamPlayers = playerIds[tidx];
				for (let pidx in teamPlayers) {
					if (teamPlayers[pidx] == pid) {
						console.log(pid);
						teamPlayers.splice(pidx, 1);
						delete player.game;
						delete allPlayers[pid];

						if (playerCount() == 0) {
							this.state = 'OPEN';
							this.broadcast('remove player', playerIds);
						} else {
							console.log('Game canceled ' + this.id);
							this.state = 'CLOSED';
							delete this;
						}
						return true;
					}
				}
			}
		}
	};

//METHODS

	this.start = function() {
		this.broadcast('start game', {updates: Config.updateDuration, ticks: Config.tickDuration, players: formattedPlayers(), teams: playerIds});
		this.state = 'STARTED';
		this.started = true;
		console.log('Started game ' + this.id);
	};

	this.broadcast = function(name, message) {
		SocketIO.io.to(this.id).emit(name, message);
	};

};
