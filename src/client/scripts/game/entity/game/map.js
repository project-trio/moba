'use strict';

const Bridge = require('bridge');
const Local = require('local');

const Canvas = require('game/util/canvas');
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

const mapW = 0.035;
const mapL = 0.16;
const wallH = 0.24;
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
			x: 2/3, y: wallH,
			w: mapL, h: mapW,
			capStart: true, capEnd: true,
			mirror: true
		},

		{
			x: 2/3 + mapL, y: wallH - mapL / 2,
			w: mapW, h: mapL,
			capStart: true, capEnd: false,
			offset: 10,
			mirror: true
		}
	]
};

//CONSTRUCTOR

const GameMap = function(parent) {

	let layout;

	Canvas.create();

	const fogContext = Canvas.get().getContext('2d');

	let container = Render.group();
	const floorContainer = Render.group();
	const healthContainer = Render.group();
	container.addChild(floorContainer);
	container.addChild(healthContainer);
	parent.addChild(container);
	this.floorContainer = floorContainer;

	const walls = [];

//LISTEN

	let previousPositionX, previousPositionY, previousCameraX, previousCameraY;

	container.interactive = true;

	let automateTimer;
	function onDown(event) {
		const location = event.data.originalEvent;
		const clickX = location.layerX - previousCameraX;
		const clickY = location.layerY - previousCameraY;
		const dest = Local.player.unit.requestedDestination(clickX, clickY);
		Bridge.emit('update', {dest: dest});
		if (automateTimer) {
			clearInterval(automateTimer);
			automateTimer = null;
		}
	}
	container.on('mousedown', onDown);
	container.on('touchstart', onDown);

	automateTimer = setInterval(function() {
		if (Local.player) {
			const dest = Local.player.unit.requestedDestination(Math.random()*layout.width, Math.random()*layout.height);
			Bridge.emit('update', {dest: dest});
		}
	}, Math.random()*2000+2000);

//MANAGE

	const sightsArray = [];

	this.addSight = function(sight) {
		sightsArray.push(sight);
	};

	this.addHealthbar = function(bar) {
		healthContainer.addChild(bar);
	};

	this.updateFog = function() {
		fogContext.globalCompositeOperation = 'source-over';
		// fogContext.clearRect(0, 0, layout.width, layout.height);
		fogContext.fillStyle = 'rgba(128, 128, 128)';
		fogContext.fillRect(0, 0, layout.width, layout.height);

		fogContext.globalCompositeOperation = 'destination-out';
		// fogContext.fillStyle = 'rgba(255, 255, 255, 255)';
		fogContext.fillStyle = 'white';
		for (let idx in sightsArray) {
			const sight = sightsArray[idx];
			if (!sight.visible) {
				continue;
			}
			fogContext.beginPath();
			fogContext.arc(sight.x, sight.y, sight.radius, 0, 2*Math.PI, false);
			fogContext.fill();
			// fogContext.closePath();
		}
	};

	this.blockCheck = function(moveX, moveY) {
		if (moveX < 1 || moveY < 1 || moveX >= layout.width * 1000 || moveY >= layout.height * 1000) {
			return null;
		}
		return walls;
	};

	const createWallRect = function(x, y, w, h) {
		walls.push([x * 1000, y * 1000, w * 1000, h * 1000]);

		Render.rectangle(x, y, w, h, {
			color: 0xeeeeee,
			parent: floorContainer,
		});
	};

	const createWallCap = function(vertical, mp, x, y, radius) {
		radius = Math.round(radius / 2);
		if (vertical) {
			x += radius * mp;
		} else {
			y += radius;
		}
		walls.push([x * 1000, y * 1000, radius * 1000]);

		Render.circle(x, y, radius, 0xeeeeee, floorContainer);
	};

	this.build = function(name) {
		name = 'standard';
		layout = maps[name];

		Render.rectangle(0, 0, layout.width, layout.height, {
			color: 0x000000,
			parent: floorContainer,
		});

		Canvas.get().width = layout.width;
		Canvas.get().height = layout.height;
		for (let widx in layout.walls) {
			const wall = layout.walls[widx];
			let x = Math.round(wall.x * layout.width);
			let y = Math.round(wall.y * layout.height) + (wall.offset || 0);
			let minWH = Math.min(layout.width, layout.height);
			let w = Math.round(wall.w * minWH);
			let h = Math.round(wall.h * minWH);
			let vertical = h > w;
			if (vertical) {
				x -= w / 2;
			} else {
				y -= h;
			}
			for (let team = 0; team < 2; ++team) {
				let t0 = team == 0;
				let teamMp = t0 ? -1 : 1;
				let tx = t0 ? layout.width - x : x;
				let ty = team == 0 ? layout.height - y : y;
				ty -= Math.round(h / 2);

				for (let mirror = 0; mirror < (wall.mirror ? 2 : 1); ++mirror) {
					const mirrored = mirror > 0;
					if (mirrored) {
						tx = (layout.width - tx) - w * teamMp;
					}
					if (wall.capStart) {
						let capX = tx;
						let capY = ty;
						if (vertical) {
							capY = t0 ? ty - h * teamMp : ty;
						} else {
							capX = mirrored ? tx + w * teamMp : tx;
						}
						createWallCap(vertical, teamMp, capX, capY, Math.min(w, h));
					}
					if (wall.capEnd) {
						let capX = tx;
						let capY = ty;
						if (vertical) {
							capY = t0 ? ty : ty - h * teamMp;
						} else {
							capX = mirrored ? tx : tx + w * teamMp;
						}
						createWallCap(vertical, teamMp, capX, capY, Math.min(w, h));
					}
					const wx = t0 ? tx - w : tx;
					createWallRect(wx, ty, w, h);
				}
			}
		}
		for (let tidx in layout.towers) {
			const tower = layout.towers[tidx];
			const x = Math.round(tower[1] * layout.width);
			const y = Math.round(tower[2] * layout.height) + 44;
			const towerType = tower[0];
			for (let team = 0; team < 2; ++team) {
				const tx = team == 0 ? layout.width - x : x;
				const ty = team == 0 ? layout.height - y : y;
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

			const containerWidth = window.innerWidth;
			cameraX = -cameraX + containerWidth / 2;
			if (cameraX > 0) {
				cameraX = 0;
			} else if (cameraX < -layout.width + containerWidth) {
				cameraX = -layout.width + containerWidth;
			}
			if (cameraX != previousCameraX) {
				container.position.x = cameraX;
				Canvas.get().style['margin-left'] = cameraX + 'px';
				previousCameraX = cameraX;
			}
		}
		if (cameraY != previousPositionY) {
			previousPositionY = cameraY;

			const containerHeight = window.innerHeight;
			cameraY = -cameraY + containerHeight / 2;
			if (cameraY > 0) {
				cameraY = 0;
			} else if (cameraY < -layout.height + containerHeight) {
				cameraY = -layout.height + containerHeight;
			}
			if (cameraY != previousCameraY) {
				container.position.y = cameraY;
				Canvas.get().style['margin-top'] = cameraY + 'px';
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
