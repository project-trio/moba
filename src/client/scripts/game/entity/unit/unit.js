'use strict';

const Local = require('local');

const Util = require('game/util/util');
const Render = require('game/util/render');

//LOCAL

const allUnits = [];

let map;

//CONSTRUCTOR

const Unit = function(team, statBase, x, y, angle) {

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

	// Get/Set

	this.getTeam = function() {
		return team;
	};

	let isMoving = false;
	this.isMoving = function() {
		return isMoving;
	};
	this.setMoving = function(moving) {
		isMoving = moving;
	};

	let isDead = false;
	this.isDead = function() {
		return isDead;
	};

	let timeOfDeath = null;
	this.timeOfDeath = function() {
		return timeOfDeath;
	};

	this.setAlive = function() {
		isDead = false;
		timeOfDeath = null;
		isBlocking = true;
	};

	let isFiring = false;
	this.isFiring = function() {
		return isFiring;
	};
	this.setFiring = function(firing) {
		isFiring = firing;
	};

	let isBlocking = true;
	this.isBlocking = function() {
		return isBlocking;
	};
	this.setBlocking = function(blocking) {
		isBlocking = blocking;
	};

	let incomingAttackers = 0;
	this.incoming = function(increment) {
		incomingAttackers += increment;
	};

	// Sight

	let allied = this.getTeam() == Local.player.team;
	let sightRadius = allied ? this.stats.sightRange * 0.001 : Local.shipSize;
	this.sightCircle = {x: 0, y: 0, radius: sightRadius, visible: allied};
	this.sightSize = sightRadius;

	let isRendering;
	this.isRendering = function() {
		return isRendering;
	};
	this.setRendering = function(rendering) {
		isRendering = rendering;
	};

	let px, py;

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

	map = Local.game.map;
	map.addHealthbar(this.healthContainer);

	// Geometry

	this.setLocation = function(x, y) {
		px = x * 1000;
		py = y * 1000;
		this.container.position.set(x, y, 0);
		this.sightCircle.x = x;
		this.sightCircle.y = y;
		this.healthContainer.position.x = x;
		this.healthContainer.position.y = y;

		const angle = -Math.PI * 1.5 * (team == 0 ? -1 : 1);
		this.base.rotation.z = angle;
		this.top.rotation.z = angle;
	};
	this.setLocation(x, y);
	map.addSight(this.sightCircle);

	this.px = function() {
		return px;
	};

	this.py = function() {
		return py;
	};

	const pointDistance = function(x1, y1, x2, y2) {
		return Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
	};

	const distanceTo = function(enemy) {
		return pointDistance(px, py, enemy.px(), enemy.py());
	};

	// Health

	this.hasDied = function() {
		return this.stats.health <= 0;
	};

	this.updateHealth = function(newHealth) {
		if (newHealth != null) {
			this.stats.health = newHealth;
		} else {
			newHealth = this.stats.health;
		}
		const healthScale = newHealth / this.stats.maxHealth;
		this.healthBar.scale.x = healthScale;
		this.healthBar.position.x = -32 * healthScale + 32;
	};

	this.destroy = function() {
		parent.remove(this.container);
		// container.destroy(true);
		this.container = null;
	};

	// Attack

	let lastAttack = 0;
	let attackTarget;

	this.setTarget = function(target) {
		if (target) {
			if (attackTarget != target) {
				target.incoming(1);
			}
		} else if (attackTarget) {
			attackTarget.incoming(-1);
		}
		attackTarget = target;
	};

	this.activeFire = function() {
		return isFiring || incomingAttackers > 0;
	};

	this.alliedTo = function(target) {
		return team == target.getTeam();
	};

	this.canSee = function(enemy) {
		return enemy.isDead() || enemy.activeFire() || distanceTo(enemy) < this.stats.sightRangeCheck;
	};

	this.canAttack = function(enemy) {
		return !enemy.hasDied() && !this.alliedTo(enemy) && distanceTo(enemy) < this.stats.attackRangeCheck;
	};

	this.die = function(time) {
		timeOfDeath = time;
		isDead = true;
		isMoving = false;
		this.healthBar.visible = false;
		this.setTarget(null);
	};

	this.addHealth = function(addedHealth) {
		if (this.stats.health == this.stats.maxHealth) {
			return;
		}

		let newHealth = this.stats.health + addedHealth;
		if (newHealth > this.stats.maxHealth) {
			newHealth = this.stats.maxHealth;
		}
		this.updateHealth(newHealth);
	};

	this.doDamage = function(amount) {
		let newHealth = this.stats.health - amount;
		if (newHealth < 0) {
			newHealth = 0;
		}
		this.updateHealth(newHealth);
	};

	this.attack = function(enemy, renderTime) {
		lastAttack = renderTime;
		enemy.doDamage(this.stats.damage);
	};

	this.checkAttack = function(renderTime) {
		if (renderTime - lastAttack > this.stats.attackCooldown * 100) {
			let attackForTick;
			if (attackTarget) {
				if (this.canAttack(attackTarget)) {
					attackForTick = attackTarget;
				} else {
					this.setTarget(null);
				}
			}
			if (!attackForTick) {
				for (let unitIdx in allUnits) {
					const enemy = allUnits[unitIdx];
					if (this.canAttack(enemy)) {
						attackForTick = enemy;
						if (!attackTarget) {
							this.setTarget(attackForTick);
						}
						break;
					}
				}
			}
			isFiring = attackForTick != null;
			if (attackForTick) {
				this.attack(attackForTick, renderTime);
			}
		}
	};

	// Update

	let destX, destY, moveX, moveY;

	this.updatePosition = function(moveToX, moveToY) {
		if (!moveToX) {
			moveToX = Math.round(this.px() * 0.001);
			moveToY = Math.round(this.py() * 0.001);
		} else {
			moveToX *= 0.001;
			moveToY *= 0.001;
		}
		this.container.position.x = moveToX;
		this.container.position.y = moveToY;
		this.healthContainer.position.x = moveToX;
		this.healthContainer.position.y = moveToY;
		this.sightCircle.x = moveToX;
		this.sightCircle.y = moveToY;
	};

	const within = function(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
		return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
	};

	this.move = function(timeDelta, tweening) {
		let cx, cy;
		if (tweening) {
			const position = this.container.position;
			cx = Math.round(position.x * 1000);
			cy = Math.round(position.y * 1000);
		} else {
			cx = px;
			cy = py;
		}
		const dx = Math.floor(moveX * this.stats.speed * timeDelta / 200);
		const dy = Math.floor(moveY * this.stats.speed * timeDelta / 200);

		let movingToX = cx + dx;
		let movingToY = cy + dy;
		if (tweening) {
			this.updatePosition(movingToX, movingToY);
		} else {
			const distX = destX - cx;
			const distY = destY - cy;
			let reached = false;
			if (Math.abs(distX) <= Math.abs(dx) || (distX < 0 ? dx > 0 : dx < 0)) {
				movingToX = destX;
				reached = true;
			}
			if (Math.abs(distY) <= Math.abs(dy) || (distY < 0 ? dy > 0 : dy < 0)) {
				movingToY = destY;
			} else {
				reached = false;
			}
			if (reached) {
				isMoving = false;
			}

			// Walls
			const walls = map.blockCheck(movingToX, movingToY);
			let willBlock = walls == null;
			const collisionSize = this.stats.collision;
			if (!willBlock) {
				const ux1 = movingToX - collisionSize * 0.5;
				const uy1 = movingToY - collisionSize * 0.5;
				const ux2 = ux1 + collisionSize;
				const uy2 = uy1 + collisionSize;
				for (let idx in walls) {
					const wall = walls[idx];
					const x = wall[0];
					const y = wall[1];
					const w = wall[2];
					const h = wall[3];
					if (h) {
						if (within(x, y, x + w, y + h, ux1, uy1, ux2, uy2)) {
							willBlock = true;
							break;
						}
					} else {
						const dist = pointDistance(x, y, movingToX, movingToY);
						if (dist < 4000000000 && dist < Math.pow(collisionSize + w, 2)) {
							willBlock = true;
							break;
						}
					}
				}
			}

			//Units
			if (!willBlock) {
				for (let idx in allUnits) {
					const unit = allUnits[idx];
					if (unit.isBlocking() && this.id != unit.id) {
						const dist = pointDistance(movingToX, movingToY, unit.px(), unit.py());
						if (dist < 4000000000 && dist < Math.pow(collisionSize + unit.stats.collision, 2)) {
							willBlock = true;
							break;
						}
					}
				}
			}

			// Move
			this.blocked = willBlock;
			if (!willBlock) {
				px = movingToX;
				py = movingToY;
			}
		}
	};

	// Move

	this.setMovePoint = function(_destX, _destY, _moveX, _moveY) {
		isMoving = true;
		destX = _destX;
		destY = _destY;
		moveX = _moveX;
		moveY = _moveY;
	};

	this.setDestination = function(x, y, moveX, moveY) {
		if (this.isDead()) {
			return false;
		}

		this.top.rotation.z = Util.atan(moveX, moveY);
		this.setMovePoint(x, y, moveX, moveY);
	};

	this.requestedDestination = function(x, y) {
		x = Math.round(x * 1000);
		y = Math.round(y * 1000);
		const dx = x - this.px();
		const dy = y - this.py();
		if (dx == 0 && dy == 0) {
			return null;
		}

		const moveAngle = Util.atan(dx, dy);
		const moveX = Math.round(Math.cos(moveAngle) * 1000);
		const moveY = Math.round(Math.sin(moveAngle) * 1000);
		return [x, y, moveX, moveY];
	};

	this.updateVisibility = function() {
		for (let idx in allUnits) {
			const unit = allUnits[idx];
			let updatesPosition = this.alliedTo(unit);
			if (!updatesPosition) {
				const showing = this.canSee(unit);
				const updatedVisibility = unit.isRendering() !== showing;
				if (updatedVisibility) {
					unit.setRendering(showing);
					unit.container.visible = showing || unit.renderInBackground || false;
					unit.healthContainer.visible = showing;
					unit.sightCircle.visible = showing;
				}
				updatesPosition = showing && (updatedVisibility || unit.isMoving());
			}
			if (updatesPosition) {
				unit.updatePosition();
			}
		}
	};

};

//PUBLIC

Unit.addBase = function(unit) {
	allUnits.push(unit);
};

Unit.remove = function(unit) {
	allUnits.splice(allUnits.indexOf(unit));
};

Unit.update = function(renderTime, timeDelta, tweening) {
	for (let idx in allUnits) {
		const unit = allUnits[idx];
		if (tweening && (!unit.isRendering() || unit.blocked)) {
			continue;
		}
		if (unit.isMoving()) {
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
			if (!unit.isDead()) {
				unit.checkAttack(renderTime);
			}
		}
		// Die
		for (let idx in allUnits) {
			const unit = allUnits[idx];
			if (unit.hasDied() && !unit.isDead()) {
				unit.die(renderTime);
			}
		}
	}
};

module.exports = Unit;
