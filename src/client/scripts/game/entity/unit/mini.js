'use strict';

const Render = require('game/util/render');

const Unit = require('game/entity/unit/unit');

const units = {
	// [start, levelup, max]
	mini: {
		maxHealth: [30, 0, 0],
		regenerate: [0, 0, 0],
		speed: [12, 0, 0],
		damage: [1, 0, 0],
		sightRange: [100, 0, 0],
		attackRange: [15, 0, 0],
		attackCooldown: [1, 0, 0],

		collision: 10,
	},

	center: {
		maxHealth: [50, 0, 0],
		regenerate: [0, 0, 0],
		speed: [12, 0, 0],
		damage: [8, 0, 0],
		sightRange: [100, 0, 0],
		attackRange: [100, 0, 0],
		attackCooldown: [5, 0, 0],

		collision: 10,
	}
};

module.exports = function(team, name, path, mirrored, mapWidth, mapHeight) {

	const stats = units[name];
	let pathProgress = 0;
	let currentDest;

	const updateDestination = function() {
		currentDest = path[pathProgress].slice();
		if (mirrored) {
			currentDest[0] = mapWidth - currentDest[0];
		}
		if (team == 0) {
			currentDest[1] = mapHeight - currentDest[1];
		}
	};

	this.nextPath = function() {
		pathProgress += 1;
		updateDestination();

		const nextDest = this.requestedDestination(currentDest[0], currentDest[1]);
		console.log(nextDest);
		this.setDestination(nextDest[0], nextDest[1], nextDest[2], nextDest[3]);
	};

	updateDestination();

	const superUnit = new Unit(team, stats, currentDest[0], currentDest[1]);
	this.__proto__ = superUnit;
	Unit.addBase(this);

	// setTimeout(this.nextPath, 0);
	this.nextPath();

	Render.voxel('mini', {parent: this.top});

	// Methods

	this.die = function(time) {
		// this.sightCircle.visible = false;
		this.healthContainer.parent.remove(this.healthContainer);
		this.container.parent.remove(this.container);
		Unit.remove(this);

		// superUnit.die(time);
	};

	this.update = function(renderTime, timeDelta, tweening) {

	};

	this.move = function(timeDelta, tweening) {
		// console.log(this.px(), currentDest[0], this.py(), currentDest[1]);
		if (this.px() == currentDest[0] && this.py() == currentDest[1]) {
			nextPath();
		}

		superUnit.move(timeDelta, tweening);
	};

};
