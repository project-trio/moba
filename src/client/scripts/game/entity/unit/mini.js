'use strict';

const Render = require('game/util/render');

const Movable = require('game/entity/unit/movable');
const Unit = require('game/entity/unit/unit');

const MINI_STATS = {
	// [start, levelup, max]
	mini: {
		healthMax: [60, 0, 0],
		healthRegen: [0, 0, 0],

		sightRange: [100, 0, 0],
		attackRange: [15, 0, 0],

		attackDamage: [1, 0, 0],
		attackCooldown: [1, 0, 0],

		moveSpeed: [12, 0, 0],
		collision: 10,
	},

	center: {
		healthMax: [50, 0, 0],
		healthRegen: [0, 0, 0],

		sightRange: [100, 0, 0],
		attackRange: [100, 0, 0],

		attackDamage: [8, 0, 0],
		attackCooldown: [5, 0, 0],

		moveSpeed: [12, 0, 0],
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
		this.pathFlip = false;
		this.mirrored = mirrored;
		this.pathProgress = 0;
		this.updateDestination();
		this.setLocation(this.currentDest[0], this.currentDest[1]);

		Unit.addBase(this);

		Render.voxel('mini', {parent: this.top});

		this.nextDestination();
	}

	updateDestination() {
		let nextDest = this.path[this.pathProgress];
		if (nextDest) {
			nextDest = nextDest.slice();
			if (this.mirrored) {
				nextDest[0] = mapWidth - nextDest[0];
			}
			if ((this.team == 0) != this.pathFlip) {
				nextDest[1] = mapHeight - nextDest[1];
			}
			this.currentDest = nextDest;
			return true;
		}
		this.currentDest = null;
	}

	nextDestination() {
		if (this.pathFlip) {
			this.pathProgress -= 1;
		} else if (this.pathProgress == this.path.length - 1) {
			this.pathFlip = true;
		} else {
			this.pathProgress += 1;
		}
		if (this.updateDestination()) {
			const nextDest = this.requestedDestination(this.currentDest[0], this.currentDest[1]);
			this.setDestination(nextDest[0], nextDest[1], nextDest[2], nextDest[3]);
			return true;
		}
	}

	die(time) {
		this.destroy();

		super.die(time);
	}

}

module.exports = Mini;
