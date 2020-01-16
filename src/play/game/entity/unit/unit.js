import store from '@/store'

import Bridge from '@/play/events/bridge'

import { TICK_DURATION, TICKS_PER_SECOND, MATH_DIVIDE, MATH_SUBTRACT, STAT_ARMOR, STAT_DAMAGE_OVER_TIME, STAT_MOVE_SPEED, STAT_SIGHT_RANGE } from '@/play/data/constants'
import Local from '@/play/local'

import Render from '@/play/render/render'

import Animate from '@/play/game/helpers/animate'
import Float from '@/play/game/helpers/float'
import Util from '@/play/game/util'

import Bullet from '@/play/game/entity/attack/bullet'

//LOCAL

let allUnits = null

const calculateArmor = (armor) => {
	return armor <= 0 ? 1 : Float.divide(100, Float.add(100, Float.divide(armor, 2)))
}

//CLASS

class Unit {

	constructor (team, statBase, unitScale, sx, sy, startAngle, isLocal, renderInBackground) {
		this.team = team
		const localAlly = team === Local.player.team
		this.localAlly = localAlly
		this.isRendering = localAlly
		this.startAngle = startAngle
		this.damagers = {}
		this.isLocal = isLocal
		this.cacheMoveSpeed = 0
		this.cacheAttackCheck = false
		this.expiringModifiers = []
		this.afflictions = {
			Whirlpool: {},
		}

		this.renderInBackground = renderInBackground
		this.movable = false
		this.attackTarget = null
		this.attackTargetAim = null
		this.isAttackingTargetedUnit = false
		this.requiresSightOfTarget = true
		this.bulletCount = 0
		this.height = 0
		this.static = !statBase.healthMax
		this.disableAttacking = this.static
		this.untargetable = this.static
		this.stunnedUntil = 0
		this.attackPierceBonus = 0
		this.isDead = false
		this.isDying = false

		this.fogRadius = null
		this.fogCircle = null
		this.minimapCircle = null

		this.container = Render.group()
		this.model = Render.group()
		this.base = Render.group()
		this.top = Render.group()
		this.floor = Render.group()

		this.model.add(this.base)
		this.model.add(this.top)
		this.container.add(this.model)
		this.container.add(this.floor)
		Local.game.map.floorContainer.add(this.container)

		if (!localAlly && !renderInBackground) {
			this.container.visible = false
		}

		Animate.apply(this)

		// Stats

		const sightRange = statBase.sightRange[0] * 100
		this.stats = {
			sightRange,
			dot: 0,
		}
		this.current = {
			sightRange,
			dot: 0,
		}
		this.sightRangeCheck = Util.squared(sightRange)

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
			this.stats.attackRange = statBase.attackRange[0] * 100
			this.stats.attackDamage = statBase.attackDamage[0] * 100
			this.stats.attackPierce = statBase.attackPierce[0] * 100
			this.stats.attackCooldown = statBase.attackCooldown[0] * 100
			this.stats.bulletSpeed = statBase.bulletSpeed
			this.stats.bulletOffset = statBase.bulletOffset
			this.stats.collision = statBase.collision * 100
			this.collisionCheck = Util.squared(this.stats.collision)
			this.stats.bulletSize = statBase.bulletSize
			this.stats.bulletColor = statBase.bulletColor

			this.turnSpeed = statBase.turnSpeed || 8
			this.turnToMove = statBase.turnToMove || false
			this.aimingToAttack = !this.turnToMove
			this.aimingToMove = !this.turnToMove

			this.healthRemaining = this.stats.healthMax
			this.healthRegenCheck = 0
			this.attackRangeCheck = Util.squared(this.stats.attackRange)
			this.armorCheck = calculateArmor(this.stats.armor)
			if (this.stats.healthRegen) {
				this.addHealthRegen(0)
			}

			this.lastAttack = 0

			// Modifiers
			this.modifiers = {
				shield: [],
				dot: [],
				armor: [],
				attackCooldown: [],
				sightRange: [],
			}
			this.updateModifiers()
			if (statBase.moveSpeed) {
				this.modifiers.moveSpeed = []
				this.stats.moveSpeed = statBase.moveSpeed[0]
				this.modify('Constant', STAT_MOVE_SPEED, MATH_DIVIDE, TICKS_PER_SECOND * 5)
			}
			this.modify('Constant', STAT_DAMAGE_OVER_TIME, MATH_DIVIDE, TICKS_PER_SECOND / 10)

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

	addHealthRegen (regen) {
		this.stats.healthRegen += regen
		const regenPerTick = Float.divide(this.stats.healthRegen, TICKS_PER_SECOND / 10)
		this.healthRegenCheck = Math.round(regenPerTick)
		this.healthRegenCheckCombat = Math.round(Float.divide(regenPerTick, 3))
	}

	playSound (buffer) {
		if (!buffer) {
			return console.error('playSound')
		}
		this.audio.setBuffer(buffer)
		this.audio.play()
	}

	allyNotLocal () {
		return this.localAlly
	}

	updateModifiers () {
		for (const statName in this.modifiers) {
			this.modify(null, statName)
		}
	}

	modifierIndex (statName, key) {
		const statModifiers = this.modifiers[statName]
		if (statModifiers) {
			for (let idx = statModifiers.length - 1; idx >= 0; idx -= 1) {
				const mod = statModifiers[idx]
				if (mod[0] === key) {
					return idx
				}
			}
		}
		return -1
	}

	cancelModifiers (statName) {
		const statModifiers = this.modifiers[statName]
		let canceled = false
		for (let idx = statModifiers.length - 1; idx >= 0; idx -= 1) {
			const mod = statModifiers[idx]
			canceled = true
			const oldCallback = mod[4]
			if (oldCallback) {
				oldCallback()
			}
		}
		this.modifiers[statName] = []
		if (canceled) {
			this.modify(null, statName)
			if (this.selected) {
				store.modifierStats(this)
			}
		}
	}

	expireModifiers (renderTime) {
		let expiredAny = false
		const expiringModifiers = this.expiringModifiers
		for (let expireIndex = expiringModifiers.length - 1; expireIndex >= 0; expireIndex -= 1) {
			const expiring = expiringModifiers[expireIndex]
			if (renderTime >= expiring[2]) {
				const modifierKey = expiring[0]
				const statName = expiring[1]
				const statModifiers = this.modifiers[statName]
				for (let modifierIndex = statModifiers.length - 1; modifierIndex >= 0; modifierIndex -= 1) {
					const mod = statModifiers[modifierIndex]
					if (modifierKey === mod[0]) {
						expiredAny = true
						expiringModifiers.splice(expireIndex, 1)
						statModifiers.splice(modifierIndex, 1)
						this.modify(null, statName)
						const oldCallback = mod[4]
						if (oldCallback) {
							oldCallback()
						}
						break
					}
				}
			}
		}
		if (expiredAny && this.selected) {
			store.modifierStats(this)
		}
	}

	modifyData (renderTime, data) {
		this.modify(data.name, data.stat, data.method, data.value, renderTime + data.duration)
	}

	modify (modifierKey, statName, method, value, ending, callback) {
		const statModifiers = this.modifiers[statName]
		if (!statModifiers) {
			return console.error('Invalid modifier', modifierKey, statName, value)
		}
		const changingModifier = modifierKey !== null
		if (changingModifier) {
			const oldIndex = this.modifierIndex(statName, modifierKey)
			if (method === null) {
				if (oldIndex !== -1) {
					const mod = statModifiers[oldIndex]
					const oldCallback = mod[4]
					if (oldCallback) {
						oldCallback()
					}
					statModifiers.splice(oldIndex, 1)
				}
			} else {
				const mod = [ modifierKey, Float[method], value, ending, callback ]
				if (oldIndex !== -1) {
					statModifiers[oldIndex] = mod
				} else {
					statModifiers.push(mod)
				}
				if (ending) {
					let existingEnding = false
					for (const expiring of this.expiringModifiers) {
						if (expiring[0] === modifierKey) {
							existingEnding = true
							expiring[2] = ending
							break
						}
					}
					if (!existingEnding) {
						this.expiringModifiers.push([ modifierKey, statName, ending ])
					}
				}
			}
		}
		let result = this.stats[statName]
		for (let idx = statModifiers.length - 1; idx >= 0; idx -= 1) {
			const mod = statModifiers[idx]
			const mathMethod = mod[1]
			const byValue = mod[2]
			result = mathMethod(result, byValue)
		}
		this.current[statName] = result
		if (statName === STAT_MOVE_SPEED) {
			this.cacheMoveSpeed = result / TICK_DURATION
		} else if (statName === STAT_SIGHT_RANGE) {
			this.sightRangeCheck = Util.squared(result)
		} else if (statName === STAT_ARMOR) {
			this.armorCheck = calculateArmor(result)
		}
		if (changingModifier && this.selected) {
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
		targetRing.animations = []
		targetRing.queueAnimation(null, 'scale', {
			axis: 'xy',
			from: 1,
			to: 0,
			pow: 0.7,
			start: store.state.game.renderTime,
			duration: 500,
		})
	}

	setSelection (color) {
		const isVisible = color !== null
		this.selectionIndicator.visible = isVisible
		if (isVisible) {
			this.selectionIndicator.material.color.setHex(color)
		}
	}

	opacity (opacity) {
		const isTransluscent = opacity < 1
		this.model.traverse((node) => {
			if (node.material && !node.fixedTransparency) {
				if (node.material.transparent !== isTransluscent) {
					node.material.transparent = isTransluscent
					node.castShadow = !isTransluscent
				}
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
		if ((!Local.unitTarget || this.id !== Local.unitTarget.id) && (!this.tower || store.state.local.skills.hitsTowers)) {
			Local.unitTarget = this
			if (store.state.local.skills.getUnitTarget && store.state.local.skills.withAlliance === this.localAlly) {
				this.setSelection(0xff0000)
			}
		}
		document.body.style.cursor = 'pointer'
	}

	onBlur () {
		if (this === Local.unitTarget) {
			Local.unitTarget = null
			if (store.state.local.skills.getUnitTarget) {
				this.setSelection(null)
			}
		}
		document.body.style.cursor = null
	}

	onClick (point, rightClick) {
		if (!rightClick) {
			setTimeout(() => {
				store.setSelectedUnit(this)
			}, 0)
		}
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
		if (!rightClick) {
			return false
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

		const angle = this.startAngle || (Float.multiply(-Math.PI, 1.5 * (this.team === 0 ? -1 : 1)))
		this.top.aim = angle
		this.top.rotation.z = angle
		this.base.aim = angle
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

	update (renderTime, _timeDelta) {
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
		if (newHealth !== null) {
			// if (!Number.isInteger(newHealth)) { //TODO debug only
			// 	console.error('newHealth', newHealth)
			// }
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
		let regen = this.healthRegenCheck
		const dot = this.current.dot
		if (regen || dot) {
			if (regen && this.isFiring) {
				regen = this.healthRegenCheckCombat
			}
			regen -= dot
			this.addHealth(regen)
		}
	}

	takeDamage (source, renderTime, amount, pierce, reflected) {
		let damage = amount
		if (!reflected) {
			const armorMultiplier = pierce
				? (pierce > 9000 ? 1 : calculateArmor(this.current.armor - pierce))
				: this.armorCheck
			damage = Math.round(Float.multiply(damage, armorMultiplier))

			if (this.reflectDamageRatio) {
				const reflectedDamage = Math.floor(Float.multiply(damage, this.reflectDamageRatio))
				source.takeDamage(this, renderTime, reflectedDamage, 0, true)
			}
			if (this.repairDamageRatio) {
				const duration = 2000
				const healthPer = Math.floor(Float.multiply(this.repairDamageRatio, damage) / (duration / 100))
				this.modify(`${source.id}${renderTime}`, STAT_DAMAGE_OVER_TIME, MATH_SUBTRACT, healthPer, renderTime + duration)
			}
		}
		let dealDamage = damage
		if (!reflected && this.current.shield) {
			this.current.shield -= dealDamage
			if (this.current.shield <= 0) {
				dealDamage = -this.current.shield
				this.current.shield = 0
				this.cancelModifiers('shield')
			} else {
				dealDamage = 0
			}
		}
		if (dealDamage) {
			const newHealth = Math.max(this.healthRemaining - dealDamage, 0)
			if (newHealth === 0) {
				this.isDying = true
			}
			this.updateHealth(newHealth)
		}

		if (!reflected && damage > 0) {
			if (source.displayStats) {
				source.displayStats.damage += damage
			}
			if (source.onDamageDealt) {
				source.onDamageDealt(renderTime, source, this, damage)
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
		}
		return damage
	}

	die (time, _isRetro) {
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
			}
			this.isAttackingTargetedUnit = false
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

	checkUpdateTarget (_renderTime) {
	}

	checkTarget (renderTime) {
		if (this.attackTarget) {
			if (!this.attackTarget.targetable() || !this.canSee(this.attackTarget)) {
				this.checkLoseTarget()
			} else {
				this.checkUpdateTarget(renderTime)
			}
		}
	}

	// Aim

	angleTo (container, destAngle, timeDelta, tweening) {
		const currentAngle = tweening ? container.rotation.z : container.aim
		const angleDiff = Util.radianDistance(currentAngle, destAngle, tweening)
		const turnDistance = tweening ? (this.turnSpeed * timeDelta / 2000) : Float.divide(this.turnSpeed * timeDelta, 2000)
		let newAngle
		if (Math.abs(angleDiff) < turnDistance) {
			newAngle = destAngle
		} else {
			const spinDirection = angleDiff < 0 ? -1 : 1
			if (tweening) {
				newAngle = currentAngle + (turnDistance * spinDirection)
			} else {
				newAngle = Float.add(currentAngle, Float.multiply(turnDistance, spinDirection))
			}
		}
		container.rotation.z = newAngle
		if (!tweening) {
			container.aim = newAngle
		}
		return newAngle
	}

	updateAim (timeDelta, tweening) {
		let aimTop
		if (this.attackTarget) {
			if (tweening) {
				aimTop = this.attackTargetAim
			} else {
				aimTop = Util.radiansBetween(this, this.attackTarget)
				this.attackTargetAim = aimTop
			}
		}
		const priorityAngle = (this.moveDestination && !this.moveToTarget) ? this.moveTargetAngle : null
		let aimingToMove = !tweening && this.turnToMove ? null : undefined
		if (!aimTop) {
			aimTop = priorityAngle
		}
		if (this.player) {
			let aimBase = priorityAngle
			if (!aimBase) {
				aimBase = aimTop
			}
			if (aimBase) {
				const newAngle = this.angleTo(this.base, aimBase, timeDelta, tweening)
				if (aimingToMove === null) {
					aimingToMove = newAngle === aimBase
				}
			}
		}
		if (aimTop) {
			const newAngle = this.angleTo(this.top, aimTop, timeDelta * 2, tweening)
			if (!tweening) {
				const aimingToAttack = newAngle === aimTop
				this.aimingToAttack = aimingToAttack
				if (aimingToMove === null) {
					aimingToMove = aimingToAttack
				}
			}
		}
		if (aimingToMove !== null && aimingToMove !== undefined) {
			this.aimingToMove = aimingToMove
		}
	}

	// Visibility

	isGloballyVisible () {
		return this.isDying || this.isFiring || this.renderInBackground
	}

	hasSightOf (unit) {
		return !this.isDead && this.distanceTo(unit) < this.sightRangeCheck
	}

	canSee (enemy) {
		return !enemy.invisible && (enemy.isGloballyVisible() || this.hasSightOf(enemy))
	}

	// Attack

	inRangeFor (unit) {
		const rangeCheck = this.targetingSkill ? this.targetingSkill.rangeCheck : this.attackRangeCheck
		return this.distanceTo(unit) < rangeCheck
	}

	damageable () {
		return !this.isDead && !this.untargetable
	}
	targetable () {
		return !this.isDead && !this.untargetable && !this.invisible
	}

	attack (enemy, renderTime, sound) {
		this.lastAttack = renderTime
		if (!this.stats.bulletSpeed) {
			enemy.takeDamage(this, renderTime, this.stats.attackDamage, this.stats.attackPierce + this.attackPierceBonus)
		} else {
			new Bullet(this, enemy, this.stats, this.stats.bulletOffset)
			if (sound) {
				this.playSound(sound)
			}
		}
	}

	isAttackOffCooldown (renderTime) {
		if (this.disableAttacking) {
			return false
		}
		return renderTime - this.lastAttack > this.current.attackCooldown
	}

	getAttackTarget (_units) {
		return null
	}

	checkAttack (renderTime) {
		if (this.stunnedUntil > 0) {
			this.isFiring = false
			return
		}
		if (!this.aimingToAttack || !this.isAttackOffCooldown(renderTime)) {
			return
		}
		const attackForTick = this.getAttackTarget(allUnits)
		const firing = attackForTick !== null && this.cacheAttackCheck
		this.isFiring = firing
		if (firing) {
			this.attack(attackForTick, renderTime)
		}
	}

}

//STATIC

Unit.init = function () {
	allUnits = []
}

Unit.destroy = function () {
	allUnits = null
}

Unit.all = function () {
	return allUnits
}

Unit.get = function (id) {
	for (const unit of allUnits) {
		if (unit.id === id) {
			return unit
		}
	}
	console.error('Target id not found', id, allUnits.map(unit => unit.id))
}

Unit.update = function (renderTime, timeDelta, tweening, isRetro) {
	if (!tweening) {
		for (const unit of allUnits) {
			if (!unit.static) {
				unit.update(renderTime, timeDelta, isRetro)
			}
		}
		// Die
		for (let idx = allUnits.length - 1; idx >= 0; idx -= 1) {
			const unit = allUnits[idx]
			if (unit.isDying && !unit.isDead) {
				unit.die(renderTime, isRetro)
				if (unit.remove) {
					allUnits.splice(idx, 1)
					continue
				}
			}
			unit.expireModifiers(renderTime)
		}
	}
	for (const unit of allUnits) {
		if (unit.isDying) {
			continue
		}
		if (!tweening) {
			unit.checkTarget(renderTime)
		}
		unit.updateAim(timeDelta, tweening)
		if (!tweening && !unit.isDead) {
			unit.checkAttack(renderTime)
		}
	}
	for (const unit of allUnits) {
		if (unit.updateAnimations) {
			unit.updateAnimations(renderTime)
		}
		if (unit.isDying) {
			continue
		}
		if (unit.tween) {
			unit.tween(renderTime)
		}

		if (!tweening || (unit.isRendering && !unit.isBlocked)) {
			if (unit.shouldMove()) {
				unit.move(timeDelta, tweening)
			}
		}
	}

	Local.game.map.targetRing.updateAnimations(renderTime)
}

Unit.calculateArmor = calculateArmor

export default Unit
