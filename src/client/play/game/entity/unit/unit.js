import Decimal from 'decimal.js'

import store from '@/client/store'

import Bridge from '@/client/play/events/bridge'
import Local from '@/client/play/local'

import Render from '@/client/play/render/render'

import Animate from '@/client/play/game/helpers/animate'
import Float from '@/client/play/game/helpers/float'
import Util from '@/client/play/game/util'

import Bullet from '@/client/play/game/entity/attack/bullet'

//LOCAL

let allUnits = null

let targetingGround = false

//CLASS

class Unit {

	constructor (team, statBase, unitScale, sx, sy, startAngle, isLocal, renderInBackground) {
		this.team = team
		this.localAlly = Local.player && team === Local.player.team
		this.startAngle = startAngle
		this.damagers = {}
		this.isLocal = isLocal
		this.cacheMoveSpeed = 0
		this.cacheAttackCheck = false

		this.renderInBackground = renderInBackground
		this.movable = false
		this.attackTarget = null
		this.isAttackingTarget = false
		this.requiresSightOfTarget = true
		this.bulletCount = 0
		this.height = 0
		this.split = false
		this.static = !statBase.healthMax
		this.disableAttacking = this.static
		this.untargetable = this.static
		this.stunnedUntil = 0

		this.fogRadius = null
		this.fogCircle = null
		this.minimapCircle = null

		this.container = Render.group()
		this.model = Render.group()
		this.base = Render.group()
		this.top = Render.group()
		this.floor = Render.group()

		this.container.add(this.floor)
		this.model.add(this.base)
		this.model.add(this.top)
		this.container.add(this.model)
		Local.game.map.floorContainer.add(this.container)

		Animate.apply(this)

		// Stats

		this.stats = {
			sightRange: statBase.sightRange[0] * 100,
		}
		this.sightRangeCheck = Util.squared(this.stats.sightRange)

		if (!this.static) {
			const ringOffset = unitScale > 3 ? 2 : 6
			const selectionRing = Render.ring(statBase.collision + ringOffset, 4, {
				color: 0x000000,
				opacity: 0.5,
				segments: 32,
				parent: this.floor,
			})
			this.selectionIndicator = selectionRing
			this.selectionIndicator.visible = false

			const clickCircle = Render.circle(statBase.collision + 8, { color: 0x000000, opacity: 0, parent: this.container })
			clickCircle.position.z = 1
			clickCircle.owner = this

			this.stats.shield = 0
			this.stats.healthMax = statBase.healthMax[0] * 100
			this.stats.healthRegen = statBase.healthRegen[0]
			this.stats.armor = statBase.armor[0]
			this.stats.sightRange = statBase.sightRange[0] * 100
			this.stats.attackRange = statBase.attackRange[0] * 100
			this.stats.attackDamage = statBase.attackDamage[0] * 100
			this.stats.attackPierce = statBase.attackPierce[0] * 100
			this.stats.attackCooldown = statBase.attackCooldown[0] * 100
			this.stats.bulletSpeed = statBase.bulletSpeed
			this.stats.bulletOffset = statBase.bulletOffset
			this.stats.turnSpeed = statBase.turnSpeed || 8
			this.stats.collision = statBase.collision * 100
			this.collisionCheck = Util.squared(this.stats.collision)
			this.stats.bulletSize = statBase.bulletSize
			this.stats.bulletColor = statBase.bulletColor

			this.healthRemaining = this.stats.healthMax
			this.attackRangeCheck = Util.squared(this.stats.attackRange)

			this.lastAttack = 0

			// Modifiers
			this.modifiers = {
				shield: {},
				healthRegen: {},
				armor: {},
				attackCooldown: {},
			}
			this.current = {}
			if (statBase.moveSpeed) {
				this.modifiers.moveSpeed = {}
				this.stats.moveSpeed = statBase.moveSpeed[0]
				this.modify('Constant', 'moveSpeed', 'times', new Decimal(Local.tickDuration).dividedBy(2000))
			}
			this.updateModifiers()

			// Health Bar
			let hpHeight, hpWidth, hpOffsetZ
			if (unitScale === 1) {
				hpHeight = 3
				hpWidth = 40
				hpOffsetZ = 0
			} else if (unitScale === 2 || unitScale === 3) {
				hpHeight = 4
				hpWidth = 62
				hpOffsetZ = 20
			} else {
				hpHeight = 5
				hpWidth = 72
				hpOffsetZ = 40
			}
			this.healthWidth = hpWidth
			this.infoContainer = Render.group()
			this.infoContainer.position.y = 40
			this.infoContainer.position.z = 30 + hpOffsetZ
			this.hpHeight = hpHeight
			this.hpWidth = hpWidth

			const outlineWeight = 1
			Render.rectangle(0, 0, hpWidth + outlineWeight, hpHeight + outlineWeight, {
				color: 0x000000,
				parent: this.infoContainer,
				noDepth: true,
			})
			Render.rectangle(0, 0, hpWidth, hpHeight, {
				color: 0xFF3333,
				parent: this.infoContainer,
				noDepth: true,
			})
			this.healthBar = Render.rectangle(-hpWidth / 2, 0, hpWidth, hpHeight, {
				color: 0x33FF99,
				parent: this.infoContainer,
				noDepth: true,
			})
			this.healthBar.geometry.translate(hpWidth / 2, 0, 0)

			this.container.add(this.infoContainer)
		}

		// Start location

		if (sx) {
			this.setLocation(sx, sy)
		}

		Render.addUnit(this, this.stats.collision)
		allUnits.push(this)
	}

	allyNotLocal () {
		return this.localAlly
	}

	updateModifiers () {
		for (let statName in this.modifiers) {
			this.modify(null, statName)
		}
	}

	hasModifier (statName, key) {
		const statModifiers = this.modifiers[statName]
		return statModifiers && statModifiers[key] !== undefined
	}

	cancelModifiers (statName) {
		const statModifiers = this.modifiers[statName]
		let canceled = false
		for (let key in statModifiers) {
			canceled = true
			const mod = statModifiers[key]
			const callback = mod[3]
			if (callback) {
				callback()
			}
			delete statModifiers[key]
		}
		if (canceled) {
			this.modify(null, statName)
		}
	}

	expireModifiers (renderTime) {
		for (let statName in this.modifiers) {
			const statModifiers = this.modifiers[statName]
			let expired = false
			for (let key in statModifiers) {
				const mod = statModifiers[key]
				const expiresAt = mod[2]
				if (expiresAt && renderTime >= expiresAt) {
					expired = true
					const callback = mod[3]
					if (callback) {
						callback()
					}
					delete statModifiers[key]
				}
			}
			if (expired) {
				this.modify(null, statName)
			}
		}
	}

	modifyData (renderTime, data) {
		this.modify(data.name, data.stat, data.method, data.value, renderTime + data.expires)
	}

	modify (modifierKey, statName, method, value, ending, callback) {
		const statModifiers = this.modifiers[statName]
		if (!statModifiers) {
			return
		}
		const updatingModifier = modifierKey !== null
		if (updatingModifier) {
			if (method === null) {
				const mod = statModifiers[modifierKey]
				if (mod) {
					const callback = mod[3]
					if (callback) {
						callback()
					}
					delete statModifiers[modifierKey]
				}
			} else {
				statModifiers[modifierKey] = [method, value, ending, callback]
			}
		}
		let result = new Decimal(this.stats[statName])
		for (let key in statModifiers) {
			const mod = statModifiers[key]
			const mathMethod = mod[0]
			const byValue = mod[1]
			result = result[mathMethod](byValue)
		}
		if (statName === 'moveSpeed') {
			this.current[statName] = result //DECIMAL
			this.cacheMoveSpeed = result.toNumber() / Local.tickDuration
		} else {
			this.current[statName] = result.toNumber()
			if (Local.TESTING && !Number.isInteger(this.current[statName])) { //TODO testing
				console.error('NON-INTEGER', modifierKey, statName, result.toNumber())
			}
		}
		if (updatingModifier && this.selected) {
			store.modifierStats(this)
		}
	}

	// Render

	renderTargetRing (x, y) {
		const targetRing = Local.game.map.targetRing
		targetRing.visible = true
		targetRing.position.x = x
		targetRing.position.y = y
		targetRing.scale.x = 1
		targetRing.scale.y = 1
		targetingGround = true
	}

	setSelection (color) {
		const isVisible = color != null
		this.selectionIndicator.visible = isVisible
		if (isVisible) {
			this.selectionIndicator.material.color.setHex(color)
		}
	}

	opacity (opacity) {
		const isTransluscent = opacity < 1
		this.model.traverse((node) => {
			if (node.material && !node.fixedTransparency) {
				node.material.transparent = isTransluscent
				if (isTransluscent) {
					node.material.opacity = opacity
				}
			}
		})
	}

	// Pointer

	onHover () {
		if (this.isDying) {
			return false
		}
		if (this.id !== store.state.local.skills.unitTarget && (!this.tower || store.state.local.skills.hitsTowers)) {
			store.state.local.skills.unitTarget = this.id
			if (store.state.local.skills.getUnitTarget && store.state.local.skills.withAlliance === this.localAlly) {
				this.setSelection(0xff0000)
			}
		}
		document.body.style.cursor = 'pointer'
	}

	onBlur () {
		if (this.id === store.state.local.skills.unitTarget) {
			store.state.local.skills.unitTarget = null
			if (store.state.local.skills.getUnitTarget) {
				this.setSelection(null)
			}
		}
		document.body.style.cursor = null
	}

	onClick (point, rightClick) {
		setTimeout(() => {
			store.setSelectedUnit(this)
		}, 0)
		if (this.isLocal) { //TODO remove
			return false
		}
		if (this.isDying) {
			return false
		}
		if (store.state.local.skills.getUnitTarget) {
			const withAlliance = store.state.local.skills.withAlliance
			if (withAlliance === null || withAlliance === this.localAlly) {
				store.state.local.skills.activation(this.id)
				return true
			}
		}
		if (this.localAlly) {
			return false
		}
		if (store.state.local.skills.getGroundTarget) {
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

		const angle = this.startAngle || (-Math.PI * 1.5 * (this.team == 0 ? -1 : 1))
		this.top.rotation.z = angle
		this.base.rotation.z = angle
	}

	distanceTo (unit) {
		return Util.pointDistance(this.px, this.py, unit.px, unit.py)
	}
	distanceToPoint (px, py) {
		return Util.pointDistance(this.px, this.py, px, py)
	}

	// Movement

	stun (renderTime, duration) {
		const stunEnd = renderTime + duration
		if (stunEnd > this.stunnedUntil) {
			// p('Stun for', duration, stunEnd)
			this.stunnedUntil = stunEnd
			if (!this.stunMesh) {
				this.stunMesh = Render.outline(this.base.children[0] || this.top.children[0], 0xffaa00, 1.1)
			}
		}
	}

	checkStun (renderTime) {
		if (renderTime > this.stunnedUntil) {
			if (this.stunMesh) {
				Render.remove(this.stunMesh)
				this.stunMesh = null
			}
			this.stunnedUntil = 0
			return true
		}
		return false
	}

	shouldMove () {
		return false
	}

	// Health

	update (renderTime, timeDelta) {
		if (this.selected) {
			store.everyUpdateStats(this)
		}
		if (!this.isDead) {
			this.doRegenerate()
			this.checkStun(renderTime)
		}
	}

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
		if (this.healthRemaining === this.stats.healthMax) {
			return
		}

		const newHealth = Math.min(this.healthRemaining + addedHealth, this.stats.healthMax)
		this.updateHealth(newHealth)
	}

	doRegenerate () {
		const regen = this.current.healthRegen
		if (regen !== 0) {
			this.addHealth(regen)
		}
	}

	takeDamage (source, renderTime, amount, pierce, reflected) {
		let damage = amount
		if (!reflected) {
			let armor = 100 - Math.max(0, this.current.armor - pierce)
			damage = Math.round(Float.multiply(damage, armor) / 100)
			// const damageDecimal = new Decimal(damage).times(armor).dividedBy(100) //DECIMAL
			// damage = damageDecimal.round().toNumber() //DECIMAL

			if (this.reflectDamageRatio) {
				// const reflectedDamage = damageDecimal.times(this.reflectDamageRatio).round().toNumber() //DECIMAL
				const reflectedDamage = Math.floor(Float.multiply(damage, this.reflectDamageRatio))
				source.takeDamage(this, renderTime, reflectedDamage, 0, true)
			}
			if (this.repairDamageRatio) {
				const duration = 2000
				const ticks = Math.floor(duration / Local.tickDuration)
				const healthPerTick = Math.floor(Float.multiply(this.repairDamageRatio, damage) / ticks)
				// const healthPerTick = this.repairDamageRatio.times(damageDecimal).dividedBy(ticks).round().toNumber() //DECIMAL
				this.modify(`${source.id}${renderTime}`, 'healthRegen', 'add', healthPerTick, renderTime + duration)
			}
		}
		let dealDamage = damage
		if (this.current.shield) {
			this.current.shield -= dealDamage
			if (this.current.shield <= 0) {
				dealDamage = -this.current.shield
				this.current.shield = 0
				this.cancelModifiers('shield')
			} else {
				dealDamage = 0
			}
		}
		const newHealth = Math.max(this.healthRemaining - dealDamage, 0)
		if (newHealth == 0) {
			this.isDying = true
		}
		this.updateHealth(newHealth)

		if (source.displayStats) {
			source.displayStats.damage += damage
		}
		const sid = source.player ? source.id : source.name
		const damager = this.damagers[sid]
		if (damager) {
			damager.at = renderTime
			damager.total += damage
		} else {
			this.damagers[sid] = {
				at: renderTime,
				total: damage,
				unit: source,
			}
		}
		return damage
	}

	die (time) {
		this.isDead = true
		this.timeOfDeath = time
		if (this.infoContainer) {
			this.infoContainer.visible = false
		}
		this.removeTarget()
	}

	destroy () {
		Render.remove(this.container)
		if (this.fogCircle) {
			Render.remove(this.fogCircle)
		}
		if (this.minimapCircle) {
			Render.remove(this.minimapCircle)
		}
		this.remove = true
	}

	// Target

	removeTarget () {
		this.setTarget(null)
		this.attackTarget = null
	}

	setTarget (target, distance) {
		if (target !== this.attackTarget) {
			if (this.attackTarget && this.isLocal) {
				this.attackTarget.setSelection(null)
			}
			if (target) {
				this.attackTarget = target
			} else {
				this.isAttackingTarget = false
			}
		}
		if (target) {
			this.cacheAttackCheck = distance <= this.attackRangeCheck
		} else if (this.attackTarget) {
			if (this.attackTarget.isDying || this.distanceTo(this.attackTarget) >= this.attackRangeCheck) {
				this.attackTarget = null
			}
		}
		return target
	}

	checkLoseTarget () {
		this.removeTarget()
	}

	checkUpdateTarget (renderTime) {
	}

	checkTarget (renderTime) {
		if (this.attackTarget) {
			if (!this.attackTarget.targetableStatus() || !this.canSee(this.attackTarget)) {
				this.checkLoseTarget()
			} else {
				this.checkUpdateTarget(renderTime)
			}
		}
	}

	// Aim

	angleTo (container, destAngle, timeDelta) {
		let currAngle = container.rotation.z
		let newAngle
		let angleDiff = Util.distanceBetweenAngles(currAngle, destAngle)
		let turnSpeed = this.stats.turnSpeed * timeDelta / 2000
		if (Math.abs(angleDiff) < turnSpeed) {
			newAngle = destAngle
		} else {
			let spinDirection = angleDiff < 0 ? -1 : 1
			newAngle = currAngle + (turnSpeed * spinDirection)
		}
		container.rotation.z = newAngle
		return newAngle
	}

	updateAim (timeDelta) {
		let aimTop
		if (this.attackTarget) {
			aimTop = Util.angleBetween(this, this.attackTarget, true)
		}
		let aimBase = (!this.attackTarget || this.shouldMove()) ? this.moveTargetAngle : null
		if (!aimTop) {
			aimTop = aimBase
		}
		if (this.split) {
			if (!aimBase) {
				aimBase = aimTop
			}
			if (aimBase) {
				this.angleTo(this.base, aimBase, timeDelta)
			}
		}
		if (aimTop) {
			this.angleTo(this.top, aimTop, timeDelta)
		}
	}

	// Visibility

	inSightRange (unit) {
		return this.distanceTo(unit) < this.sightRangeCheck
	}

	isGloballyVisible () {
		return this.isDying || this.isFiring || this.renderInBackground
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

	inRangeFor (unit) {
		const rangeCheck = this.targetingSkill ? this.targetingSkill.rangeCheck : this.attackRangeCheck
		return this.distanceTo(unit) < rangeCheck
	}

	hittableStatus () {
		return !this.isDead && !this.untargetable
	}
	targetableStatus () {
		return !this.invisible && this.hittableStatus()
	}
	attackableStatus (unit) {
		return unit.targetableStatus() && !this.alliedTo(unit)
	}

	// canAttack (unit) {
	//   return this.attackableStatus(unit) && this.inRangeFor(unit)
	// }

	attack (enemy, renderTime) {
		this.lastAttack = renderTime
		if (!this.stats.bulletSpeed) {
			enemy.takeDamage(this, renderTime, this.stats.attackDamage, this.stats.attackPierce)
		} else {
			new Bullet(this, enemy, this.stats, this.px, this.py, this.base.rotation.z, this.stats.bulletOffset) //TODO top rotation
		}
	}

	isAttackOffCooldown (renderTime) {
		if (this.disableAttacking) {
			return false
		}
		return renderTime - this.lastAttack > this.current.attackCooldown
	}

	getAttackTarget (units) {
		return null
	}

	checkAttack (renderTime) {
		if (this.stunnedUntil > 0) {
			return
		}
		const attackForTick = this.getAttackTarget(allUnits)
		this.isFiring = attackForTick && this.cacheAttackCheck
		if (this.isFiring) {
			this.attack(attackForTick, renderTime)
		}
	}

}

//STATIC

Unit.init = function () {
	allUnits = []
	targetingGround = false
}

Unit.destroy = function () {
	allUnits = null
}

Unit.all = function () {
	return allUnits
}

Unit.get = function (id) {
	for (let idx = allUnits.length - 1; idx >= 0; idx -= 1) {
		const unit = allUnits[idx]
		if (unit.id === id) {
			return unit
		}
	}
	console.error('Target id not found', id, allUnits.map(unit => unit.id))
}

Unit.update = function (renderTime, timeDelta, tweening) {
	let startIndex = allUnits.length - 1
	if (!tweening) {
		// Update before deaths
		for (let idx = startIndex; idx >= 0; idx -= 1) {
			const unit = allUnits[idx]
			if (!unit.static) {
				unit.update(renderTime, timeDelta)
			}
		}
		for (let idx = startIndex; idx >= 0; idx -= 1) {
			const unit = allUnits[idx]
			if (!unit.isDead && unit.isAttackOffCooldown(renderTime)) { //TODO diff for minis?
				unit.checkAttack(renderTime)
			}
		}
		// Die
		for (let idx = startIndex; idx >= 0; idx -= 1) {
			const unit = allUnits[idx]
			if (unit.isDying && !unit.isDead) {
				unit.die(renderTime)
				if (unit.remove) {
					allUnits.splice(idx, 1)
					startIndex -= 1
				}
			}
		}
		// Update after deaths
		for (let idx = startIndex; idx >= 0; idx -= 1) {
			const unit = allUnits[idx]
			if (!unit.isDying) {
				unit.checkTarget(renderTime)
			}
			unit.expireModifiers(renderTime)
		}
	}

	// Tween
	for (let idx = startIndex; idx >= 0; idx -= 1) {
		const unit = allUnits[idx]
		if (unit.updateAnimations) {
			unit.updateAnimations(renderTime)
		}
		if (unit.isDying) {
			continue
		}
		if (unit.tween) {
			unit.tween(renderTime)
		}
		unit.updateAim(timeDelta)

		if (tweening && (!unit.isRendering || unit.isBlocked)) {
			continue
		}
		if (unit.shouldMove()) {
			unit.move(timeDelta, tweening)
		}
	}

	if (targetingGround) {
		const targetRing = Local.game.map.targetRing
		const remainingScale = targetRing.scale.x
		const newScale = remainingScale <= 0.01 ? 0 : Math.pow(remainingScale - 0.007, 1.1)
		if (newScale <= 0) {
			targetRing.visible = false
			targetingGround = false
		} else {
			targetRing.scale.x = newScale
			targetRing.scale.y = newScale
		}
	}
}

export default Unit
