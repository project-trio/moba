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
			level: 1,
			maxHealth: statBase.maxHealth[0] * 1000,
			regenerate: statBase.regenerate[0],
			speed: statBase.speed[0],
			damage: statBase.damage[0] * 1000,
			sightRange: statBase.sightRange[0] * 1000,
			attackRange: statBase.attackRange[0] * 1000,
			attackCooldown: statBase.attackCooldown[0],
			collision: statBase.collision * 1000
		};
		this.stats.health = this.stats.maxHealth;
		this.stats.sightRangeCheck = Math.pow(this.stats.sightRange, 2);
		this.stats.attackRangeCheck = Math.pow(this.stats.attackRange, 2);
		// this.stats.collisionCheck = Math.pow(this.stats.collision, 2);

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

		const angle = this.startAngle || -Math.PI * 1.5 * (this.team == 0 ? -1 : 1);
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
		const healthScale = newHealth / this.stats.maxHealth;
		this.healthBar.scale.x = healthScale;
		this.healthBar.position.x = -32 * healthScale + 32;
	}

	destroy() {
		parent.remove(this.container);
		// container.destroy(true);
		this.container = null;
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

	activeFire() {
		return this.isFiring || this.incomingAttackers > 0;
	}

	alliedTo(target) {
		return this.team == target.team;
	}

	canSee(enemy) {
		return enemy.isDead || enemy.activeFire() || this.distanceTo(enemy) < this.stats.sightRangeCheck;
	}

	canAttack(enemy) {
		return !enemy.hasDied() && !this.alliedTo(enemy) && this.distanceTo(enemy) < this.stats.attackRangeCheck;
	}

	die(time) {
		this.isDead = true;
		this.timeOfDeath = time;
		this.healthBar.visible = false;
	}

	addHealth(addedHealth) {
		if (this.stats.health == this.stats.maxHealth) {
			return;
		}

		let newHealth = this.stats.health + addedHealth;
		if (newHealth > this.stats.maxHealth) {
			newHealth = this.stats.maxHealth;
		}
		this.updateHealth(newHealth);
	}

	doDamage(amount) {
		let newHealth = this.stats.health - amount;
		if (newHealth < 0) {
			newHealth = 0;
		}
		this.updateHealth(newHealth);
	}

	attack(enemy, renderTime) {
		this.lastAttack = renderTime;
		enemy.doDamage(this.stats.damage);
	}

	checkAttack(renderTime) {
		if (renderTime - this.lastAttack > this.stats.attackCooldown * 100) {
			let attackForTick;
			if (this.attackTarget) {
				if (this.canAttack(this.attackTarget)) {
					attackForTick = this.attackTarget;
				} else {
					this.setTarget(null);
				}
			}
			if (!attackForTick) {
				for (let unitIdx in allUnits) {
					const enemy = allUnits[unitIdx];
					if (this.canAttack(enemy)) {
						attackForTick = enemy;
						if (!this.attackTarget) {
							this.setTarget(attackForTick);
						}
						break;
					}
				}
			}
			this.isFiring = attackForTick != null;
			if (attackForTick) {
				this.attack(attackForTick, renderTime);
			}
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

Unit.remove = function(unit) {
	allUnits.splice(allUnits.indexOf(unit));
};

Unit.update = function(renderTime, timeDelta, tweening) {
	for (let idx in allUnits) {
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
		for (let idx in allUnits) {
			const unit = allUnits[idx];
			if (unit.update) {
				unit.update(renderTime, timeDelta, tweening);
			}
		}
		// Attack
		for (let idx in allUnits) {
			const unit = allUnits[idx];
			if (!unit.isDead) {
				unit.checkAttack(renderTime);
			}
		}
		// Die
		for (let idx in allUnits) {
			const unit = allUnits[idx];
			if (unit.hasDied() && !unit.isDead) {
				unit.die(renderTime);
			}
		}
	}
};

module.exports = Unit;
