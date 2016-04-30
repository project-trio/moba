'use strict';

const Local = require('local');

const Util = require('game/util/util');
const Render = require('game/util/render');

//LOCAL

const allUnits = [];

//CLASS

class Unit {

	// Constructor

	constructor(team, statBase, x, y, startAngle) {
		this.team = team;
		this.startAngle = startAngle;

		this.container = Render.group();
		this.base = Render.group();
		this.top = Render.group();

		this.container.add(this.base);
		this.container.add(this.top);
		Local.game.map.floorContainer.add(this.container);

		// Stats

		this.stats = {
			healthMax: statBase.healthMax[0] * 1000,
			healthRegen: statBase.healthRegen[0],

			sightRange: statBase.sightRange[0] * 1000,
			attackRange: statBase.attackRange[0] * 1000,

			attackDamage: statBase.attackDamage[0] * 1000,
			attackCooldown: statBase.attackCooldown[0],

			moveSpeed: statBase.moveSpeed[0],
			collision: statBase.collision * 1000,
		};
		this.stats.health = this.stats.healthMax;
		this.stats.sightRangeCheck = Util.squared(this.stats.sightRange);
		this.stats.attackRangeCheck = Util.squared(this.stats.attackRange);
		// this.stats.collisionCheck = Util.squared(this.stats.collision);

		this.incomingAttackers = 0;
		this.lastAttack = 0;

		// Sight

		// let allied = this.team == Local.player.team;
		// let sightRadius = allied ? this.stats.sightRange * 0.001 : Local.shipSize;
		// this.sightCircle = {x: 0, y: 0, radius: sightRadius, visible: allied};
		// this.sightSize = sightRadius;
		// Local.game.map.addSight(this.sightCircle);

		// Health Bar

		const hpOffsetY = -40;
		const hpOffsetZ = 60;
		const hpWidth = 64;
		const hpHeight = 4;
		const outlineWeight = 1;
		const hpRadius = 3;

		this.healthContainer = Render.group();

		Render.rectangle(0, hpOffsetY, hpWidth, hpHeight, { // HP Backing
			color: 0xFF3333,
			strokeWidth: outlineWeight,
			strokeColor: 0xFFFFFF,
			radius: hpRadius,
			z: hpOffsetZ,
			parent: this.healthContainer,
		});

		this.healthBar = Render.rectangle(0, hpOffsetY, hpWidth, hpHeight, {
			color: 0x33FF99,
			radius: hpRadius+2,
			z: hpOffsetZ,
			parent: this.healthContainer,
		});

		Local.game.map.addHealthbar(this.healthContainer);

		// Start location

		if (x) {
			this.setLocation(x, y);
		}
	}

	// Geometry

	setLocation(x, y) {
		this.px = x * 1000;
		this.py = y * 1000;
		this.container.position.set(x, y, 0);
		// this.sightCircle.x = x;
		// this.sightCircle.y = y;
		this.healthContainer.position.x = x;
		this.healthContainer.position.y = y;

		const angle = this.startAngle || (-Math.PI * 1.5 * (this.team == 0 ? -1 : 1));
		this.base.rotation.z = angle;
		this.top.rotation.z = angle;
	}

	distanceTo(enemy) {
		return Util.pointDistance(this.px, this.py, enemy.px, enemy.py);
	}

	// Health

	hasDied() {
		return this.stats.health <= 0;
	}

	updateHealth(newHealth) {
		if (newHealth != null) {
			this.stats.health = newHealth;
		} else {
			newHealth = this.stats.health;
		}
		const healthScale = newHealth / this.stats.healthMax;
		this.healthBar.scale.x = healthScale;
		this.healthBar.position.x = -32 * healthScale + 32;
	}

	addHealth(addedHealth) {
		if (this.stats.health == this.stats.healthMax) {
			return;
		}

		const newHealth = Math.min(this.stats.health + addedHealth, this.stats.healthMax);
		this.updateHealth(newHealth);
	}

	doDamage(amount) {
		const newHealth = Math.max(this.stats.health - amount, 0);
		this.updateHealth(newHealth);
	}

	die(time) {
		this.isDead = true;
		this.timeOfDeath = time;
		this.healthBar.visible = false;
	}

	destroy() {
		Render.remove(this.healthContainer);
		Render.remove(this.container);
		this.remove = true;
	}

	// Attack

	incoming(increment) {
		this.incomingAttackers += increment;
	}

	setTarget(target) {
		if (target) {
			if (this.attackTarget != target) {
				target.incoming(1);
			}
		} else if (this.attackTarget) {
			this.attackTarget.incoming(-1);
		}
		this.attackTarget = target;
	}

	hasActiveFire() {
		return this.isFiring || this.incomingAttackers > 0;
	}

	alliedTo(target) {
		return this.team == target.team;
	}

	canSee(enemy) {
		return enemy.isDead || enemy.hasActiveFire() || this.distanceTo(enemy) < this.stats.sightRangeCheck;
	}

	canAttack(enemy) {
		return !enemy.hasDied() && !this.alliedTo(enemy) && this.distanceTo(enemy) < this.stats.attackRangeCheck;
	}

	attack(enemy, renderTime) {
		this.lastAttack = renderTime;
		enemy.doDamage(this.stats.attackDamage);
	}

	readyToAttack(renderTime) {
		return renderTime - this.lastAttack > this.stats.attackCooldown * 100;
	}

	getAttackTarget() {
		if (this.attackTarget) {
			if (this.canAttack(this.attackTarget)) {
				return this.attackTarget;
			}
			this.setTarget(null);
		}
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const enemy = allUnits[idx];
			if (this.canAttack(enemy)) {
				if (!this.attackTarget) {
					this.setTarget(enemy);
				}
				return enemy;
			}
		}
	}

	checkAttack(renderTime) {
		let attackForTick = this.getAttackTarget();
		this.isFiring = attackForTick != null;
		if (attackForTick) {
			this.attack(attackForTick, renderTime);
		}
	}

}

//STATIC

Unit.all = function() {
	return allUnits;
};

Unit.addBase = function(unit) {
	allUnits.push(unit);
};

Unit.update = function(renderTime, timeDelta, tweening) {
	for (let idx = 0; idx < allUnits.length; idx += 1) {
		const unit = allUnits[idx];
		if (tweening && (!unit.isRendering || unit.blocked)) {
			continue;
		}
		if (unit.isMoving) {
			unit.move(timeDelta, tweening);
		}
	}
	if (!tweening) {
		// Move
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx];
			if (unit.update) {
				unit.update(renderTime, timeDelta, tweening);
			}
		}
		// Attack
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx];
			if (!unit.isDead && unit.readyToAttack(renderTime)) {
				unit.checkAttack(renderTime);
			}
		}
		// Die
		for (let idx = allUnits.length - 1; idx >= 0; idx -= 1) {
			const unit = allUnits[idx];
			if (unit.hasDied() && !unit.isDead) {
				unit.die(renderTime);
				if (unit.remove) {
					allUnits.splice(idx, 1);
				}
			}
		}
	}
};

module.exports = Unit;
