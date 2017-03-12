import Render from 'render/render'

import Movable from 'game/entity/unit/movable'

const MINI_STATS = {
	// [start, levelup, max]
	mini: {
		healthMax: [90, 0, 0],
		healthRegen: [0, 0, 0],

		sightRange: [100, 0, 0],
		attackRange: [35, 0, 0],

		attackDamage: [1, 0, 0],
		attackCooldown: [1, 0, 0],
		attackMoveSpeed: [0, 0, 0],

		moveSpeed: [10, 0, 0],
		collision: 10,
	},

	center: {
		healthMax: [50, 0, 0],
		healthRegen: [0, 0, 0],

		sightRange: [100, 0, 0],
		attackRange: [100, 0, 0],

		attackDamage: [8, 0, 0],
		attackCooldown: [15, 0, 0],
		attackMoveSpeed: [10, 0, 0],
		bulletSize: 3,

		moveSpeed: [8, 0, 0],
		collision: 10,
	},
}

let mapWidth, mapHeight //TODO
let spawnCount = 0

//CLASS

class Mini extends Movable {

	constructor (team, name, path, mirrored, _mapWidth, _mapHeight) {
		mapWidth = _mapWidth
		mapHeight = _mapHeight

		const stats = MINI_STATS[name]

		super(team, stats, 1)

		this.id = `mini${spawnCount}`
		this.moveToTarget = true
		this.path = path
		this.pathFlip = false
		this.mirrored = mirrored
		this.pathProgress = 0
		this.exactDestination = true

		this.pathing = true
		this.returnToPath = false
		this.pathStep = 0
		this.lastX = null
		this.lastY = null

		this.updateDestination()
		this.setLocation(this.currentDest[0], this.currentDest[1])

		this.reachedDestination(true)

		Render.voxel('mini', {parent: this.top})
	}

	setDestination (x, y, preadjusted, moveX, moveY, fixedMovement) {
		this.returnToPath = false
		super.setDestination(x, y, preadjusted, moveX, moveY)

		// if (fixedMovement) {
		// 	const moveAngle = Math.atan2(y*100 - this.py, x*100 - this.px)
		// 	const diffX = Math.round(Math.cos(moveAngle) * 1000)
		// 	const diffY = Math.round(Math.sin(moveAngle) * 1000)
		// 	if (diffX != moveX || diffY != moveY) {
		// 		const sourceDest = this.path[this.pathProgress]
		// 		console.log('Invalid fixed movement', [sourceDest[0],sourceDest[1]], [moveX,moveY], [diffX,diffY])
		// 	}
		// }
	}

	updateDestination () {
		let nextDest = this.path[this.pathProgress]
		if (nextDest) {
			nextDest = nextDest.slice()
			if (this.pathFlip) {
				const prevDest = this.path[this.pathProgress + 1]
				nextDest[2] = prevDest[2]
				nextDest[3] = prevDest[3]
			}

			if (this.mirrored) {
				nextDest[0] = mapWidth - nextDest[0]
			}
			if (nextDest[2] && this.pathFlip == this.mirrored) {
				nextDest[2] = -nextDest[2]
			}
			if ((this.team == 0) != this.pathFlip) {
				nextDest[1] = mapHeight - nextDest[1]
			}
			if (nextDest[3] && this.team == 1) {
				nextDest[3] = -nextDest[3]
			}
		}
		this.currentDest = nextDest
	}

	reachedDestination (needsNewDestination) {
		if (!this.pathing && this.returnToPath) {
			this.pathing = true
		}
		if (this.pathing) {
			if (needsNewDestination) {
				if (this.pathFlip || this.pathProgress == this.path.length - 1) {
					this.pathProgress -= 1
					if (this.pathProgress < 0) {
						return false
					}
					this.pathFlip = true
				} else {
					this.pathProgress += 1
				}
				this.updateDestination()
			}
			if (this.currentDest) {
				this.setDestination(this.currentDest[0], this.currentDest[1], false, this.currentDest[2], this.currentDest[3], true)
				return true
			}
		} else {
			this.setDestination(this.lastX, this.lastY, true)
			this.returnToPath = true
		}
	}

	blocked (bx, by) {
		return false
	}

	shouldMove () {
		return this.currentDest != null
	}

	die (time) {
		super.die(time)

		this.destroy()
	}

	// Aim

	shouldTarget (unit) {
		return !unit.isDead && !this.alliedTo(unit) && this.inSightRange(unit)
	}

	getAttackTarget (units) {
		let closest = this.sightRangeCheck
		let target = null
		for (let idx = 0; idx < units.length; idx += 1) {
			const unit = units[idx]
			if (this.attackableStatus(unit)) {
				const dist = this.distanceTo(unit)
				if (dist < closest) {
					target = unit
					closest = dist
				}
			}
		}
		return this.setTarget(target, closest)
	}

	updateMoveTarget () {
		const hasTarget = super.updateMoveTarget()
		if (hasTarget) {
			if (this.pathing) {
				this.pathing = false
			}
		} else if (this.pathing) {
			this.lastX = this.px
			this.lastY = this.py
		}
	}

}

export default Mini