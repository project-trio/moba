'use strict';

const Bridge = require('bridge');
const Local = require('local');

const Render = require('game/util/render');

const Tower = require('game/entity/unit/tower');

//LAYOUTS

const maps = {};

maps.small = {
	width: 800,
	height: 800,
	towers: [
		['base', 0.5, 0],
		['turret', 0.25, 1/3]
	],
	walls: [
		{
			x: 0.7, y: 0.3,
			w: 0.3, h: 0.1,
			capStart: true
		}
	]
};

const wallR = 24;
const wallH = 80;

maps.standard = {
	width: 1024,
	height: 1600,
	towers: [
		['base', 0.5, 0],
		['standard', 1/4, 1/3],
		['standard', 3/4, 1/3]
	],
	walls: [
		{
			x: 300, y: 360,
			w: wallH * 2, h: wallR * 2,
			capStart: true, capEnd: true,
			mirror: true
		},
		{
			x: 300 - wallH, y: 360 - wallH,
			w: wallR * 2, h: wallH * 2,
			capStart: true, capEnd: false,
			mirror: true
		}
	]
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
		if (moveX < 1 || moveY < 1 || moveX >= layout.width * 1000 || moveY >= layout.height * 1000) {
			return null;
		}
		return walls;
	};

	const createWallRect = function(x, y, w, h) {
		walls.push([(x - w/2) * 1000, (y - h/2) * 1000, w * 1000, h * 1000]);

		Render.wall(x, y, w, h, {
			color: 0xeeeeee,
			parent: floorContainer,
		});
	};

	const createWallCap = function(vertical, x, y, radius) {
		radius = Math.round(radius / 2);
		walls.push([x * 1000, y * 1000, radius * 1000]);

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
			const clickPoint = event.intersect.point;
			const diffX = Math.round(clickPoint.x) - previousCameraX;
			const diffY = Math.round(clickPoint.y) - previousCameraY;
			const dest = Local.player.unit.requestedDestination(diffX, diffY);
			Bridge.emit('update', {dest: dest});
			if (automateTimer) {
				clearInterval(automateTimer);
				automateTimer = null;
			}
		});

		automateTimer = setInterval(function() {
			if (Local.player) {
				const dest = Local.player.unit.requestedDestination(Math.random()*layout.width, Math.random()*layout.height);
				Bridge.emit('update', {dest: dest});
			}
		}, Math.random()*2000+1000);

		for (let widx in layout.walls) {
			const wall = layout.walls[widx];
			let w = wall.w;
			let h = wall.h;
			let vertical = h > w;

			for (let team = 0; team < 2; ++team) {
				let t0 = team == 0;
				let tx = t0 ? mapWidth - wall.x : wall.x;
				let ty = team == 0 ? mapHeight - wall.y : wall.y;
				const teamMp = team == 0 ? -1 : 1;

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
			const x = Math.round(tower[1] * mapWidth);
			const y = Math.round(tower[2] * mapHeight) + 64;
			const towerType = tower[0];
			for (let team = 0; team < 2; ++team) {
				const tx = team == 0 ? mapWidth - x : x;
				const ty = team == 0 ? mapHeight - y : y;
				new Tower(team, towerType, floorContainer, tx, ty);
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
