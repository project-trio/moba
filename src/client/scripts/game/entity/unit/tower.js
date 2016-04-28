'use strict';

const Local = require('local');

const Util = require('game/util/util');
const Render = require('game/util/render');

const Unit = require('game/entity/unit/unit');

//LOCAL

const TOWER_STATS = {
	base: {
		maxHealth: [300, 0, 0],
		regenerate: [0, 0, 0],
		speed: [0, 0, 0],
		damage: [5, 0, 0],
		sightRange: [200, 0, 0],
		attackRange: [200, 0, 0],
		attackCooldown: [1, 0, 0],

		z: -5,
		collision: 35,
	},

	standard: {
		maxHealth: [200, 0, 0],
		regenerate: [0, 0, 0],
		speed: [0, 0, 0],
		damage: [8, 0, 0],
		sightRange: [190, 0, 0],
		attackRange: [190, 0, 0],
		attackCooldown: [6, 0, 0],

		z: -15,
		collision: 30,
	},

	turret: {
		maxHealth: [160, 0, 0],
		regenerate: [0, 0, 0],
		speed: [0, 0, 0],
		damage: [6, 0, 0],
		sightRange: [180, 0, 0],
		attackRange: [180, 0, 0],
		attackCooldown: [6, 0, 0],

		z: -25,
		collision: 30,
	},
};

//CLASS

class Tower extends Unit {

	constructor(team, towerType, x, y) {
		const stats = TOWER_STATS[towerType];

		super(team, stats, x, y);

		Unit.addBase(this);

		this.towerType = towerType;

		Render.voxel('turret-base', {parent: this.base});

		Render.voxel('turret-top', {
			parent: this.top,
		});

		this.renderInBackground = true;

		this.container.position.z = stats.z;
	}

	// Damage

	die(time) {
		// this.sightCircle.visible = false;
		this.healthContainer.parent.remove(this.healthContainer);
		this.isBlocking = false;
		this.container.position.z = -44;
		this.container.remove(this.top);


		const baseMesh = this.base.children[0];
		if (baseMesh) {
			baseMesh.material.transparent = true;
			baseMesh.material.opacity = 0.5;
		}

		super.die(time);

		if (this.towerType == 'base') {
			Local.game.end(this.team);
		}
	}

	attack(enemy, renderTime) {
		super.attack(enemy, renderTime);

		this.top.rotation.z = Util.angleBetween(this, enemy) + Math.PI;
	}

}

module.exports = Tower;
