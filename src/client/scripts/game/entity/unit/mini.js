'use strict';

const Render = require('game/util/render');

const Movable = require('game/entity/unit/movable');
const Unit = require('game/entity/unit/unit');

const MINI_STATS = {
	// [start, levelup, max]
	mini: {
		healthMax: [90, 0, 0],
		healthRegen: [0, 0, 0],

		sightRange: [100, 0, 0],
		attackRange: [20, 0, 0],

		attackDamage: [1, 0, 0],
		attackCooldown: [1, 0, 0],

		moveSpeed: [12, 0, 0],
		collision: 10,
	},

	center: {
		healthMax: [50, 0, 0],
		healthRegen: [0, 0, 0],

		sightRange: [100, 0, 0],
		attackRange: [60, 0, 0],

		attackDamage: [8, 0, 0],
		attackCooldown: [5, 0, 0],

		moveSpeed: [12, 0, 0],
		collision: 10,
	},
};

let mapWidth, mapHeight; //TODO

//CLASS

class Mini extends Movable {

	constructor(team, name, path, mirrored, _mapWidth, _mapHeight) {
		mapWidth = _mapWidth;
		mapHeight = _mapHeight;

		const stats = MINI_STATS[name];

		super(team, stats);

		this.moveToTarget = true;
		this.path = path;
		this.pathFlip = false;
		this.mirrored = mirrored;
		this.pathProgress = 0;

		this.updateDestination();
		this.setLocation(this.currentDest[0], this.currentDest[1]);

		this.reachedDestination();

		Unit.addBase(this);

		Render.voxel('mini', {parent: this.top});
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

	applyCurrentDestination() {
		if (this.currentDest) {
			this.setDestination(this.currentDest[0], this.currentDest[1]);
			return true;
		}
	}

	reachedDestination() {
		if (this.pathFlip || this.pathProgress == this.path.length - 1) {
			this.pathProgress -= 1;
			if (this.pathProgress < 0) {
				return false;
			}
			this.pathFlip = true;
		} else {
			this.pathProgress += 1;
		}
		if (this.updateDestination()) {
			this.applyCurrentDestination();
			return true;
		}
	}

	die(time) {
		super.die(time);

		this.destroy();
	}

	shouldTarget(unit) {
		return !this.isDead && !this.alliedTo(unit) && this.inSightRange(unit);
	}

	move(timeDelta, tweening) {
		if (!super.move(timeDelta, tweening)) {
			if (this.applyCurrentDestination()) {
				this.isMoving = true;
			}
		}
	}

}

module.exports = Mini;
