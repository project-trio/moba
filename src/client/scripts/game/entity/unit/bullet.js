'use strict';

const Decimal = require('decimal.js');
const TrigCache = require('external/trigcache');

const Local = require('local');

const Render = require('render/render');

const Util = require('game/util');

//LOCAL

const POSITION_MAGNITUDE_OFFSET = 100;

const allBullets = [];

//CLASS

class Bullet {

	// Constructor

	constructor(source, target, x, y, startAngle) {
		this.source = source;
		this.target = target;

		this.container = Render.group();
		const ball = Render.sphere(source.stats.bulletSize, {color: (source.stats.bulletColor || 0x000000)});
		this.container.add(ball);
		Local.game.map.floorContainer.add(this.container);

		this.damage = source.stats.attackDamage;
		this.moveConstant = new Decimal(source.stats.attackMoveSpeed).dividedBy(500);

		this.setLocation(x, y, startAngle);
		this.setDestination(this.target.px, this.target.py, true);

		allBullets.push(this);
	}

	// Geometry

	setLocation(x, y, angle) {
		this.px = x;
		this.py = y;
		this.container.position.set(x, y, 0);
		if (angle) {
			this.container.rotation.z = angle;
		}
	}

	// Move

	setDestination(x, y, preadjusted, moveX, moveY) {
		if (!preadjusted) {
			x *= POSITION_MAGNITUDE_OFFSET;
			y *= POSITION_MAGNITUDE_OFFSET;
		}

		const dx = x - this.px;
		const dy = y - this.py;
		if (moveX === undefined) {
			if (dx !== 0 || dy !== 0) {
				const moveAngle = Util.angleOf(dx, dy, false);
				this.aimTargetAngle = moveAngle.toNumber() / 1000;
				moveX = TrigCache.cos(moveAngle);
				moveY = TrigCache.sin(moveAngle);
			} else { //TODO workaround
				moveX = 0;
				moveY = 0;
				console.warn('Bullet at destination', this.px, this.py);
			}
		} else {
			this.aimTargetAngle = Math.atan2(dy, dx);
		}
		this.moveX = moveX;
		this.moveY = moveY;
		this.destX = x;
		this.destY = y;
	}

	updatePosition(moveToX, moveToY) {
		if (!moveToX) {
			moveToX = this.px;
			moveToY = this.py;
		}
		moveToX /= POSITION_MAGNITUDE_OFFSET;
		moveToY /= POSITION_MAGNITUDE_OFFSET;
		this.container.position.x = moveToX;
		this.container.position.y = moveToY;
	}

	reachedDestination() {
		this.target.doDamage(this.damage);
		this.destroy();
	}

	destroy() {
		Render.remove(this.container);
		this.remove = true;
	}

	distanceToTarget() {
		return Util.pointDistance(this.px, this.py, this.target.px, this.target.py);
	}

	move(timeDelta, tweening) {
		let cx, cy;
		let moveByX, moveByY;
		if (tweening) {
			cx = this.container.position.x * POSITION_MAGNITUDE_OFFSET;
			cy = this.container.position.y * POSITION_MAGNITUDE_OFFSET;

			const tweenScalar = this.currentSpeed * timeDelta;
			moveByX = tweenScalar * this.moveX;
			moveByY = tweenScalar * this.moveY;
		} else {
			cx = this.px;
			cy = this.py;

			// Cache
			const moveSpeed = this.moveConstant;
			this.currentSpeed = moveSpeed.toNumber();

			const moveScalar = moveSpeed.times(timeDelta);
			moveByX = moveScalar.times(this.moveX).round().toNumber();
			moveByY = moveScalar.times(this.moveY).round().toNumber();
		}

		let movingToX = cx + moveByX;
		let movingToY = cy + moveByY;
		if (tweening) {
			this.updatePosition(movingToX, movingToY);
		} else {
			const distX = this.destX - cx;
			const distY = this.destY - cy;
			const collisionSize = this.target.stats.collision;
			let reachedApproximate = false;
			if (Math.abs(distX) < collisionSize && Math.abs(distY) < collisionSize) {
				reachedApproximate = Util.withinSquared(this.distanceToTarget(), collisionSize);
			}
			if (reachedApproximate) {
				this.reachedDestination();
			} else {
				this.px = movingToX;
				this.py = movingToY;
				this.updatePosition(movingToX, movingToY);
			}
		}
	}

	// Aim

	updateAim() {
		this.aimTargetAngle = Util.angleBetween(this, this.target, true);
		this.container.rotation.z = this.aimTargetAngle;
	}

}

//STATIC

Bullet.all = function() {
	return allBullets;
};

Bullet.update = function(renderTime, timeDelta, tweening) {
	// Move
	for (let idx = 0; idx < allBullets.length; idx += 1) {
		const bullet = allBullets[idx];
		bullet.updateAim();
		bullet.move(timeDelta, tweening);
	}

	if (!tweening) {
		// Update
		for (let idx = 0; idx < allBullets.length; idx += 1) {
			const bullet = allBullets[idx];
			if (bullet.remove) {
				allBullets.splice(idx, 1);
				idx -= 1;
			}
		}
		// Update
		for (let idx = 0; idx < allBullets.length; idx += 1) {
			const bullet = allBullets[idx];
			bullet.setDestination(bullet.target.px, bullet.target.py, true);
		}
	}
};

module.exports = Bullet;
