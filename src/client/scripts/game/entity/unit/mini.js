'use strict';

const Render = require('game/util/render');

const Movable = require('game/entity/unit/movable');
const Unit = require('game/entity/unit/unit');

const MINI_STATS = {
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

let mapWidth, mapHeight; //TODO

//CLASS

class Mini extends Movable {

	constructor(team, name, path, mirrored, _mapWidth, _mapHeight) {
		mapWidth = _mapWidth;
		mapHeight = _mapHeight;

		const stats = MINI_STATS[name];

		super(team, stats);

		this.path = path;
		this.mirrored = mirrored;
		this.pathProgress = 0;
		this.updateDestination();
		this.setLocation(this.currentDest[0], this.currentDest[1]);

		Unit.addBase(this);

		Render.voxel('mini', {parent: this.top});

		this.nextPath();
	}

	updateDestination() {
		let nextDest = this.path[this.pathProgress].slice();
		if (this.mirrored) {
			nextDest[0] = mapWidth - nextDest[0];
		}
		if (this.team == 0) {
			nextDest[1] = mapHeight - nextDest[1];
		}
		this.currentDest = nextDest;
	}

	nextPath() {
		this.pathProgress += 1;
		this.updateDestination();

		const nextDest = this.requestedDestination(this.currentDest[0], this.currentDest[1]);
		this.setDestination(nextDest[0], nextDest[1], nextDest[2], nextDest[3]);
	}

	// Methods

	die(time) {
		// this.sightCircle.visible = false;
		this.healthContainer.parent.remove(this.healthContainer);
		this.container.parent.remove(this.container);
		Unit.remove(this);

		super.die(time);
	}

	move(timeDelta, tweening) {
		// console.log(this.px, currentDest[0], this.py, currentDest[1]);
		if (this.px == this.currentDest[0] && this.py == this.currentDest[1]) {
			this.nextPath();
		}

		super.move(timeDelta, tweening);
	}

}

module.exports = Mini;
