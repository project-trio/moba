'use strict';

const Util = require.main.require('./utils/util');

const Config = require('./config');
const Game = require('./game');
const Player = require('./player');

const games = [];

const DEFAULT_GAME_SIZE = Util.TESTING ? 0 : 1;

//LOCAL

const quickJoin = function(player) {
	for (let idx in games) {
		const g = games[idx];
		if (g.add(player)) {
			return true;
		}
	}

	const game = new Game(DEFAULT_GAME_SIZE);
	game.add(player);
	games.push(game);
};

//UPDATE

let loopTime = Date.now();

const loop = function() {
	for (let gidx in games) {
		const game = games[gidx];
		if (game.checkStart()) {
			let lagged = null;
			let moveData = null;
			let gameUpdate = game.serverUpdate;

			const gamePlayers = game.players();
			for (let pid in gamePlayers) {
				let player = gamePlayers[pid];
				if (player.isDisconnected() && ++player.lagCount < 30) {
					lagged = pid;
					break;
				}
			}
			if (lagged) {
				for (let pid in gamePlayers) {
					const player = gamePlayers[pid];
					player.serverUpdate = gameUpdate - 1;
				}
			} else {
				gameUpdate = ++game.serverUpdate;

				moveData = {};
				for (let pid in gamePlayers) {
					const player = gamePlayers[pid];
					if (player.move) {
						moveData[pid] = player.move;
						player.move = null;
					}
				}
			}
			game.broadcast('update', {update: gameUpdate, lag: lagged, moves: moveData});
		}
	}

	loopTime += Config.updateDuration;
	const currentTime = Date.now();
	setTimeout(loop, loopTime - currentTime);
};

loop();

//PUBLIC

module.exports = {

	register: function(client) {
		const pid = client.pid;
		const player = new Player(client);

		client.on('disconnect', ()=>{
			console.log('Disconnected', pid);
			if (player.game) {
				player.game.remove(player);
			}
		});

		client.on('update', (data)=>{
			player.move = data;
		});

		client.on('updated', (data)=>{
			player.serverUpdate = data.serverUpdate;
		});

		client.on('lobby action', (data)=>{
			console.log('lobby action', data);
			if (data.action == 'quick') {
				quickJoin(player);
			} else {
				client.join('lobby');
			}
		});
	}

};
