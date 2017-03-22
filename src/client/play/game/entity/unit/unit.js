import Decimal from 'decimal.js'

import store from '@/store'

import Bridge from '@/play/bridge'
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
		this.ally = team === Local.player.team
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
			armor: statBase.armor[0],
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
		this.infoContainer = Render.group()
		this.unitInfo = Render.group()
		this.infoContainer.add(this.unitInfo)
		this.unitInfo.position.y = 40
		this.unitInfo.position.z = hpOffsetZ
		this.hpHeight = hpHeight
		this.hpWidth = hpWidth

		Render.rectangle(0, 0, hpWidth, hpHeight, { // HP Backing
			color: 0xFF3333,
			strokeWidth: outlineWeight,
			strokeColor: 0xFFFFFF,
			radius: hpRadius,
			parent: this.unitInfo,
		})

		this.healthBar = Render.rectangle(-hpWidth / 2, 0, hpWidth, hpHeight, {
			color: 0x33FF99,
			radius: hpRadius + 2,
			parent: this.unitInfo,
		})
		this.healthBar.geometry.translate(hpWidth / 2, 0, 0)

		Local.game.map.addInfo(this.infoContainer)

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

	// Pointer

	onHover () {
		document.body.style.cursor = 'pointer'
	}

	onBlur () {
		document.body.style.cursor = null
	}

	onClick (point, rightClick) {
		store.setSelectedUnit(this)
		if (this.isLocal) { //TODO remove
			console.log('local')
			return false
		}
		if (this.ally) {
			console.log('ally')
			return false
		}
		Bridge.emit('action', { target: this.id })
		return true
	}

	// Geometry

	setLocation (x, y) {
		this.px = x * 100
		this.py = y * 100
		this.container.position.set(x, y, 0)
		this.infoContainer.position.set(x, y, 0)

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
				console.error('newHealth', newHealth)
			}
			this.healthRemaining = newHealth
		} else {
			newHealth = this.healthRemaining
		}

		const healthScale = newHealth / this.stats.healthMax
		if (healthScale > 0) {
			this.healthBar.scale.x = healthScale
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
		let armor = this.stats.armor
		if (this.armorModifier) {
			armor *= this.armorModifier
			if (!Number.isInteger(armor)) {
				console.error('armor', armor)
			}
		}
		const damage = amount - armor //TODO percent
		const newHealth = Math.max(this.healthRemaining - damage, 0)
		if (newHealth == 0) {
			this.isDying = true
		}
		this.updateHealth(newHealth)
	}

	die (time) {
		this.isDead = true
		this.timeOfDeath = time
		this.infoContainer.visible = false
		this.setTarget(null)
	}

	destroy () {
		Render.remove(this.infoContainer)
		Render.remove(this.container)
		if (this.fogCircle) {
			Render.remove(this.fogCircle)
		}
		this.remove = true
	}

	// Target

	setTargetId (id) {
		for (let idx = 0; idx < allUnits.length; idx += 1) {
			const unit = allUnits[idx]
			if (unit.id === id) {
				const dist = this.distanceTo(unit)
				this.moveToTarget = true
				return this.setTarget(unit, dist)
			}
		}
		console.error('Target id not found', id)
	}

	setTarget (target, distance) {
		if (target != this.attackTarget) {
			if (this.attackTarget) {
				this.attackTarget.incoming(-1)
			}
			if (target) {
				target.incoming(1)
				if (this.endInvisible) {
					this.endInvisible()
				}
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
		return !enemy.invisible && (enemy.isGloballyVisible() || this.hasSightOf(enemy))
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

	targetableStatus (unit) {
		return !unit.invisible && !unit.isDead
	}
	attackableStatus (unit) {
		return this.targetableStatus(unit) && !unit.hasDied() && !this.alliedTo(unit)
	}

	// canAttack (unit) {
	// 	return this.attackableStatus(unit) && this.inAttackRange(unit)
	// }

	attack (enemy, renderTime) {
		this.lastAttack = renderTime
		if (!this.stats.attackMoveSpeed) { //SAMPLE || this.stats.attackMoveSpeed != 11) {
			enemy.doDamage(this.stats.attackDamage)
		} else {
			new Bullet(this, enemy, this.px, this.py, this.top.rotation.z)
		}
	}

	isAttackOffCooldown (renderTime) {
		let cooldown = this.stats.attackCooldown * 100
		if (this.attackCooldownModifier) {
			cooldown *= this.attackCooldownModifier
			if (!Number.isInteger(cooldown)) {
				console.error('cooldown', cooldown)
			}
		}
		return renderTime - this.lastAttack > cooldown
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
