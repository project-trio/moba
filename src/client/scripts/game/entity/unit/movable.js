'use strict';

const TrigCache = require('external/trigcache');

const Local = require('local');

const Util = require('game/util/util');

const Unit = require('game/entity/unit/unit');

const rectanglesIntersecting = function(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
};

//CLASS

class Movable extends Unit {

	constructor(team, statBase, x, y, startAngle) {
		super(team, statBase, x, y, startAngle);

		this.movable = true;
		this.moveToTarget = false;
	}

	// Position

	setDestination(x, y, preadjusted) {
		if (!preadjusted) {
			x *= 100;
			y *= 100;
		}
		const dx = x - this.px;
		const dy = y - this.py;
		const moveAngle = Util.angleOf(dx, dy, false);
		this.top.rotation.z = Math.atan2(dy, dx);

		this.destX = x;
		this.destY = y;
		this.moveX = TrigCache.cos(moveAngle);
		this.moveY = TrigCache.sin(moveAngle);
		this.isMoving = true;
		this.setTarget(null);
	}

	updatePosition(moveToX, moveToY) {
		if (!moveToX) {
			moveToX = this.px;
			moveToY = this.py;
		}
		moveToX /= 100;
		moveToY /= 100;
		this.container.position.x = moveToX;
		this.container.position.y = moveToY;
		this.healthContainer.position.x = moveToX;
		this.healthContainer.position.y = moveToY;
		// this.sightCircle.x = moveToX;
		// this.sightCircle.y = moveToY;
	}

	// Move

	blocked(bx, by) {
		if (!bx) {
			bx = this.px;
			by = this.py;
		}

		// Walls
		const walls = Local.game.map.blockCheck(bx, by);
		const collisionSize = this.stats.collision;
		if (walls) {
			const ux1 = bx - collisionSize * 0.5;
			const uy1 = by - collisionSize * 0.5;
			const ux2 = ux1 + collisionSize;
			const uy2 = uy1 + collisionSize;
			for (let idx = 0; idx < walls.length; idx += 1) {
				const wall = walls[idx];
				const x = wall[0];
				const y = wall[1];
				const w = wall[2];
				const h = wall[3];
				if (h) {
					if (rectanglesIntersecting(x, y, x + w, y + h, ux1, uy1, ux2, uy2)) {
						return true;
					}
				} else {
					const dist = Util.pointDistance(x, y, bx, by);
					if (Util.withinSquared(dist, collisionSize + w)) {
						return true;
					}
				}
			}
		}

		// Units
		const allUnits = Unit.all();
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx];
			if (unit.isBlocking && this.id != unit.id) {
				const dist = Util.pointDistance(bx, by, unit.px, unit.py);
				if (Util.withinSquared(dist, collisionSize + unit.stats.collision)) {
					return true;
				}
			}
		}
	}

	shouldMove() {
		return this.isMoving;
	}

	reachedDestination(needsNewDestination) {
		this.isMoving = false;
	}

	updateMoveTarget() {
		if (this.attackTarget && this.moveToTarget) {
			if (this.canSee(this.attackTarget)) {
				this.isAttackingTarget = this.inAttackRange(this.attackTarget);
				if (!this.isAttackingTarget) {
					this.setDestination(this.attackTarget.px, this.attackTarget.py, true);
				}
			} else {
				this.setTarget(null);
				this.reachedDestination(false);
			}
		}
	}

	move(timeDelta, tweening) {
		if (this.isAttackingTarget) {
			return;
		}

		let cx, cy;
		let movingX, movingY;
		let moveSpeed;
		if (tweening) {
			cx = this.container.position.x * 100;
			cy = this.container.position.y * 100;
			moveSpeed = this.currentSpeed;
		} else {
			cx = this.px;
			cy = this.py;
			moveSpeed = this.stats.moveSpeed / 200;
			if (this.isDead) {
				moveSpeed *= 0.5;
			}
			this.currentSpeed = moveSpeed;
		}
		moveSpeed *= timeDelta;
		movingX = this.moveX * moveSpeed;
		movingY = this.moveY * moveSpeed;

		let movingToX = cx + movingX;
		let movingToY = cy + movingY;
		if (tweening) {
			this.updatePosition(movingToX, movingToY);
		} else {
			const distX = this.destX - cx;
			const distY = this.destY - cy;
			let reached = false;
			const absMovingX = Math.abs(movingX);
			const absMovingY = Math.abs(movingY);
			if (Math.abs(distX) <= absMovingX || (distX < 0 ? movingX > 0 : movingX < 0)) {
				if (absMovingX >= absMovingY) {
					reached = true;
				}
			}
			if (Math.abs(distY) <= absMovingY || (distY < 0 ? movingY > 0 : movingY < 0)) {
				if (absMovingY >= absMovingX) {
					reached = true;
				}
			}
			if (reached) {
				this.reachedDestination(true);
			}

			this.isBlocked = this.blocked(movingToX, movingToY);
			if (!this.isBlocked) {
				this.px = movingToX;
				this.py = movingToY;
				this.updatePosition(movingToX, movingToY);
			}
		}
	}

	die(time) {
		this.isMoving = false;

		super.die(time);
	}

}

module.exports = Movable;
