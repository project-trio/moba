'use strict';

const Bridge = require('bridge');
const Local = require('local');

const Render = require('game/util/render');

const Tower = require('game/entity/unit/tower');

//LAYOUTS

const maps = {};

const wallRadius = 24;

maps.tiny = {
	width: 800,
	height: 800,
	towers: [
		['base', 400, 44, false],
		['standard', 320, 320, false],
	],
	walls: [
		{
			x: 650, y: 260,
			w: 300, h: wallRadius * 2,
			capStart: true,
		},
	],
};

const wallSmallH = 50;

maps.small = {
	width: 800,
	height: 1400,

	towers: [
		['base', 400, 44, false],
		['turret', 190, 380, true],
		['turret', 470, 600, false],
	],

	walls: [
		{
			x: 240, y: 320,
			w: wallSmallH * 2, h: wallRadius * 2,
			capStart: true, capEnd: true,
			mirror: true,
		},
		{
			x: 240 - wallSmallH, y: 320 - wallSmallH,
			w: wallRadius * 2, h: wallSmallH * 2,
			capStart: true, capEnd: false,
			mirror: true,
		},
	],
};

const wallStandardH = 80;

maps.standard = {
	width: 1200,
	height: 1800,

	towers: [
		['base', 600, 44, false],
		['standard', 435, 360, true],
		['turret', 44, 420, true],
		['turret', 300, 760, true],
	],

	walls: [
		{
			x: 300, y: 360,
			w: wallStandardH * 2, h: wallRadius * 2,
			capStart: true, capEnd: true,
			mirror: true,
		},
		{
			x: 300 - wallStandardH, y: 360 - wallStandardH,
			w: wallRadius * 2, h: wallStandardH * 2,
			capStart: true, capEnd: false,
			mirror: true,
		},
	],

	minions: [
		{
			type: 'mini',
			paths: [
				[[520, 90], [90, 100], [90, 360], [260, 880], [260, 900]],
				[[520, 60], [120, 70], [120, 390], [300, 880], [300, 900]],
				[[520, 30], [150, 40], [150, 420], [340, 880], [340, 900]],
			],
			mirror: true,
		},
		{
			type: 'center',
			paths: [
				[[570, 80], [570, 900]],
				[[600, 80], [600, 900]],
				[[630, 80], [630, 900]],
			],
			mirror: false,
		},
	],
};

//CONSTRUCTOR

const GameMap = function(parent) {

	let layout;

	Render.create();

	let container = Render.group();
	const floorContainer = Render.group();
	const healthContainer = Render.group();
	container.add(floorContainer);
	container.add(healthContainer);
	parent.add(container);
	this.floorContainer = floorContainer;

	const walls = [];

//LISTEN

	let previousPositionX, previousPositionY, previousCameraX, previousCameraY;

	container.interactive = true;

//MANAGE

	const sightsArray = [];

	this.addSight = function(sight) {
		sightsArray.push(sight);
	};

	this.addHealthbar = function(bar) {
		healthContainer.add(bar);
	};

	this.blockCheck = function(moveX, moveY) {
		if (moveX < 1 || moveY < 1 || moveX >= layout.width || moveY >= layout.height) {
			return null;
		}
		return walls;
	};

	const createWallRect = function(x, y, w, h) {
		walls.push([(x - w/2), (y - h/2), w, h]);

		Render.wall(x, y, w, h, {
			color: 0xeeeeee,
			parent: floorContainer,
		});
	};

	const createWallCap = function(vertical, x, y, radius) {
		radius = radius / 2;
		walls.push([x, y, radius]);

		Render.wallCap(x, y, radius, {
			color: 0xeeeeee,
			parent: floorContainer,
		});
	};

	this.build = function(name) {
		name = 'standard';
		layout = maps[name];

		var mapWidth = layout.width;
		var mapHeight = layout.height;
		Render.positionCamera(mapWidth / 2, mapHeight / 2);

		const ground = Render.ground(mapWidth, mapHeight, {
			color: 0x00440a,
			parent: floorContainer,
		});

		let automateTimer;
		Render.on(ground, 'mousedown', (event) => {
			if (Local.player.unit.canMove()) {
				const clickPoint = event.intersect.point;
				const diffX = Math.round(clickPoint.x) - previousCameraX;
				const diffY = Math.round(clickPoint.y) - previousCameraY;
				Bridge.emit('update', {dest: [diffX, diffY]});
				if (automateTimer) {
					clearInterval(automateTimer);
					automateTimer = null;
				}
			}
		});

		automateTimer = setInterval(function() {
			if (Local.player) {
				const dx = Math.round(Math.random() * layout.width);
				const dy = Math.round(Math.random() * layout.height);
				Bridge.emit('update', {dest: [dx, dy]});
			}
		}, Math.random()*2000+1000);

		for (let widx in layout.walls) {
			const wall = layout.walls[widx];
			let w = wall.w;
			let h = wall.h;
			let vertical = h > w;

			for (let team = 0; team < 2; ++team) {
				const firstTeam = team === 0;
				let tx = firstTeam ? mapWidth - wall.x : wall.x;
				let ty = firstTeam ? mapHeight - wall.y : wall.y;
				const teamMp = firstTeam ? -1 : 1;

				for (let mirror = 0; mirror < (wall.mirror ? 2 : 1); ++mirror) {
					const mirrored = mirror > 0;
					const mirroredMp = mirrored ? 1 : -1;
					if (mirrored) {
						tx = (mapWidth - tx);
					}
					if (wall.capStart) {
						let capX = tx;
						let capY = ty;
						if (vertical) {
							capY = ty - h / 2 * teamMp;
						} else {
							capX = tx + w / 2 * teamMp * mirroredMp;
						}
						createWallCap(vertical, capX, capY, Math.min(w, h));
					}
					if (wall.capEnd) {
						let capX = tx;
						let capY = ty;
						if (vertical) {
							capY = ty + h / 2 * teamMp;
						} else {
							capX = tx - w / 2 * teamMp * mirroredMp;
						}
						createWallCap(vertical, capX, capY, Math.min(w, h));
					}
					createWallRect(tx, ty, w, h);
				}
			}
		}
		for (let tidx in layout.towers) {
			const tower = layout.towers[tidx];
			const towerType = tower[0];
			const x = tower[1];
			const y = tower[2];
			const mirroring = tower[3];
			var mirrored = false;
			for (let mirror = 0; mirror < (mirroring ? 2 : 1); ++mirror) {
				mirrored = !mirrored;
				for (let team = 0; team < 2; ++team) {
					const firstTeam = team === 0;
					const tx = firstTeam != mirrored ? mapWidth - x : x;
					const ty = firstTeam ? mapHeight - y : y;
					new Tower(team, towerType, tx, ty);
				}
			}
		}
	};

	this.destroy = function() {
		if (container) {
			container.destroy();
			container = null;
		}
	};

	this.track = function(cameraX, cameraY) {
		if (cameraX != previousPositionX) {
			previousPositionX = cameraX;

			const lwh = layout.width / 2;
			cameraX = -cameraX + lwh;
			if (cameraX < -lwh / 2) {
				cameraX = -lwh / 2;
			} else if (cameraX > lwh / 2) {
				cameraX = lwh / 2;
			}
			if (cameraX != previousCameraX) {
				container.position.x = cameraX;
				previousCameraX = cameraX;
			}
		}
		if (cameraY != previousPositionY) {
			previousPositionY = cameraY;

			const lhh = layout.height / 2;
			cameraY = -cameraY + lhh;
			if (cameraY < -lhh / 2) {
				cameraY = -lhh / 2;
			} else if (cameraY > lhh / 2) {
				cameraY = lhh / 2;
			}
			if (cameraY != previousCameraY) {
				container.position.y = cameraY;
				previousCameraY = cameraY;
			}
		}
	};

	this.minionData = function() {
		return layout.minions;
	};

//DIMENSIONS

	this.width = function() {
		return layout.width;
	};

	this.height = function() {
		return layout.height;
	};

	this.centerX = function() {
		return layout.width * 0.5;
	};

	this.centerY = function() {
		return layout.height * 0.5;
	};

};

module.exports = GameMap;
