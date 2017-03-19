const Util = require.main.require('./utils/util');

const Config = require('./config');
const Game = require('./game');
const Player = require('./player');

const games = [];

const DEFAULT_GAME_SIZE = Util.TESTING ? 0 : 1 //TODO size

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

			const actionData = {};
			const gamePlayers = game.players();
			for (let pid in gamePlayers) {
				const player = gamePlayers[pid];
				const playerActions = []
				const submittingSkills = [false, false, false]
				let hasTarget = false
				for (let ai = player.actions.length - 1; ai >= 0; ai -= 1) {
					const action = player.actions[ai]
					if (hasTarget && action.target) {
						continue
					}
					const skillIndex = action.skill
					if (skillIndex !== undefined) {
						if (submittingSkills[skillIndex]) {
							continue
						}
						submittingSkills[skillIndex] = true
						const skillData = player.skills[skillIndex]
						const skillLevel = player.skillLevels[skillIndex]
						const updatesUntilCooleddown = Math.ceil(skillData.getCooldown(skillLevel) * 100 / updateDuration)
						player.skillCooldowns[skillIndex] = game.serverUpdate + updatesUntilCooleddown
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
				if (player.skillCooldowns[skillIndex] > player.game.serverUpdate) {
					console.log('Action ERR: Still on cooldown', skillIndex, player.skillCooldowns[skillIndex] - player.game.serverUpdate)
					return
				}
			}
			player.actions.push(data)
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
