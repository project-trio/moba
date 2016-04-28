'use strict';

const Render = require('game/util/render');

const Movable = require('game/entity/unit/movable');
const Unit = require('game/entity/unit/unit');

//LOCAL

const waitToRespawn = 1990;
const expPerLevel = 600;

const SHIP_STATS = {
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

//CLASS

class Ship extends Movable {

	constructor(name, player, team, x, y, angle) {
		const statBase = SHIP_STATS[name] || SHIP_STATS['pewpew'];
		super(team, statBase, x, y, angle);

		Unit.addBase(this);

		this.statBase = statBase;
		this.id = player.id;
		this.player = player;
		// this.name = player.name;

		this.level = 1;
		this.levelExp = 0;
		this.respawned = false;

		// Unit

		const offset = name == 'roller' ? -19 : 0;

		Render.voxel(name, {parent: this.top, z: offset});

		// const base = Render.sprite('ship');
		// this.base.add(base);

		// const nameText = Render.text(player.name + ' [1]', 0, -Local.shipSize, {font: '13px Arial', fill: 0xff1010}, this.container);

	}

	// Health

	doRegenerate() {
		this.addHealth(this.stats.regenerate);
	}

	die(time) {
		this.respawned = false;
		this.isMoving = false;
		// this.sightCircle.radius = Local.shipSize;

		super.die(time);
	}

	respawn() {
		this.respawned = true;
		this.container.cacheAsBitmap = false;
		this.healthContainer.visible = false;
		this.healthBar.visible = true;
		this.isBlocking = false;

		const spawnAt = this.player.spawnLocation();
		this.setLocation(spawnAt[0], spawnAt[1]);
	}

	setAlive() {
		this.isDead = false;
		this.timeOfDeath = null;
		this.isBlocking = true;

		this.setTarget(null);
	}

	reemerge() {
		this.updateHealth(this.stats.maxHealth);
		// this.sightCircle.radius = this.sightSize;
		this.container.alpha = 1.0;
		this.healthContainer.visible = true;

		this.setAlive();
	}

	// Experience

	levelUp(over) {
		this.levelExp = over;
		++this.level;
		// nameText.text = player.name + ' [' + level+ ']'; //TODO

		const healthIncrease = this.statBase.maxHealth[1] * 1000;
		this.stats.maxHealth += healthIncrease;
		this.addHealth(healthIncrease);

		this.stats.regenerate += this.statBase.regenerate[1];
		this.stats.speed += this.statBase.speed[1];
		this.stats.damage += this.statBase.damage[1] * 1000;
		this.stats.sightRange += this.statBase.sightRange[1];
		this.stats.attackRange += this.statBase.attackRange[1];
		this.stats.attackCooldown += this.statBase.attackCooldown[1];

		this.stats.sightRangeCheck = Math.pow(this.stats.sightRange, 2);
		this.stats.attackRangeCheck = Math.pow(this.stats.attackRange, 2);

		this.updateHealth();
	}

	updateExperience() {
		const increment = this.isFiring ? 3 : 2;
		this.levelExp += increment;
		const leveledOver = this.levelExp - expPerLevel;
		if (leveledOver >= 0) {
			this.levelUp(leveledOver);
		}
	}

	// Update

	update(renderTime, timeDelta, tweening) {
		if (!tweening) {
			if (this.isDead) {
				if (this.timeOfDeath) {
					const deathDuration = renderTime - this.timeOfDeath;
					if (deathDuration > waitToRespawn) {
						if (!this.respawned) {
							this.respawn();
						} else if (deathDuration > waitToRespawn + 1000 * this.level) {
							this.reemerge();
						}
					}
				}
			} else {
				this.updateExperience();
				this.doRegenerate();
			}
		}
	}

	updateVisibility() {
		const units = Unit.all();
		for (let idx in units) {
			const unit = units[idx];
			let revealUnit = this.alliedTo(unit);
			if (!revealUnit) {
				const showing = this.canSee(unit);
				const updatedVisibility = unit.isRendering !== showing;
				if (updatedVisibility) {
					unit.isRendering = showing;
					unit.container.visible = showing || unit.renderInBackground || false;
					unit.healthContainer.visible = showing;
					// unit.sightCircle.visible = showing;
				}
				revealUnit = showing && (updatedVisibility || unit.isMoving);
			}
			if (revealUnit && unit.movable) {
				unit.updatePosition();
			}
		}
	}

}

module.exports = Ship;
