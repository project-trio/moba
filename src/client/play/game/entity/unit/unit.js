import Decimal from 'decimal.js'

import Local from '@/play/local'

import Render from '@/play/render/render'
import RenderFog from '@/play/render/fog'

import Util from '@/play/game/util'

import Bullet from '@/play/game/entity/unit/bullet'

//LOCAL

const allUnits = []

const applyOpacity = function (container, isTransluscent, opacity) {
	const mesh = container.children[0]
	if (mesh) {
		mesh.material.transparent = isTransluscent
		if (isTransluscent) {
			mesh.material.opacity = opacity
		}
	}
}

//CLASS

class Unit {

	// Constructor

	constructor (team, statBase, unitScale, x, y, startAngle) {
		this.team = team
		this.startAngle = startAngle

		this.movable = false
		this.attackTarget = null
		this.isAttackingTarget = false

		this.container = Render.group()
		this.base = Render.group()
		this.top = Render.group()

		this.container.add(this.base)
		this.container.add(this.top)
		Local.game.map.floorContainer.add(this.container)

		RenderFog.add(this)

		// Stats

		this.stats = {
			healthMax: statBase.healthMax[0] * 1000,
			healthRegen: statBase.healthRegen[0],
			sightRange: statBase.sightRange[0] * 100,
			attackRange: statBase.attackRange[0] * 100,
			attackDamage: statBase.attackDamage[0] * 1000,
			attackCooldown: statBase.attackCooldown[0],
			attackMoveSpeed: statBase.attackMoveSpeed[0],
			moveSpeed: statBase.moveSpeed[0] * 2,
			turnSpeed: statBase.turnSpeed || 5,
			collision: statBase.collision * 100,
			bulletSize: statBase.bulletSize,
			bulletColor: statBase.bulletColor,
		}

		this.healthRemaining = this.stats.healthMax
		this.sightRangeCheck = Util.squared(this.stats.sightRange)
		this.attackRangeCheck = Util.squared(this.stats.attackRange)
		// this.stats.collisionCheck = Util.squared(this.stats.collision)
		this.moveConstant = new Decimal(this.stats.moveSpeed).dividedBy(2000)

		this.incomingAttackers = 0
		this.lastAttack = 0

		// Health Bar

		const hpOffsetY = -40
		const outlineWeight = 1
		const hpRadius = 3

		let hpHeight, hpWidth
		let hpOffsetZ
		if (unitScale == 1) {
			hpHeight = 3
			hpWidth = 40
			hpOffsetZ = 40
		} else if (unitScale == 2) {
			hpHeight = 4
			hpWidth = 62
			hpOffsetZ = 60
		} else {
			hpHeight = 5
			hpWidth = 72
			hpOffsetZ = 80
		}
		this.healthWidth = hpWidth
		this.healthContainer = Render.group()

		Render.rectangle(0, hpOffsetY, hpWidth, hpHeight, { // HP Backing
			color: 0xFF3333,
			strokeWidth: outlineWeight,
			strokeColor: 0xFFFFFF,
			radius: hpRadius,
			z: hpOffsetZ,
			parent: this.healthContainer,
		})

		this.healthBar = Render.rectangle(0, hpOffsetY, hpWidth, hpHeight, {
			color: 0x33FF99,
			radius: hpRadius + 2,
			z: hpOffsetZ,
			parent: this.healthContainer,
		})

		Local.game.map.addHealthbar(this.healthContainer)

		// Start location

		if (x) {
			this.setLocation(x, y)
		}

		allUnits.push(this)
	}

	// Render

	opacity (opacity) {
		const isTransluscent = opacity < 1
		applyOpacity(this.base, isTransluscent, opacity)
		applyOpacity(this.top, isTransluscent, opacity)
	}

	// Geometry

	setLocation (x, y) {
		this.px = x * 100
		this.py = y * 100
		this.container.position.set(x, y, 0)
		this.healthContainer.position.x = x
		this.healthContainer.position.y = y

		const angle = this.startAngle || (-Math.PI * 1.5 * (this.team == 0 ? -1 : 1))
		this.base.rotation.z = angle
		this.top.rotation.z = angle
	}

	distanceTo (unit) {
		return Util.pointDistance(this.px, this.py, unit.px, unit.py)
	}

	shouldMove () {
		return false
	}

	// Health

	hasDied () {
		return this.healthRemaining <= 0
	}

	updateHealth (newHealth) {
		if (newHealth != null) {
			if (!Number.isInteger(newHealth)) { //TODO debug only
				console.error('Invalid health amount', newHealth)
			}
			this.healthRemaining = newHealth
		} else {
			newHealth = this.healthRemaining
		}

		const healthScale = newHealth / this.stats.healthMax
		if (healthScale > 0) {
			this.healthBar.scale.x = healthScale
			const hpXOff = this.healthWidth / 2
			this.healthBar.position.x = (-hpXOff * healthScale) + hpXOff
			this.healthBar.visible = true
		} else {
			this.healthBar.visible = false
		}
	}

	addHealth (addedHealth) {
		if (this.healthRemaining == this.stats.healthMax) {
			return
		}

		const newHealth = Math.min(this.healthRemaining + addedHealth, this.stats.healthMax)
		this.updateHealth(newHealth)
	}

	doDamage (amount) {
		const newHealth = Math.max(this.healthRemaining - amount, 0)
		if (newHealth == 0) {
			this.isDying = true
		}
		this.updateHealth(newHealth)
	}

	die (time) {
		this.isDead = true
		this.timeOfDeath = time
		this.healthContainer.visible = false
		this.setTarget(null)
	}

	destroy () {
		Render.remove(this.healthContainer)
		Render.remove(this.container)
		if (this.fogCircle) {
			Render.remove(this.fogCircle)
		}
		this.remove = true
	}

	// Target

	setTarget (target, distance) {
		if (target != this.attackTarget) {
			if (this.attackTarget) {
				this.attackTarget.incoming(-1)
			}
			if (target) {
				target.incoming(1)
			} else {
				this.isAttackingTarget = false
			}
			this.attackTarget = target
		}
		if (target) {
			this.cacheAttackCheck = distance <= this.attackRangeCheck
		}
		return target
	}

	// Aim

	updateAim () {
		if (this.attackTarget) {
			this.aimTargetAngle = Util.angleBetween(this, this.attackTarget, true)
		}
		if (this.aimTargetAngle) {
			let currAngle = this.top.rotation.z
			let destAngle = this.aimTargetAngle
			let newAngle
			let angleDiff = Util.distanceBetweenAngles(currAngle, destAngle)
			let turnSpeed = this.stats.turnSpeed / 100
			if (Math.abs(angleDiff) < turnSpeed) {
				newAngle = destAngle
				this.aimTargetAngle = null
			} else {
				let spinDirection = angleDiff < 0 ? -1 : 1
				newAngle = currAngle + (turnSpeed * spinDirection)
			}
			this.top.rotation.z = newAngle
		}
	}

	// Visibility

	inSightRange (unit) {
		return this.distanceTo(unit) < this.sightRangeCheck
	}

	isGloballyVisible () {
		return this.isDying || this.hasActiveFire()
	}

	hasSightOf (unit) {
		return !this.isDead && this.inSightRange(unit)
	}

	canSee (enemy) {
		return enemy.isGloballyVisible() || this.hasSightOf(enemy)
	}

	// Attack

	alliedTo (target) {
		return this.team == target.team
	}

	incoming (increment) {
		this.incomingAttackers += increment
	}

	hasActiveFire () {
		return this.isFiring || this.incomingAttackers > 0
	}

	inAttackRange (unit) {
		return this.distanceTo(unit) < this.attackRangeCheck
	}

	attackableStatus (unit) {
		return !unit.hasDied() && !this.alliedTo(unit)
	}

	canAttack (unit) {
		return this.attackableStatus(unit) && this.inAttackRange(unit)
	}

	attack (enemy, renderTime) {
		this.lastAttack = renderTime
		if (!this.stats.attackMoveSpeed) { //SAMPLE || this.stats.attackMoveSpeed != 11) {
			enemy.doDamage(this.stats.attackDamage)
		} else {
			new Bullet(this, enemy, this.px, this.py, this.top.rotation.z)
		}
	}

	isAttackOffCooldown (renderTime) {
		return renderTime - this.lastAttack > this.stats.attackCooldown * 100
	}

	shouldTarget (unit) {
		return this.canAttack(unit)
	}

	getAttackTarget (units) {
		return null
	}

	checkAttack (renderTime) {
		let attackForTick = this.getAttackTarget(allUnits)
		this.isFiring = attackForTick && this.cacheAttackCheck
		if (this.isFiring) {
			this.attack(attackForTick, renderTime)
		}
	}

}

//STATIC

Unit.all = function () {
	return allUnits
}

Unit.update = function (renderTime, timeDelta, tweening) {
	// Move
	for (let idx = 0; idx < allUnits.length; idx += 1) {
		const unit = allUnits[idx]
		if (unit.isDying) {
			continue
		}
		unit.updateAim()

		if (tweening && (!unit.isRendering || unit.isBlocked)) {
			continue
		}
		if (unit.shouldMove()) {
			unit.move(timeDelta, tweening)
		}
	}

	if (!tweening) {
		// Update
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx]
			if (unit.update) {
				unit.update(renderTime, timeDelta, tweening)
			}
		}
		// Attack
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx]
			if (!unit.isDead && unit.isAttackOffCooldown(renderTime)) {
				unit.checkAttack(renderTime)
			}
		}
		// Die
		for (let idx = allUnits.length - 1; idx >= 0; idx -= 1) {
			const unit = allUnits[idx]
			if (unit.isDying && !unit.isDead) {
				unit.die(renderTime)
				if (unit.remove) {
					allUnits.splice(idx, 1)
					idx -= 1
				}
			}
		}
		// Target
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx]
			if (!unit.isDead && unit.movable) {
				unit.updateMoveTarget()
			}
		}
	}
}

export default Unit
