import store from '@/app/store'

import { AXIS_X, AXIS_Y, AXIS_Z, MATH_ADD, MATH_MULTIPLY, MATH_SUBTRACT, PERCENT, STAT_ARMOR, STAT_ATTACK_COOLDOWN, STAT_DAMAGE_OVER_TIME, STAT_MOVE_SPEED, TARGET_SELF, TARGET_GROUND, TARGET_ENEMY } from '@/play/data/constants'
import { levelMultiplier, isDisabledBy } from '@/play/data/skillsHelper'

import Render from '@/play/render/render'

import Animate from '@/play/game/helpers/animate'
import Float from '@/play/game/helpers/float'
import { pointDistance } from '@/play/game/util'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Bullet from '@/play/game/entity/attack/bullet'

import Unit from '@/play/game/entity/unit/unit'

export default {

	//CHARGER

	charger: [
		{
			name: 'Lunge',
			description: 'Ram into the first unit you collide with, dealing [[Damage]] to enemies nearby',
			target: TARGET_GROUND,
			hitsTowers: false,
			isDisabledBy: null,
			continueToDestination: true,
			getRange (level) {
				return levelMultiplier(120, level, 10)
			},
			getEffectRange (level) {
				return 80
			},
			getEffectDamage (level) {
				return levelMultiplier(70, level, 10)
			},
			getCooldown (level) {
				return levelMultiplier(100, level, -4)
			},
			start (index, level, ship, target, startAt, endAt, cooldown) {
				ship.modify(this.name, STAT_MOVE_SPEED, MATH_MULTIPLY, 5)
				ship.uncontrollable = true
				ship.disableAttacking = true
				ship.opacity(0.75)

				ship.onStopped = function () {
					// p('cancel charge')
					ship.endSkill(index)
				}
			},
			end (ship, level) {
				ship.onStopped = null
				ship.modify(this.name, STAT_MOVE_SPEED, null)
				ship.opacity(1)
				ship.uncontrollable = false
				ship.disableAttacking = false

				const attackDamage = this.getEffectDamage(level) * 100
				const radius = this.getEffectRange(level)
				new AreaOfEffect(ship, {
					dot: false,
					hitsTowers: this.hitsTowers,
					color: 0x0000ff,
					opacity: 0.5,
					radius,
					attackDamage,
					attackPierce: 0,
				})
			},
		},
		{
			name: 'Quake',
			description: 'Send out tremors that after [[Delay]] stun all enemies nearby for [[Duration]]',
			target: TARGET_SELF,
			hitsTowers: false,
			disabledBy: [true, null, false],
			isDisabledBy: isDisabledBy,
			getRange (level) {
				return levelMultiplier(120, level, 2)
			},
			getEffectDelay (level) {
				return 500
			},
			getEffectDuration (level) {
				return levelMultiplier(10, level, 1) * 100
			},
			getCooldown (level) {
				return levelMultiplier(200, level, -10)
			},
			start (index, level, ship, target, startAt, endAt, cooldown) {
				const radius = this.getRange(level)
				const stunDelay = this.getEffectDelay(level)
				const stunDuration = this.getEffectDuration(level)
				new AreaOfEffect(ship, {
					dot: false,
					hitsTowers: this.hitsTowers,
					color: 0xffaa00,
					opacity: 0.5,
					radius,
					startAt,
					delay: stunDelay,
					stunDuration,
				})
			},
		},
		{
			name: 'Prickle',
			description: 'Heal for [[Strength]] of damage taken, and deal half that amount back as damage to attackers',
			suffixStrength: PERCENT,
			target: TARGET_SELF,
			disabledBy: [false, true, null],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectStrength (level) {
				return levelMultiplier(30, level, 2)
			},
			getDuration (level) {
				return 50
			},
			getCooldown (level) {
				return levelMultiplier(150, level, -10)
			},
			start (index, level, ship) {
				ship.repairDamageRatio = Float.divide(this.getEffectStrength(level), 100)
				ship.reflectDamageRatio = ship.repairDamageRatio / 2
				ship.prickleMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
			},
			end (ship) {
				ship.repairDamageRatio = null
				ship.reflectDamageRatio = null
				if (ship.prickleMesh) {
					Render.remove(ship.prickleMesh)
					ship.prickleMesh = null
				}
			},
		},
	],

	//TEMPEST

	tempest: [
		{
			name: 'Bolt',
			description: 'Strike enemies inside after [[Delay]] for [[Damage]]',
			target: TARGET_GROUND,
			hitsTowers: false,
			disabledBy: [null, true, false],
			isDisabledBy: isDisabledBy,
			endOnDeath: false,
			getEffectDelay (level) {
				return 300
			},
			getEffectRange (level) {
				return 60
			},
			getEffectDamage (level) {
				return levelMultiplier(80, level, 10)
			},
			getRange (level) {
				return levelMultiplier(80, level, 5)
			},
			getCooldown (level) {
				return levelMultiplier(100, level, -5)
			},
			start (index, level, ship, target, startAt) {
				const delay = this.getEffectDelay(level)
				const radius = this.getEffectRange(level)
				const attackDamage = this.getEffectDamage(level) * 100
				new AreaOfEffect(ship, {
					dot: false,
					hitsTowers: this.hitsTowers,
					color: 0xffff00,
					opacity: 0.9,
					px: target[0], py: target[1],
					radius,
					startAt,
					delay: delay,
					attackDamage,
					attackPierce: 0,
				})
			},
		},
		{
			name: 'Scud',
			description: 'Blink to the target destination. Reusing within [[Cooldown]] increases its cooldown.',
			target: TARGET_GROUND,
			isDisabledBy: null,
			startsImmediately: false,
			hideDuration: true,
			getRange (level) {
				return levelMultiplier(110, level, 10)
			},
			getDuration (level) {
				return 3
			},
			getEffectCooldown (level) {
				return levelMultiplier(12000, level, -800)
			},
			getCooldown (level) {
				return levelMultiplier(40, level, -2)
			},
			start (index, level, ship, target, startAt, endAt, cooldown, isLocal) {
				ship.customPosition = true
				ship.uncontrollable = true
				ship.untargetable = true
				ship.disableAttacking = true

				const cooldownCooldown = this.getEffectCooldown(level) + cooldown
				if (isLocal) {
					store.state.local.skills.internal[index] = startAt + cooldownCooldown
				}
				if (ship.scudAt) {
					const diff = cooldownCooldown - (startAt - ship.scudAt)
					if (diff > 0) {
						const cooldownEnd = ship.skills.cooldowns[index]
						ship.updateCooldown(index, cooldownEnd, diff * 3)
						// p(diff)
					}
				}
				ship.scudAt = startAt

				let destX = target[0]
				let destY = target[1]
				while (ship.blocked(destX, destY)) { //TODO prevent going backwards
					// p('Blocked', destX, destY, ship.moveX, ship.moveY)
					destX -= ship.moveX
					destY -= ship.moveY
				}

				const duration = endAt - startAt
				ship.queueAnimation('container', 'position', {
					axis: AXIS_X,
					from: ship.px / 100,
					to: destX / 100,
					pow: 2,
					start: startAt,
					duration: duration,
				})
				ship.queueAnimation('container', 'position', {
					axis: AXIS_Y,
					from: ship.py / 100,
					to: destY / 100,
					pow: 2,
					start: startAt,
					duration: duration,
				})

				ship.px = destX
				ship.py = destY

				ship.queueAnimation('top', 'position', {
					child: 0,
					axis: AXIS_Z,
					from: 0,
					to: 0,
					parabola: 4,
					max: 768,
					start: startAt,
					duration: duration - 50,
				})
				ship.queueAnimation('top', 'opacity', {
					child: 0,
					from: 1,
					to: 1,
					parabola: 4,
					max: -1,
					start: startAt,
					duration: duration - 50,
				})
			},
			end (ship) {
				ship.customPosition = false
				ship.uncontrollable = false
				ship.untargetable = false
				ship.disableAttacking = false
			},
		},
		{
			name: 'Chain strike',
			description: 'Lightning passes through enemies within [[Range]] of eachother, dealing [[Damage]] to each',
			target: TARGET_ENEMY,
			hitsTowers: true,
			disabledBy: [false, true, null],
			isDisabledBy: isDisabledBy,
			getEffectRange (level) {
				return 70
			},
			getEffectPropagates (level) {
				return 5
			},
			getEffectDamage (level) {
				return levelMultiplier(70, level, 5)
			},
			getRange (level) {
				return 140
			},
			getCooldown (level) {
				return levelMultiplier(100, level, -5)
			},
			start (index, level, ship, target) {
				const attackDamage = this.getEffectDamage(level) * 100
				const propagateRange = this.getEffectRange(level)
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 10,
					bulletColor: 0xdddd00,
					attackDamage,
					attackPierce: 10,
					bulletSpeed: 7,
					propagateRange,
				}
				new Bullet(ship, target, bulletData)
			},
		},
	],

	//STITCHES

	stitches: [
		{
			name: `Repair Wave`,
			description: 'Repair nearby allies for [[Regen]]',
			toggle: 10,
			target: TARGET_SELF,
			disabledBy: [null, true, true],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectRegen (level) {
				return levelMultiplier(100, level, 10)
			},
			getRange (level) {
				return 140
			},
			getCooldown (level) {
				return levelMultiplier(90, level, -6)
			},
			activate (index, level, ship) {
				const radius = this.getRange(level)
				const healthRegen = this.getEffectRegen(level)
				new AreaOfEffect(ship, {
					dot: false,
					follow: true,
					color: 0x00ff77,
					opacity: 0.2,
					radius,
					allies: true,
					modify: {
						name: this.name,
						stat: STAT_DAMAGE_OVER_TIME,
						method: MATH_SUBTRACT,
						value: healthRegen,
						duration: 1000,
					},
				})
			},
		},
		{
			name: 'Turbo Wave',
			description: 'Speed up nearby allies by [[MoveSpeed]]',
			toggle: 10,
			suffixMoveSpeed: PERCENT,
			target: TARGET_SELF,
			disabledBy: [true, null, true],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectMoveSpeed (level) {
				return levelMultiplier(30, level, 3)
			},
			getRange (level) {
				return 140
			},
			getCooldown (level) {
				return levelMultiplier(90, level, -6)
			},
			activate (index, level, ship) {
				const radius = this.getRange(level)
				const moveSpeed = Float.add(1, Float.divide(this.getEffectMoveSpeed(level), 100))
				new AreaOfEffect(ship, {
					dot: false,
					follow: true,
					color: 0xff7700,
					opacity: 0.2,
					radius,
					allies: true,
					modify: {
						name: this.name,
						stat: STAT_MOVE_SPEED,
						method: MATH_MULTIPLY,
						value: moveSpeed,
						duration: 1000,
					},
				})
			},
		},
		{
			name: 'Power Wave',
			description: 'Boost nearby allies\' attack speed by [[AttackSpeed]]',
			toggle: 10,
			suffixAttackSpeed: PERCENT,
			target: TARGET_SELF,
			disabledBy: [true, true, null],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectAttackSpeed (level) {
				return levelMultiplier(30, level, 3)
			},
			getRange (level) {
				return 140
			},
			getCooldown (level) {
				return levelMultiplier(90, level, -6)
			},
			activate (index, level, ship) {
				const radius = this.getRange(level)
				const attackCooldown = Float.subtract(1, Float.divide(this.getEffectAttackSpeed(level), 100))
				new AreaOfEffect(ship, {
					dot: false,
					follow: true,
					color: 0xff00cc,
					opacity: 0.2,
					radius,
					allies: true,
					modify: {
						name: this.name,
						stat: STAT_ATTACK_COOLDOWN,
						method: MATH_MULTIPLY,
						value: attackCooldown,
						duration: 1000,
					},
				})
			},
		},
	],

	//BEEDLE

	beedle: [
		{
			name: `Poison Sting`,
			description: 'Deals [[Damage]] to the target, and slowing by [[MoveSpeed]] for [[Duration]]. If target is [[poisoned:poison]], they are stunned instead.',
			suffixMoveSpeed: PERCENT,
			hitsTowers: false,
			target: TARGET_ENEMY,
			isDisabledBy: null,
			getEffectMoveSpeed (level) {
				return levelMultiplier(50, level, 2)
			},
			getEffectDuration (level) {
				return levelMultiplier(20, level, 2) * 100
			},
			getEffectDamage (level) {
				return levelMultiplier(40, level, 5)
			},
			getRange (level) {
				return 120
			},
			getCooldown (level) {
				return 100
			},
			start (index, level, ship, target) {
				const attackDamage = this.getEffectDamage(level) * 100
				const moveSpeed = Float.subtract(1, Float.divide(this.getEffectMoveSpeed(level), 100))
				const stunDuration = this.getEffectDuration(level)
				const maxRange = this.getRange(level)
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 10,
					bulletColor: 0xdddd00,
					attackDamage,
					attackPierce: 10,
					bulletSpeed: 8,
					maxRange,
					modify: {
						name: 'Poison',
						stat: STAT_MOVE_SPEED,
						method: MATH_MULTIPLY,
						value: moveSpeed,
						duration: 1000,
					},
					stunDuration,
					dodgeable: true,
				}
				new Bullet(ship, target, bulletData)
			},
		},
		{
			name: 'Acid Drop',
			description: 'Spit a toxic glob on the ground for [[Duration]], [[poisoning:poison]] enemies for [[Dps]] and [[MoveSpeed]] move speed',
			suffixMoveSpeed: PERCENT,
			target: TARGET_GROUND,
			hitsTowers: true,
			isDisabledBy: null,
			getRange (level) {
				return 160
			},
			getEffectRange (level) {
				return 60
			},
			getEffectDuration (level) {
				return levelMultiplier(10, level, 1) * 100
			},
			getEffectMoveSpeed (level) {
				return levelMultiplier(25, level, 2)
			},
			getEffectDps (level) {
				return levelMultiplier(40, level, 5)
			},
			getCooldown (level) {
				return levelMultiplier(180, level, -10)
			},
			start (index, level, ship, target) {
				const dps = this.getEffectDps(level) * 100
				const explosionRadius = this.getEffectRange(level)
				const effectDuration = this.getEffectDuration(level)
				const moveSpeed = Float.subtract(1, Float.divide(this.getEffectMoveSpeed(level), 100))
				const bulletData = {
					dot: true,
					hitsTowers: this.hitsTowers,
					opacity: 0.5,
					bulletSize: 9,
					bulletColor: 0x00ff00,
					attackDamage: dps,
					attackPierce: 0,
					bulletSpeed: 10,
					explosionRadius,
					effectDuration,
					allies: false,
					modify: {
						name: 'Poison',
						stat: STAT_MOVE_SPEED,
						method: MATH_MULTIPLY,
						value: moveSpeed,
						duration: effectDuration,
					},
				}
				new Bullet(ship, target, bulletData)
			},
		},
		{
			name: 'Enrage',
			description: 'Boost attack speed [[AttackSpeed]], and movement speed [[MoveSpeed]]',
			suffixAttackSpeed: PERCENT,
			suffixMoveSpeed: PERCENT,
			target: TARGET_SELF,
			isDisabledBy: null,
			endOnDeath: true,
			getEffectAttackSpeed (level) {
				return levelMultiplier(30, level, 3)
			},
			getEffectMoveSpeed (level) {
				return levelMultiplier(20, level, 4)
			},
			getDuration (level) {
				return 50
			},
			getCooldown (level) {
				return levelMultiplier(150, level, -5)
			},
			start (index, level, ship) {
				ship.modify(this.name, STAT_ATTACK_COOLDOWN, MATH_MULTIPLY, Float.subtract(1, Float.divide(this.getEffectAttackSpeed(level), 100)))
				ship.modify(this.name, STAT_MOVE_SPEED, MATH_MULTIPLY, Float.add(1, Float.divide(this.getEffectMoveSpeed(level), 100)))

				ship.enrageMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
			},
			end (ship) {
				ship.modify(this.name, STAT_ATTACK_COOLDOWN, null)
				ship.modify(this.name, STAT_MOVE_SPEED, null)
				if (ship.enrageMesh) {
					Render.remove(ship.enrageMesh)
					ship.enrageMesh = null
				}
			},
		},
	],

	//PROPPY

	proppy: [
		{
			name: 'Rocket',
			description: 'Strikes the first enemy hit for [[Damage]]',
			target: TARGET_GROUND,
			hitsTowers: true,
			disabledBy: [null, true, false],
			isDisabledBy: isDisabledBy,
			getRange (level) {
				return levelMultiplier(150, level, 5)
			},
			getEffectDamage (level) {
				return levelMultiplier(100, level, 15)
			},
			getCooldown (level) {
				return levelMultiplier(80, level, -4)
			},
			start (index, level, ship, target) {
				const attackDamage = this.getEffectDamage(level) * 100
				const maxRange = this.getRange(level)
				const bulletData = {
					toMaxRange: true,
					hitsTowers: this.hitsTowers,
					bulletSize: 12,
					bulletColor: 0xcc0000,
					attackDamage,
					attackPierce: 10,
					bulletSpeed: 12,
					maxRange: maxRange,
					collides: true,
					pierces: false,
				}
				new Bullet(ship, target, bulletData)
			},
		},
		{
			name: 'Barrel Roll',
			description: 'Burst forward while dodging out of incoming fire with this timeless aerial maneuver',
			target: TARGET_GROUND,
			isDisabledBy: null,
			startsImmediately: true,
			continueToDestination: true,
			getRange (level) {
				return levelMultiplier(120, level, 10) //TODO calculate
			},
			getDuration (level) {
				return levelMultiplier(5, level, 1)
			},
			getCooldown (level) {
				return levelMultiplier(150, level, -10)
			},
			start (index, level, ship, target, startAt, endAt, cooldown) {
				ship.modify(this.name, STAT_MOVE_SPEED, MATH_MULTIPLY, 3)
				ship.base.aim = ship.moveTargetAngle
				ship.base.rotation.z = ship.moveTargetAngle
				ship.uncontrollable = true
				ship.untargetable = true
				ship.disableAttacking = true
				ship.opacity(0.75)

				ship.onStopped = function () {
					// p('cancel barrel roll')
					ship.updateCooldown(index, store.state.game.renderTime, cooldown)
					ship.endSkill(index)
				}

				const duration = (endAt - startAt) - 100
				const angleChange = Math.PI * 2
				ship.queueAnimation('base', 'rotation', {
					child: 1,
					axis: AXIS_X,
					from: 0.5 * Math.PI,
					to: 0.5 * Math.PI,
					parabola: 2,
					max: angleChange,
					start: startAt,
					duration: duration,
				})
				ship.queueAnimation('model', 'position', {
					axis: AXIS_Z,
					from: 0,
					to: 0,
					parabola: 4,
					max: 60,
					start: startAt,
					duration: duration,
				})
				ship.propGroup.visible = false
			},
			end (ship) {
				ship.modify(this.name, STAT_MOVE_SPEED, null)
				ship.onStopped = null
				ship.propGroup.visible = true
				ship.base.rotation.x = 0

				ship.uncontrollable = false
				ship.untargetable = false
				ship.disableAttacking = false
				ship.opacity(1)
			},
		},
		{
			name: 'Rebound',
			description: 'Attacking heals for [[Rebound]] of damage dealt',
			suffixRebound: PERCENT,
			target: TARGET_SELF,
			disabledBy: [false, true, null],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectRebound (level) {
				return levelMultiplier(40, level, 5)
			},
			getDuration (level) {
				return levelMultiplier(50, level, 5)
			},
			getCooldown (level) {
				return levelMultiplier(120, level, -5)
			},
			start (index, level, ship) {
				ship.rebound = Float.divide(this.getEffectRebound(level), 100)
				ship.reboundMesh = Render.outline(ship.base.children[1], 0x0000ff, 1.07)
			},
			end (ship) {
				ship.rebound = null
				if (ship.reboundMesh) {
					Render.remove(ship.reboundMesh)
					ship.reboundMesh = null
				}
			},
		},
	],

	//PULTER

	pulter: [
		{
			name: 'Scorpio',
			description: 'Pierces all enemies hit for [[Damage]], ignoring armor',
			target: TARGET_GROUND,
			hitsTowers: true,
			isDisabledBy: null,
			getRange (level) {
				return 200
			},
			getCooldown (level) {
				return 120
			},
			getEffectDamage (level) {
				return levelMultiplier(100, level, 10)
			},
			start (index, level, ship, target) {
				const attackDamage = this.getEffectDamage(level) * 100
				const maxRange = this.getRange(level)
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 9,
					bulletColor: 0xcc00ff,
					attackDamage,
					attackPierce: 9001,
					bulletSpeed: 5,
					maxRange,
					toMaxRange: true,
					collides: true,
					pierces: true,
				}
				new Bullet(ship, target, bulletData)
			},
		},
		{
			name: `Fling`,
			description: 'Hurls a large shell that explodes on impact for [[Damage]] to enemies within [[Range]]',
			target: TARGET_GROUND,
			hitsTowers: false,
			isDisabledBy: null,
			getEffectRange (level) {
				return levelMultiplier(60, level, 5)
			},
			getEffectDamage (level) {
				return levelMultiplier(100, level, 10)
			},
			getRange (level) {
				return levelMultiplier(200, level, 10)
			},
			getCooldown (level) {
				return 240
			},
			start (index, level, ship, target, startAt, endAt) {
				const explosionRadius = this.getEffectRange(level)
				const attackDamage = this.getEffectDamage(level) * 100
				const maxRange = this.getRange(level)
				const bulletSpeed = 4
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 8,
					bulletColor: 0x660066,
					attackDamage,
					attackPierce: 10,
					bulletSpeed: bulletSpeed,
					maxRange: maxRange,
					explosionRadius,
				}
				const flingBullet = new Bullet(ship, target, bulletData)
				Animate.apply(flingBullet)
				const moveConstant = flingBullet.moveConstant
				const animationDuration = Math.sqrt(pointDistance(ship.px, ship.py, target[0], target[1])) / moveConstant / 1000
				flingBullet.queueAnimation('container', 'position', {
					axis: AXIS_Z,
					from: 0,
					to: 0,
					parabola: 2,
					max: maxRange,
					start: startAt,
					duration: animationDuration,
				})
			},
		},
		{
			name: 'Rearm',
			description: 'Removes [[Duration]] from the cooldown of other abilities',
			target: TARGET_SELF,
			isDisabledBy: null,
			minLeveled: 1,
			activatable () {
				return store.state.local.skills.cooldowns[0] || store.state.local.skills.cooldowns[1]
			},
			getEffectDuration (level) {
				return levelMultiplier(80, level, 40) * 100
			},
			getCooldown (level) {
				return levelMultiplier(500, level, -40)
			},
			start (index, level, ship, target, startAt, endAt) {
				const reduction = this.getEffectDuration(level)
				for (let skillIndex = 0; skillIndex < 2; skillIndex += 1) {
					const cooldownEnd = ship.skills.cooldowns[skillIndex]
					if (cooldownEnd > startAt) {
						ship.updateCooldown(skillIndex, cooldownEnd, -reduction)
					}
				}
			},
		},
	],

	//BOXY

	boxy: [
		{
			name: 'Box Shield',
			description: 'Shields you from up to [[Damage]] while active',
			target: TARGET_SELF,
			isDisabledBy: null,
			endOnDeath: true,
			getEffectDamage (level) {
				return levelMultiplier(200, level, 30)
			},
			getDuration (level) {
				return levelMultiplier(40, level, 2)
			},
			getCooldown (level) {
				return levelMultiplier(120, level, -5)
			},
			start (index, level, ship, target, startAt, endAt) {
				const shieldDamage = this.getEffectDamage(level) * 100
				ship.modify(`${ship.id}${this.name}`, 'shield', MATH_ADD, shieldDamage, endAt, () => {
					// p('cancel shield')
					ship.endSkill(index)
				})
				ship.shieldMesh = Render.sphere(ship.stats.collision / 100 * 1.8, { parent: ship.model, segments: 16, color: 0xffffff, opacity: 0.33, hideOutline: true, hideShadow: true })
				ship.shieldMesh.position.z = 15
			},
			end (ship) {
				if (ship.shieldMesh) {
					Render.remove(ship.shieldMesh)
					ship.shieldMesh = null
				}
			},
		},
		{
			name: `Storm's Eye`,
			description: 'Allies inside the eye gain [[Armor]]',
			suffixArmor: ' armor',
			target: TARGET_SELF,
			hitsTowers: false,
			isDisabledBy: null,
			endOnDeath: false,
			getEffectArmor (level) {
				return levelMultiplier(30, level, 2)
			},
			getRange (level) {
				return 150
			},
			getDuration (level) {
				return levelMultiplier(35, level, 2)
			},
			getCooldown (level) {
				return levelMultiplier(200, level, -10)
			},
			start (index, level, ship, target, startAt, endAt) {
				const radius = this.getRange(level)
				const armor = this.getEffectArmor(level)
				new AreaOfEffect(ship, {
					dot: true,
					hitsTowers: this.hitsTowers,
					color: 0x0066aa,
					opacity: 0.33,
					radius,
					allies: true,
					modify: {
						name: this.name,
						stat: STAT_ARMOR,
						method: MATH_ADD,
						value: armor,
						duration: 200,
					},
					startAt,
					endAt,
				})
			},
			end (ship) {
			},
		},
		{
			name: 'Providence',
			description: 'Spawns a seeing-eye that reveals enemies within [[Range]]',
			target: TARGET_GROUND,
			isDisabledBy: null,
			endOnDeath: false,
			getRange (level) {
				return levelMultiplier(160, level, 30)
			},
			getEffectRange (level) {
				return levelMultiplier(80, level, 20)
			},
			getDuration (level) {
				return levelMultiplier(25, level, 5)
			},
			getCooldown (level) {
				return levelMultiplier(300, level, -20)
			},
			start (index, level, ship, target) {
				const sightRange = this.getEffectRange(level)
				const stats = { sightRange: [sightRange, 0] }
				ship.eye = new Unit(ship.team, stats, null, target[0] / 100, target[1] / 100, null, false, true)
				const sphere = Render.sphere(12, { parent: ship.eye.top, team: ship.team, segments: 16 })
				sphere.position.z = levelMultiplier(60, level, 5)
			},
			end (ship) {
				ship.eye.isDying = true
				ship.eye.destroy()
			},
		},
	],

	//SINKER

	sinker: [
		{
			name: 'Torpedo',
			description: 'Fires a self-propelled torpedo that deals [[Damage]].',
			target: TARGET_ENEMY,
			hitsTowers: true,
			disabledBy: [null, false, true],
			isDisabledBy: isDisabledBy,
			getRange (level) {
				return 200
			},
			getEffectDamage (level) {
				return levelMultiplier(100, level, 10)
			},
			getCooldown (level) {
				return levelMultiplier(100, level, -5)
			},
			start (index, level, ship, target) {
				const attackDamage = this.getEffectDamage(level) * 100
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 9,
					bulletColor: 0xcc00ff,
					attackDamage,
					attackPierce: 10,
					bulletSpeed: 1,
					bulletAcceleration: true,
				}
				new Bullet(ship, target, bulletData)
			},
		},
		{
			name: 'Whirlpool',
			description: 'Deals [[Dps]]. When [[Dive:]] ends, heal half your damage to [[Whirlpooled:whirlpool]] enemies.',
			target: TARGET_GROUND,
			hitsTowers: false,
			isDisabledBy: null,
			getRange (level) {
				return 160
			},
			getDuration (level) {
				return 50
			},
			getEffectRange (level) {
				return levelMultiplier(70, level, 5)
			},
			getEffectDps (level) {
				return levelMultiplier(100, level, 5)
			},
			getCooldown (level) {
				return levelMultiplier(170, level, -5)
			},
			start (index, level, ship, target, startAt, endAt) {
				this.whirlpoolDamage = 0

				const dps = this.getEffectDps(level) * 100
				const radius = this.getEffectRange(level)
				new AreaOfEffect(ship, {
					dot: true,
					px: target[0],
					py: target[1],
					hitsTowers: this.hitsTowers,
					color: 0x0066ff,
					opacity: 0.5,
					radius,
					attackDamage: dps,
					attackPierce: 0,
					afflicts: this.name,
					startAt,
					endAt,
				})
			},
			end (ship) {
			},
		},
		{
			name: 'Dive',
			description: 'Dive: deal [[Dps]]. Resurface: heal half your damage to [[Whirlpooled:whirlpool]] enemies.',
			target: TARGET_SELF,
			hitsTowers: false,
			isDisabledBy: null,
			endOnDeath: true,
			getRange (level) {
				return 100
			},
			getEffectMoveSpeed (level) {
				return 25
			},
			getEffectDps (level) {
				return levelMultiplier(30, level, 3)
			},
			getDuration (level) {
				return levelMultiplier(35, level, 2)
			},
			getCooldown (level) {
				return levelMultiplier(150, level, -10)
			},
			start (index, level, ship, target, startAt, endAt) {
				ship.modify(this.name, STAT_MOVE_SPEED, MATH_MULTIPLY, Float.add(1, Float.divide(this.getEffectMoveSpeed(level), 100)))
				ship.removeTarget()
				ship.untargetable = true
				ship.disableAttacking = true

				const radius = this.getRange(level)
				const attackDamage = this.getEffectDps(level) * 100
				new AreaOfEffect(ship, {
					dot: true,
					follow: true,
					hitsTowers: this.hitsTowers,
					color: 0x0066aa,
					opacity: 0.5,
					radius,
					attackDamage,
					attackPierce: 0,
					startAt,
					endAt,
				})

				ship.queueAnimation('model', 'position', {
					axis: AXIS_Z,
					from: 0,
					to: 0,
					parabola: 8,
					max: -27,
					start: startAt,
					duration: endAt - startAt,
				})
			},
			end (ship) {
				ship.modify(this.name, STAT_MOVE_SPEED, null)
				ship.model.position.z = 0
				ship.untargetable = false
				ship.disableAttacking = false

				if (ship.whirlpoolDamage) {
					ship.addHealth(Math.floor(ship.whirlpoolDamage / 2))
					ship.whirlpoolDamage = 0
				}
			},
		},
	],

	//GLITCH

	glitch: [
		{
			name: 'Brute Force',
			description: 'Boosts attack speed [[AttackSpeed]], while more vulnerable to damage',
			suffixAttackSpeed: PERCENT,
			target: TARGET_SELF,
			disabledBy: [null, false, true],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectAttackSpeed (level) {
				return levelMultiplier(40, level, 3)
			},
			getDuration (level) {
				return levelMultiplier(40, level, 2)
			},
			getCooldown (level) {
				return levelMultiplier(150, level, 5)
			},
			start (index, level, ship, target, startAt, endAt) {
				ship.modify(this.name, STAT_ATTACK_COOLDOWN, MATH_MULTIPLY, Float.subtract(1, Float.divide(this.getEffectAttackSpeed(level), 100)))
				ship.modify(this.name, STAT_ARMOR, MATH_MULTIPLY, 0.5)
				ship.bruteForceMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
			},
			end (ship) {
				ship.modify(this.name, STAT_ATTACK_COOLDOWN, null)
				ship.modify(this.name, STAT_ARMOR, null)
				if (ship.bruteForceMesh) {
					Render.remove(ship.bruteForceMesh)
					ship.bruteForceMesh = null
				}
			},
		},
		{
			name: 'Encrypt',
			description: 'Turn invisible and untargetable to enemies, boosting move speed [[MoveSpeed]]',
			suffixMoveSpeed: PERCENT,
			target: TARGET_SELF,
			disabledBy: [false, null, true],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getDuration (level) {
				return levelMultiplier(40, level, 5)
			},
			getEffectMoveSpeed (level) {
				return levelMultiplier(20, level, 3)
			},
			getCooldown (level) {
				return levelMultiplier(200, level, -10)
			},
			start (index, level, ship, target, startAt, endAt, cooldown) {
				ship.removeTarget()
				ship.invisible = true
				ship.modify(this.name, STAT_MOVE_SPEED, MATH_MULTIPLY, Float.add(1, Float.divide(this.getEffectMoveSpeed(level), 100)))

				const animDuration = 500
				ship.queueAnimation(null, 'opacity', {
					from: 1,
					to: 0.4,
					start: startAt,
					duration: animDuration,
				})
				ship.queueAnimation(null, 'opacity', {
					from: 0.4,
					to: 1,
					until: endAt,
					duration: animDuration,
				})

				ship.endInvisible = function () {
					// p('cancel invisibility')
					ship.cancelAnimation(null, 'opacity')
					ship.opacity(1)
					ship.updateCooldown(index, store.state.game.renderTime, cooldown)
					ship.endSkill(index)
				}
			},
			end (ship) {
				ship.modify(this.name, STAT_MOVE_SPEED, null)

				ship.invisible = false
				ship.endInvisible = null
			},
		},
		{
			name: 'Salvage',
			description: 'Boost health regeneration [[Regen]], while reducing move speed one third',
			target: TARGET_SELF,
			disabledBy: [false, true, null],
			isDisabledBy: isDisabledBy,
			endOnDeath: true,
			getEffectRegen (level) {
				return levelMultiplier(40, level, 4)
			},
			getDuration (level) {
				return 50
			},
			getCooldown (level) {
				return 100
			},
			start (index, level, ship) {
				ship.modify(this.name, STAT_DAMAGE_OVER_TIME, MATH_SUBTRACT, this.getEffectRegen(level))
				ship.modify(this.name, STAT_MOVE_SPEED, MATH_MULTIPLY, 0.33)

				ship.salvageMesh = Render.outline(ship.top.children[0], 0x0000ff, 1.07)
			},
			end (ship) {
				ship.modify(this.name, STAT_DAMAGE_OVER_TIME, null)
				ship.modify(this.name, STAT_MOVE_SPEED, null)

				if (ship.salvageMesh) {
					Render.remove(ship.salvageMesh)
					ship.salvageMesh = null
				}
			},
		},
	],

}
