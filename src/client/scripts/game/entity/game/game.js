'use strict';

const Local = require('local');
const Render = require('game/util/render');

const GameMap = require('game/entity/game/map');
const Player = require('game/entity/game/player');
const Unit = require('game/entity/unit/unit');

const Game = function(gid, size) {

	const gameContainer = Render.group();
	this.container = gameContainer;

	let status;
	let players = {};
	let teamSize = size;
	let startTime;
	let serverUpdateTime;

	let updateCount = 0;
	let updateQueue = {};

	let updateDuration;
	let tickDuration;
	let ticksPerUpdate;

	this.serverUpdate = -1;
	this.running = false;

	const map = new GameMap(gameContainer);
	this.map = map;

	this.fpsText = Render.text('240fps', 10, 10, {font: '24px Arial', fill: 0xff1010}, gameContainer);

	let localUnit;

	Render.add(gameContainer);

	// Update

	let ticksRendered = 0;
	let ticksRenderedLastUpdate = 0;
	let lastTickTime;

	this.performTicks = function(currentTime) {
		let ticksToRender = Math.floor((currentTime - lastTickTime) / tickDuration);
		if (ticksToRender <= 0) {
			return false;
		}

		while (ticksToRender > 0) {
			if (ticksRendered % ticksPerUpdate == 1) {
				if (!dequeueUpdate()) {
					console.log('Missing update', ticksRendered);
					break;
				}
			}
			const renderTime = ticksRendered * tickDuration;
			Unit.update(renderTime, tickDuration, false);

			++ticksRendered;
			--ticksToRender;
			lastTickTime += tickDuration;
		}

		if (localUnit) {
			localUnit.updateVisibility();
			map.track(localUnit.px() * 0.001, localUnit.py() * 0.001);
		}
		// map.updateFog();
		return true;
	};

	const dequeueUpdate = function() {
		const queued = updateQueue[updateCount];
		if (!queued) {
			return false;
		}
		delete updateQueue[updateCount];

		const ticksToRender = ticksRendered - ticksRenderedLastUpdate;
		ticksRenderedLastUpdate = ticksRendered;
		if (ticksToRender != ticksPerUpdate) {
			console.log('Dequeue update', updateCount, ticksToRender);
		}
		++updateCount;

		for (let pid in queued) {
			const player = players[pid];
			if (player) {
				const playerData = queued[pid];
				const dest = playerData.dest;
				if (dest) {
					// console.log(['Dest', dest, pid]);
					player.unit.setDestination(dest[0], dest[1], dest[2], dest[3]);
				}
			}
		}
		return true;
	};

	// Play

	this.enqueueUpdate = function(update, moves) {
		this.serverUpdate = update;
		updateQueue[update] = moves;

		const currentTime = Date.now();
		const updateDiff = currentTime - serverUpdateTime;
		if (updateDiff > 0) {
			lastTickTime += updateDiff - updateDuration;
			serverUpdateTime = currentTime;
		}
	};

	this.start = function(_updateDuration, _tickDuration) {
		console.log(Local.playerId, players);
		Local.player = players[Local.playerId];

		updateDuration = _updateDuration;
		tickDuration = _tickDuration;
		ticksPerUpdate = updateDuration / tickDuration;
		console.log('STARTED ' + updateDuration + ' ' + tickDuration + ' ' + ticksPerUpdate);

		const mapType = teamSize <= 1 ? 'small' : 'standard';
		map.build(mapType);

		for (let pid in players) {
			const player = players[pid];
			if (player) {
				player.createShip();
			}
		}
		localUnit = Local.player.unit;

		status = 'STARTED';
		startTime = Date.now();
		serverUpdateTime = startTime;
		lastTickTime = startTime;
		this.enqueueUpdate(0, {});

		this.running = true;
	};

	this.end = function(losingTeam) {
		this.running = false;

		const centerX = window.innerWidth * 0.5;
		const centerY = window.innerHeight * 0.5;

		const overText = Render.text('GAME OVER', centerX, centerY, {font: '64px Arial', fill: 0xff1010}, gameContainer);
		const winnerText = Render.text('Team ' + (2-losingTeam) + ' won!', centerX, centerY + 88, {font: '44px Arial', fill: 0xff1010}, gameContainer);

		// overText.anchor.set(0.5);
		// winnerText.anchor.set(0.5);
	};

	// Players

	this.updatePlayers = function(playerData) {
		// teamSize = ?; //TODO
		const serverPlayers = playerData.players;
		players = {};
		for (let pid in serverPlayers) {
			const playerInfo = serverPlayers[pid];
			players[pid] = new Player(pid, playerInfo.team, playerInfo.index, playerInfo.name);
		}
	};

};

module.exports = Game;
