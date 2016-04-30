'use strict';

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
	}

	// Position

	processDestination(x, y) {
		const dest = this.requestedDestination(x, y);
		this.setDestination(dest[0], dest[1], dest[2], dest[3]);
	}

	requestedDestination(x, y) {
		x = Math.round(x * 1000);
		y = Math.round(y * 1000);
		const dx = x - this.px;
		const dy = y - this.py;
		if (dx == 0 && dy == 0) {
			return null;
		}

		const moveAngle = Util.atan(dx, dy);
		const moveX = Math.round(Math.cos(moveAngle) * 1000);
		const moveY = Math.round(Math.sin(moveAngle) * 1000);
		return [x, y, moveX, moveY];
	}

	setDestination(x, y, moveX, moveY) {
		if (this.isDead) {
			return false;
		}

		this.top.rotation.z = Util.atan(moveX, moveY);
		this.isMoving = true;
		this.destX = x;
		this.destY = y;
		this.moveX = moveX;
		this.moveY = moveY;
	}

	updatePosition(moveToX, moveToY) {
		if (!moveToX) {
			moveToX = Math.round(this.px * 0.001);
			moveToY = Math.round(this.py * 0.001);
		} else {
			moveToX *= 0.001;
			moveToY *= 0.001;
		}
		this.container.position.x = moveToX;
		this.container.position.y = moveToY;
		this.healthContainer.position.x = moveToX;
		this.healthContainer.position.y = moveToY;
		// this.sightCircle.x = moveToX;
		// this.sightCircle.y = moveToY;
	}

	// Move

	reachedDestination() {

	}

	move(timeDelta, tweening) {
		let cx, cy;
		if (tweening) {
			const position = this.container.position;
			cx = Math.round(position.x * 1000);
			cy = Math.round(position.y * 1000);
		} else {
			cx = this.px;
			cy = this.py;
			if (this.moveToTarget && this.attackTarget) {
				if (this.canSee(this.attackTarget)) {
					if (this.inAttackRange(this.attackTarget)) {
						return true;
					}
					this.processDestination(this.attackTarget.px * 0.001, this.attackTarget.py * 0.001);
				} else {
					this.attackTarget = null;
					this.isMoving = false;
					return false;
				}
			}
		}
		const dx = Math.floor(this.moveX * this.stats.moveSpeed * timeDelta / 200);
		const dy = Math.floor(this.moveY * this.stats.moveSpeed * timeDelta / 200);

		let movingToX = cx + dx;
		let movingToY = cy + dy;
		if (tweening) {
			this.updatePosition(movingToX, movingToY);
		} else {
			const distX = this.destX - cx;
			const distY = this.destY - cy;
			let reached = true;
			if (Math.abs(distX) <= Math.abs(dx) || (distX < 0 ? dx > 0 : dx < 0)) {
				movingToX = this.destX;
			} else {
				reached = false;
			}
			if (Math.abs(distY) <= Math.abs(dy) || (distY < 0 ? dy > 0 : dy < 0)) {
				movingToY = this.destY;
			} else {
				reached = false;
			}
			if (reached) {
				this.isMoving = false;
				this.reachedDestination();
			}

			// Walls
			const walls = Local.game.map.blockCheck(movingToX, movingToY);
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
						if (rectanglesIntersecting(x, y, x + w, y + h, ux1, uy1, ux2, uy2)) {
							willBlock = true;
							break;
						}
					} else {
						const dist = Util.pointDistance(x, y, movingToX, movingToY);
						if (dist < 4000000000 && Util.withinSquared(dist, collisionSize + w)) {
							willBlock = true;
							break;
						}
					}
				}
			}

			//Units
			if (!willBlock) {
				const allUnits = Unit.all();
				for (let idx = 0; idx < allUnits.length; idx += 1) {
					const unit = allUnits[idx];
					if (unit.isBlocking && this.id != unit.id) {
						const dist = Util.pointDistance(movingToX, movingToY, unit.px, unit.py);
						if (dist < 4000000000 && Util.withinSquared(dist, collisionSize + unit.stats.collision)) {
							willBlock = true;
							break;
						}
					}
				}
			}

			// Move
			this.blocked = willBlock;
			if (!willBlock) {
				this.px = movingToX;
				this.py = movingToY;
			}
		}
		return this.isMoving;
	}

	die(time) {
		this.isMoving = false;

		super.die(time);
	}

}

module.exports = Movable;
