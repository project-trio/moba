import Local from '@/play/local'

import Float from '@/play/game/helpers/float'
import Util from '@/play/game/util'

import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const POSITION_MAGNITUDE_OFFSET = 100

const rectanglesIntersecting = function (ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
	return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1
}

//CLASS

class Movable extends Unit {

	constructor (team, statBase, unitScale, x, y, startAngle, isLocal) {
		super(team, statBase, unitScale, x, y, startAngle, isLocal)

		this.movable = true
		this.customPosition = false
		this.moveTargetAngle = null
		this.moveDestination = null
	}

	// Position

	targetDestination (x, y) {
		this.setTarget(null)
		this.setDestination(x, y, true)
		if (this.isLocal) {
			this.renderTargetRing(x / POSITION_MAGNITUDE_OFFSET, y / POSITION_MAGNITUDE_OFFSET)
		}
	}

	setDestination (x, y, preadjusted, moveX, moveY) {
		if (!preadjusted) {
			x *= POSITION_MAGNITUDE_OFFSET
			y *= POSITION_MAGNITUDE_OFFSET
		}

		const dx = x - this.px
		const dy = y - this.py
		if (moveX === undefined) {
			if (dx !== 0 || dy !== 0) {
				const moveAngle = Float.atan(dy, dx)
				this.moveTargetAngle = moveAngle
				moveX = Math.floor(Float.cos(moveAngle) * 1000)
				moveY = Math.floor(Float.sin(moveAngle) * 1000)
			} else {
				moveX = 0
				moveY = 0
				// warn('Moveable at destination', this.px, this.py)
			}
		} else {
			this.moveTargetAngle = Math.atan2(dy, dx)
		}
		this.moveX = moveX
		this.moveY = moveY
		this.destX = x
		this.destY = y

		this.moveDestination = true
	}

	updatePosition (moveToX, moveToY) {
		if (!moveToX) {
			moveToX = this.px
			moveToY = this.py
		}
		this.container.position.x = moveToX / POSITION_MAGNITUDE_OFFSET
		this.container.position.y = moveToY / POSITION_MAGNITUDE_OFFSET
	}

	// Move

	blocked (bx, by) {
		const collisionSize = this.stats.collision
		if (!bx) {
			bx = this.px
			by = this.py
		}

		// Walls
		const walls = Local.game.map.blockCheck(bx, by)
		if (!walls) {
			return true
		}
		const ux1 = bx - collisionSize
		const uy1 = by - collisionSize
		const ux2 = ux1 + collisionSize * 2
		const uy2 = uy1 + collisionSize * 2
		for (const wall of walls) {
			const wx = wall[0]
			const wy = wall[1]
			const ww = wall[2]
			const wh = wall[3]
			if (wh !== undefined) {
				if (rectanglesIntersecting(wx, wy, ww, wh, ux1, uy1, ux2, uy2)) {
					return true
				}
			} else {
				const dist = Util.pointDistance(wx, wy, bx, by)
				if (Util.withinSquared(dist, collisionSize + ww)) {
					return true
				}
			}
		}

		// Units
		const units = Unit.all()
		for (const unit of units) {
			if (this !== unit && unit.isBlocking) {
				const dist = Util.pointDistance(bx, by, unit.px, unit.py)
				if (Util.withinSquared(dist, collisionSize + unit.stats.collision)) {
					return true
				}
			}
		}
	}

	shouldMove () {
		return this.moveDestination && this.aimingToMove && !this.isAttackingTargetedUnit && this.stunnedUntil === 0
	}

	reachedDestination (needsNewDestination) {
		this.moveDestination = false
	}

	move (timeDelta, tweening) {
		let cx, cy
		let moveByX, moveByY
		if (tweening) {
			cx = this.container.position.x * POSITION_MAGNITUDE_OFFSET
			cy = this.container.position.y * POSITION_MAGNITUDE_OFFSET

			const tweenScalar = this.cacheMoveSpeed * timeDelta
			moveByX = tweenScalar * this.moveX
			moveByY = tweenScalar * this.moveY
		} else {
			cx = this.px
			cy = this.py

			moveByX = Math.round(Float.multiply(this.current.moveSpeed, this.moveX))
			moveByY = Math.round(Float.multiply(this.current.moveSpeed, this.moveY))
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

			if (reachedApproximate) {
				this.reachedDestination(true)
			}
		}
	}

	die (renderTime, isRetro) {
		this.moveDestination = false

		super.die(renderTime, isRetro)
	}

	// Target

	checkLoseTarget () {
		super.checkLoseTarget()

		this.reachedDestination(false)
	}

	checkUpdateTarget (renderTime) {
		this.isAttackingTargetedUnit = this.inRangeFor(this.attackTarget)
		if (!this.isAttackingTargetedUnit) {
			this.setDestination(this.attackTarget.px, this.attackTarget.py, true)
		}
	}

}

export default Movable
