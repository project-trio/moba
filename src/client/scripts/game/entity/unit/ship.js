'use strict';

const Local = require('local');

const Util = require('game/util/util');
const Render = require('game/util/render');

const Unit = require('game/entity/unit/unit');

//LOCAL

const waitToRespawn = 1990;
const expPerLevel = 600;

const units = {
	// [start, levelup, max]
	pewpew: {
		maxHealth: [60, 10, 0],
		regenerate: [40, 4, 0],
		speed: [14 * 2, 0, 0], //TODO
		damage: [8, 1, 0],
		sightRange: [160, 1, 0],
		attackRange: [140, 1, 0],
		attackCooldown: [5, 0, 0],

		collision: 20
	}
};

//CONSTRUCTOR

const Ship = function(name, player, team, x, y, angle) {

	const statBase = units[name] || units['pewpew'];
	const superUnit = new Unit(team, statBase, x, y, angle);
	this.__proto__ = superUnit;
	Unit.addBase(this);
	this.id = player.id;
	// this.name = player.name;

	// Vars

	let level = 1;
	let levelExp = 0;
	let respawned = false;

	// Unit

	const offset = name == 'roller' ? -19 : 0;

	Render.voxel(name, {parent: this.top, z: offset});

	// const base = Render.sprite('ship');
	// this.base.add(base);

	// const nameText = Render.text(player.name + ' [1]', 0, -Local.shipSize, {font: '13px Arial', fill: 0xff1010}, this.container);

	// Health

	this.doRegenerate = function() {
		this.addHealth(this.stats.regenerate);
	};

	this.die = function(time) {
		respawned = false;
		this.sightCircle.radius = Local.shipSize;

		superUnit.die(time);
	};

	this.respawn = function() {
		respawned = true;
		this.container.cacheAsBitmap = false;
		this.healthContainer.visible = false;
		this.healthBar.visible = true;
		this.setBlocking(false);

		const spawnAt = player.spawnLocation();
		this.setLocation(spawnAt[0], spawnAt[1]);
	};

	this.reemerge = function() {
		this.updateHealth(this.stats.maxHealth);
		this.sightCircle.radius = this.sightSize;
		this.container.alpha = 1.0;
		this.healthContainer.visible = true;

		this.setAlive();
	};

	// Experience

	this.levelUp = function(over) {
		levelExp = over;
		++level;
		// nameText.text = player.name + ' [' + level+ ']'; //TODO

		const healthIncrease = statBase.maxHealth[1] * 1000;
		this.stats.maxHealth += healthIncrease;
		this.addHealth(healthIncrease);

		this.stats.regenerate += statBase.regenerate[1];
		this.stats.speed += statBase.speed[1];
		this.stats.damage += statBase.damage[1] * 1000;
		this.stats.sightRange += statBase.sightRange[1];
		this.stats.attackRange += statBase.attackRange[1];
		this.stats.attackCooldown += statBase.attackCooldown[1];

		this.stats.sightRangeCheck = Math.pow(this.stats.sightRange, 2);
		this.stats.attackRangeCheck = Math.pow(this.stats.attackRange, 2);

		this.updateHealth();
	};

	this.updateExperience = function() {
		const increment = this.isFiring() ? 3 : 2;
		levelExp += increment;
		const leveledOver = levelExp - expPerLevel;
		if (leveledOver >= 0) {
			this.levelUp(leveledOver);
		}
	};

	// Move

	this.requestedDestination = function(x, y) {
		x = Math.round(x * 1000);
		y = Math.round(y * 1000);
		const dx = x - this.px();
		const dy = y - this.py();
		if (dx == 0 && dy == 0) {
			return;
		}
		const moveAngle = Util.atan(dx, dy);
		const moveX = Math.round(Math.cos(moveAngle) * 1000);
		const moveY = Math.round(Math.sin(moveAngle) * 1000);

		return [x, y, moveX, moveY];
	};

	this.setDestination = function(x, y, moveX, moveY) {
		if (this.isDead()) {
			return false;
		}

		this.top.rotation.z = Util.atan(moveX, moveY);
		this.setMovePoint(x, y, moveX, moveY);
	};

	// Update

	this.update = function(renderTime, timeDelta, tweening) {
		if (!tweening) {
			if (this.isDead()) {
				if (this.timeOfDeath()) {
					const deathDuration = renderTime - this.timeOfDeath();
					if (deathDuration > waitToRespawn) {
						if (!respawned) {
							this.respawn();
						} else if (deathDuration > waitToRespawn + 1000 * level) {
							this.reemerge();
						}
					}
				}
			} else {
				this.updateExperience();
				this.doRegenerate();
			}
		}
	};

};

module.exports = Ship;
