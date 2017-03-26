const CommonConsts = require.main.require('../common/constants');

const Util = require.main.require('./utils/util');

const Config = require('./config');
const Game = require('./game');
const Player = require('./player');

const games = [];
const clients = [];

//LOCAL

const createGame = function(player, size) {
	const game = new Game(size);
	if (game.add(player)) {
		games.push(game);
		return game;
	}
}

const join = function(player, gid, callback) {
	for (let idx = 0; idx < games.length; idx += 1) {
		const g = games[idx];
		if (g.id === gid) {
			const data = g.add(player)
			if (data) {
				callback(data)
				return true;
			}
			callback({error: 'Unable to join'})
		}
	}
	callback({error: "Game doesn't exist"})
};

const quickJoin = function(player) {
	for (let idx = 0; idx < games.length; idx += 1) {
		const g = games[idx];
		if (g.add(player)) {
			return true;
		}
	}

	createGame(player, CommonConsts.DEFAULT_GAME_SIZE)
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

			const actionData = {};
			const gamePlayers = game.players();
			for (let pid in gamePlayers) {
				const player = gamePlayers[pid];
				const playerActions = []
				const submittingSkills = [false, false, false]

				const levelupIndex = player.levelNext
				if (levelupIndex !== null) {
					playerActions.push({ skill: levelupIndex, level: true })
					player.levelNext = null
					submittingSkills[levelupIndex] = true
				}

				let hasTarget = false
				for (let ai = player.actions.length - 1; ai >= 0; ai -= 1) {
					const action = player.actions[ai]
					const target = action.target
					if (target) {
						if (hasTarget) {
							continue
						}
						hasTarget = true
					}
					const skillIndex = action.skill
					if (skillIndex !== undefined) {
						if (submittingSkills[skillIndex]) {
							continue
						}
						submittingSkills[skillIndex] = true
					}
					playerActions.push(action)
				}
				actionData[pid] = playerActions;
				player.actions = [];
			}
			game.broadcast('update', { update: game.serverUpdate, actions: actionData });
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
		clients.push(player)

		client.on('admin', (data, callback)=>{ //TODO protect
			console.log('Admin', pid);
			callback({games: games, players: clients})
			clients.splice(clients.indexOf(player), 1)
		});

		client.on('disconnect', ()=>{
			console.log('Disconnected', pid);
			if (player.game) {
				player.game.remove(player);
			}
		});

		client.on('action', (data)=>{
			if (player.actions.length > 10) {
				console.log('Action ERR: Too many actions')
				return
			}
			const skillIndex = data.skill
			if (skillIndex !== undefined) {
				if (data.level) {
					player.levelNext = skillIndex
					return
				}
			}
			player.actions.push(data)
		});

		client.on('team msg', (data)=>{
			data.id = player.id
			player.game.teamBroadcast(player.team, 'msg', data)
		});

		client.on('updated', (data)=>{
			player.serverUpdate = data.update;
		});

		client.on('lobby action', (data, callback)=>{
			console.log('lobby action', data);
			if (data.action === 'quick') {
				quickJoin(player);
			} else if (data.action === 'create') {
				const game = createGame(player, data.size);
				const result = {}
				if (game) {
					result.gid = game.id
				} else {
					result.error = 'You may already be in a game'
				}
				callback(result)
			} else if (data.action === 'join') {
				join(player, data.gid, callback)
			} else {
				client.join('lobby');
			}
		});
	}

};
