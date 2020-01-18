import store from '@/store'

import { STAT_MOVE_SPEED } from '@/play/data/constants'

import Local from '@/play/local'
import Render from '@/play/render/render'
import Float from '@/play/game/helpers/float'
import { pointDistance, squared, withinSquared } from '@/play/game/util'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const POSITION_MAGNITUDE_OFFSET = 100

let allBullets = null

//CLASS

class Bullet {

	// Constructor

	constructor (source, target, data, initialDistance, sx, sy, startAngle) {
		if (sx === undefined) {
			sx = source.px
			sy = source.py
			startAngle = source.top.aim
		}
		this.team = source.team
		this.source = source
		this.unitTarget = target.stats !== undefined
		source.bulletCount += 1
		if (data.heal) {
			this.heal = data.heal
		} else {
			this.rebound = source.rebound
		}

		this.dot = data.dot
		this.collides = data.collides
		this.pierces = data.pierces
		if (this.pierces) {
			this.collidedWith = []
		}
		this.hitsTowers = data.hitsTowers
		this.allies = data.allies
		this.modify = data.modify
		this.maxRange = this.unitTarget ? null : data.maxRange
		this.toMaxRange = data.toMaxRange === true
		this.explosionRadius = data.explosionRadius
		this.effectDuration = data.effectDuration
		this.stunDuration = data.stunDuration
		this.dodgeable = data.dodgeable

		this.propagated = 0
		this.propagateRange = data.propagateRange
		this.targeted = []
		this.color = this.rebound ? 0x0000ff : (data.bulletColor || 0x000000)

		this.container = Render.group()
		const ball = Render.sphere(data.bulletSize, { segments: data.bulletSize * 1.5, color: this.color, hideOutline: true, hideShadow: true })
		this.container.add(ball)
		Local.game.map.floorContainer.add(this.container)

		this.attackDamage = data.attackDamage
		this.attackPierce = data.attackPierce
		this.moveConstant = Float.divide(data.bulletSpeed, 500)
		if (data.bulletAcceleration) {
			this.moveAcceleration = 0.00000005
			this.startTime = store.state.game.renderTime
		}

		if (source.height) {
			this.dropRate = 1400000 * this.moveConstant / Math.sqrt(source.distanceTo(target))
		}
		if (!this.unitTarget) {
			this.collisionCheck = squared(data.collisionSize || data.bulletSpeed * 50)
		}
		this.setLocation(sx, sy, source.height || 10, startAngle)
		this.setTarget(target)
		if (initialDistance) {
			initialDistance *= 100
			this.px += Math.floor(Float.multiply(Float.cos(this.moveAngle), initialDistance))
			this.py += Math.floor(Float.multiply(Float.sin(this.moveAngle), initialDistance))
			this.updatePosition()
		}

		allBullets.push(this)
	}

	setTarget (target) {
		this.target = target
		if (this.unitTarget) {
			this.collisionCheck = squared(target.stats.collision)
		}
		if (this.unitTarget) {
			this.targeted.push(target.id)
			this.updateTarget(true)
		} else {
			this.setDestination(target[0], target[1])
		}
	}

	// Geometry

	setLocation (x, y, z, angle) {
		this.sx = x
		this.sy = y
		this.px = x
		this.py = y
		this.container.position.set(x, y, z)
		if (angle) {
			this.container.rotation.z = angle
		}
	}

	// Move

	setDestination (x, y) {
		const dx = x - this.px
		const dy = y - this.py
		let moveX, moveY
		if (dx !== 0 || dy !== 0) {
			const moveAngle = Float.atan(dy, dx)
			this.moveAngle = moveAngle
			moveX = Math.floor(Float.cos(moveAngle) * 1000)
			moveY = Math.floor(Float.sin(moveAngle) * 1000)
			this.container.rotation.z = moveAngle
		} else { //TODO workaround
			moveX = 0
			moveY = 0
			// warn('Bullet at destination', this.px, this.py)
		}
		this.moveX = moveX
		this.moveY = moveY
		this.destX = x
		this.destY = y
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
	}

	reachedDestination (renderTime) {
		if (this.explosionRadius) {
			new AreaOfEffect(this.source, {
				dot: this.dot,
				hitsTowers: this.hitsTowers,
				px: this.target[0],
				py: this.target[1],
				color: this.color,
				opacity: 0.25,
				allies: this.allies,
				modify: this.modify,
				radius: this.explosionRadius,
				attackDamage: this.attackDamage,
				attackPierce: this.attackPierce,
				startAt: renderTime,
				duration: this.effectDuration,
				parent: this.container.parent,
			})
		} else if (this.heal) {
			this.target.addHealth(this.heal)
		} else if (this.unitTarget && !this.target.isDead) {
			if (this.attackDamage) {
				const damage = this.dealDamageTo(this.target, renderTime)
				if (this.rebound && !this.source.isDead) {
					const heal = Math.round(Float.multiply(damage, this.rebound))
					const data = { bulletColor: 0x00ff00, heal: heal, bulletSize: 8, bulletSpeed: 10 }
					new Bullet(this.target, this.source, data, 0, this.px, this.py, this.container.rotation.z) //TODO rotation
				}
			}
			if (this.stunDuration && (this.hitsTowers || !this.target.tower) && (!this.modify || this.target.modifierIndex(STAT_MOVE_SPEED, 'Poison') !== -1)) {
				this.target.stun(renderTime, this.stunDuration)
			} else if (this.modify) {
				this.target.modifyData(renderTime, this.modify)
			}
		}

		if (this.propagateRange) {
			const units = Unit.all()
			const targetTeam = this.target.team
			let nearestUnit
			let nearestDistance = squared(this.propagateRange * 100)
			for (const unit of units) {
				if (unit.team === targetTeam && unit.targetable() && this.targeted.indexOf(unit.id) === -1) {
					const distance = unit.distanceTo(this.target)
					if (distance < nearestDistance) {
						nearestDistance = distance
						nearestUnit = unit
					}
				}
			}
			if (nearestUnit) {
				this.propagated += 1
				this.unitTarget = true
				this.setTarget(nearestUnit)
				return
			}
		}

		this.destroy()
	}

	destroy () {
		if (!this.remove) {
			this.source.bulletCount -= 1
			if (this.container.parent) {
				Render.remove(this.container)
			}
			this.remove = true
		}
	}

	distanceToStart () {
		return pointDistance(this.px, this.py, this.sx, this.sy)
	}

	move (renderTime, timeDelta, tweening) {
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
			let speed = this.moveConstant
			if (this.moveAcceleration) {
				const timeElapsed = Math.min(3000, renderTime - this.startTime)
				speed += Float.multiply(this.moveAcceleration, timeElapsed * timeElapsed)
			}
			this.currentSpeed = speed
			const moveScalar = Float.multiply(speed, timeDelta)
			moveByX = Math.round(Float.multiply(moveScalar, this.moveX))
			moveByY = Math.round(Float.multiply(moveScalar, this.moveY))
		}

		const movingToX = cx + moveByX
		const movingToY = cy + moveByY
		if (tweening) {
			this.updatePosition(movingToX, movingToY)
		} else {
			let reachedApproximate = false
			if (this.maxRange && !withinSquared(this.distanceToStart(), this.maxRange * 100)) {
				reachedApproximate = true
			} else if (!this.toMaxRange) {
				const distX = this.destX - movingToX
				const distY = this.destY - movingToY
				if (Math.abs(distX) < this.collisionCheck && Math.abs(distY) < this.collisionCheck) {
					reachedApproximate = pointDistance(movingToX, movingToY, this.destX, this.destY) <= this.collisionCheck
				}
			}
			if (reachedApproximate) {
				this.reachedDestination(renderTime)
			} else {
				this.px = movingToX
				this.py = movingToY
				this.updatePosition(movingToX, movingToY)
				if (this.dropRate && this.container.position.z > 0) {
					this.container.position.z -= this.dropRate
				}
			}
		}
	}

	// Collision

	dealDamageTo (target, renderTime) {
		return target.takeDamage(this.source, renderTime, this.attackDamage, this.attackPierce)
	}

	checkCollision (renderTime, units) {
		const team = this.team, px = this.px, py = this.py
		for (const unit of units) {
			if (team !== unit.team && unit.damageable() && (!unit.tower || this.hitsTowers)) {
				if (this.collidedWith && this.collidedWith.includes(unit.id)) {
					continue
				}
				const dist = unit.distanceToPoint(px, py)
				if (dist <= unit.collisionCheck * 2) {
					if (!this.pierces) {
						if (!this.explosionRadius) {
							this.unitTarget = unit
							this.target = unit
						}
						this.reachedDestination(renderTime)
						return true
					}
					this.collidedWith.push(unit.id)
					this.dealDamageTo(unit, renderTime)
				}
			}
		}
	}

	// Aim

	updateTarget (force) {
		const targ = this.target
		if (!force && (targ.isDead || (this.dodgeable && (targ.invisible || targ.untargetable)))) {
			this.unitTarget = false
			return
		}
		this.setDestination(targ.px, targ.py)
	}

}

//STATIC

Bullet.init = function () {
	allBullets = []
}

Bullet.destroy = function () {
	allBullets = null
}

Bullet.update = function (renderTime, timeDelta, tweening) {
	if (!tweening) {
		// Update
		const units = Unit.all()
		for (let idx = allBullets.length - 1; idx >= 0; idx -= 1) {
			const bullet = allBullets[idx]
			if (bullet.unitTarget) {
				bullet.updateTarget(false)
			} else if (bullet.collides) {
				bullet.checkCollision(renderTime, units)
			} else if (bullet.dodgeable) {
				bullet.checkCollision(renderTime, [ bullet.target ])
			}
			if (bullet.remove) {
				allBullets.splice(idx, 1)
			}
		}
	}

	// Move
	for (const bullet of allBullets) {
		bullet.move(renderTime, timeDelta, tweening)
		if (bullet.updateAnimations) {
			bullet.updateAnimations(renderTime)
		}
	}
}

export default Bullet
