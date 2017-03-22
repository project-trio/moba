// import Decimal from 'decimal.js'
import TrigCache from '@/play/external/trigcache'

import Local from '@/play/local'

import Util from '@/play/game/util'

import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const POSITION_MAGNITUDE_OFFSET = 100

const rectanglesIntersecting = function (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
}

//CLASS

class Movable extends Unit {

	constructor (team, statBase, unitScale, x, y, startAngle) {
		super(team, statBase, unitScale, x, y, startAngle)

		this.movable = true
		this.moveToTarget = false
	}

	// Position

	setDestination (x, y, preadjusted, moveX, moveY) {
		if (!preadjusted) {
			x *= POSITION_MAGNITUDE_OFFSET
			y *= POSITION_MAGNITUDE_OFFSET
		}

		const dx = x - this.px
		const dy = y - this.py
		if (moveX === undefined) {
			if (dx !== 0 || dy !== 0) {
				const moveAngle = Util.angleOf(dx, dy, false)
				this.aimTargetAngle = moveAngle.toNumber() / 1000
				moveX = TrigCache.cos(moveAngle)
				moveY = TrigCache.sin(moveAngle)
			} else {
				moveX = 0
				moveY = 0
				console.warn('Moveable at destination', this.px, this.py)
			}
		} else {
			this.aimTargetAngle = Math.atan2(dy, dx)
		}
		this.moveX = moveX
		this.moveY = moveY
		this.destX = x
		this.destY = y

		this.isMoving = true
		this.setTarget(null)
	}

	updatePosition (moveToX, moveToY) {
		if (!moveToX) {
			moveToX = this.px
			moveToY = this.py
		}
		moveToX /= POSITION_MAGNITUDE_OFFSET
		moveToY /= POSITION_MAGNITUDE_OFFSET
		this.container.position.x = moveToX
		this.container.position.y = moveToY
		this.infoContainer.position.x = moveToX
		this.infoContainer.position.y = moveToY
	}

	// Move

	blocked (bx, by) {
		if (!bx) {
			bx = this.px
			by = this.py
		}

		// Walls
		const walls = Local.game.map.blockCheck(bx, by)
		const collisionSize = this.stats.collision
		if (walls) {
			const ux1 = bx - collisionSize * 0.5
			const uy1 = by - collisionSize * 0.5
			const ux2 = ux1 + collisionSize
			const uy2 = uy1 + collisionSize
			for (let idx = 0; idx < walls.length; idx += 1) {
				const wall = walls[idx]
				const wx = wall[0]
				const wy = wall[1]
				const ww = wall[2]
				const wh = wall[3]
				if (wh) {
					if (rectanglesIntersecting(wx, wy, wx + ww, wy + wh, ux1, uy1, ux2, uy2)) {
						return true
					}
				} else {
					const dist = Util.pointDistance(wx, wy, bx, by)
					if (Util.withinSquared(dist, collisionSize + ww)) {
						return true
					}
				}
			}
		}

		// Units
		const allUnits = Unit.all()
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx]
			if (unit.isBlocking && this.id != unit.id) {
				const dist = Util.pointDistance(bx, by, unit.px, unit.py)
				if (Util.withinSquared(dist, collisionSize + unit.stats.collision)) {
					return true
				}
			}
		}
	}

	shouldMove () {
		return this.isMoving
	}

	reachedDestination (needsNewDestination) {
		this.isMoving = false
	}

	updateMoveTarget () {
		if (this.attackTarget && this.moveToTarget) {
			if (this.targetableStatus(this.attackTarget) && this.canSee(this.attackTarget)) {
				this.isAttackingTarget = this.inAttackRange(this.attackTarget)
				if (!this.isAttackingTarget) {
					this.setDestination(this.attackTarget.px, this.attackTarget.py, true)
				}
			} else {
				this.setTarget(null)
				this.reachedDestination(false)
			}
			return true
		}
	}

	calculateMoveSpeed () {
		let moveSpeed = this.moveConstant
		if (this.isDead) {
			return moveSpeed.dividedBy(2)
		}
		if (this.moveSpeedModifier) {
			return moveSpeed.times(this.moveSpeedModifier)
		}
		return moveSpeed
	}

	move (timeDelta, tweening) {
		if (this.isAttackingTarget) {
			return
		}

		let cx, cy
		let moveByX, moveByY
		if (tweening) {
			cx = this.container.position.x * POSITION_MAGNITUDE_OFFSET
			cy = this.container.position.y * POSITION_MAGNITUDE_OFFSET

			const tweenScalar = this.currentSpeed * timeDelta
			moveByX = tweenScalar * this.moveX
			moveByY = tweenScalar * this.moveY
		} else {
			cx = this.px
			cy = this.py

			// Cache
			const moveSpeed = this.calculateMoveSpeed()
			this.currentSpeed = moveSpeed.toNumber()

			const moveScalar = moveSpeed.times(timeDelta)
			moveByX = moveScalar.times(this.moveX).round().toNumber()
			moveByY = moveScalar.times(this.moveY).round().toNumber()
		}

		let movingToX = cx + moveByX
		let movingToY = cy + moveByY
		if (tweening) {
			this.updatePosition(movingToX, movingToY)
		} else {
			// Blocked
			this.isBlocked = this.blocked(movingToX, movingToY)
			if (this.isBlocked) {
				return
			}

			// Destination
			const distX = this.destX - cx
			const distY = this.destY - cy
			let reachedApproximate = false
			const absMovingX = Math.abs(moveByX)
			const absMovingY = Math.abs(moveByY)
			if (Math.abs(distX) <= absMovingX || (distX < 0 ? moveByX > 0 : moveByX < 0)) {
				if (absMovingX >= absMovingY) {
					reachedApproximate = true
				}
			}
			if (Math.abs(distY) <= absMovingY || (distY < 0 ? moveByY > 0 : moveByY < 0)) {
				if (absMovingY >= absMovingX) {
					reachedApproximate = true
				}
			}
			if (reachedApproximate) {
				movingToX = this.destX
				movingToY = this.destY
			}

			this.px = movingToX
			this.py = movingToY
			this.updatePosition(movingToX, movingToY)

			if (reachedApproximate) {
				this.reachedDestination(true)
			}
		}
	}

	die (time) {
		this.isMoving = false

		super.die(time)
	}

}

export default Movable
