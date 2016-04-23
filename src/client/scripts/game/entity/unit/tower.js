'use strict';

const Local = require('local');

const Util = require('game/util/util');
const Render = require('game/util/render');

const Unit = require('game/entity/unit/unit');

//LOCAL

const TOWER_SIZE = 88;

const towerStats = {
	standard: {
		maxHealth: [160, 0, 0],
		regenerate: [0, 0, 0],
		speed: [0, 0, 0],
		damage: [8, 0, 0],
		sightRange: [160, 0, 0],
		attackRange: [160, 0, 0],
		attackCooldown: [6, 0, 0],

		collision: 30
	},
	base: {
		maxHealth: [300, 0, 0],
		regenerate: [0, 0, 0],
		speed: [0, 0, 0],
		damage: [10, 0, 0],
		sightRange: [200, 0, 0],
		attackRange: [200, 0, 0],
		attackCooldown: [5, 0, 0],

		collision: 35
	}
};

//CONSTRUCTOR

module.exports = function(team, towerType, parent, x, y) {

	const superUnit = new Unit(team, towerStats[towerType], parent, x, y);
	this.__proto__ = superUnit;
	Unit.addBase(this);

	const platform = Render.sprite('turret-base');
	platform.anchor.set(0.5);
	platform.scale.set(1/3);
	this.base.addChild(platform);

	const arrow = Render.sprite('turret-arrow');
	arrow.anchor.set(0.5);
	arrow.scale.set(0.5);
	arrow.position.x += 16;
	this.top.addChild(arrow);

	this.renderInBackground = true;

	// Damage

	this.die = function(time) {
		this.sightCircle.visible = false;
		this.healthContainer.parent.removeChild(this.healthContainer);
		this.setBlocking(false);
		this.top.removeChild(arrow);

		superUnit.die(time);

		if (towerType == 'base') {
			Local.game.end(team);
		}
	};

	this.attack = function(enemy, renderTime) {
		superUnit.attack(enemy, renderTime);

		this.top.rotation = Util.angleBetween(this, enemy) + Math.PI;
	};

};
