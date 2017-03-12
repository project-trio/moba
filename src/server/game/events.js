const Util = require.main.require('./utils/util');

const Config = require('./config');
const Game = require('./game');
const Player = require('./player');

const games = [];

const DEFAULT_GAME_SIZE = Util.TESTING ? 1 : 1 //TODO size

//LOCAL

const quickJoin = function(player) {
	for (let idx = 0; idx < games.length; idx += 1) {
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

const startTime = process.hrtime();
const updateDuration = Config.updateDuration;
let loopCount = 0;

const loop = function() {
	for (let idx = 0; idx < games.length; idx += 1) {
		const game = games[idx];
		if (game.checkStart()) {
			game.serverUpdate += 1;

			const moveData = {};
			const gamePlayers = game.players();
			for (let pid in gamePlayers) {
				const player = gamePlayers[pid];
				if (player.move) {
					moveData[pid] = player.move;
					player.move = null;
				}
			}
			game.broadcast('update', {update: game.serverUpdate, moves: moveData});
		}
	}

	const diff = process.hrtime(startTime);
	const msSinceStart = diff[0] * 1000 + diff[1] / 1000000;
	loopCount += 1;
	setTimeout(loop, updateDuration * loopCount - msSinceStart);
};

loop();

//PUBLIC

module.exports = {

	register (client) {
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
