/* eslint-disable no-unused-vars */

import store from '@/client/store'

import Local from '@/client/play/local'
import Render from '@/client/play/render/render'

import Animate from '@/client/play/game/helpers/animate'
import Float from '@/client/play/game/helpers/float'
import Util from '@/client/play/game/util'

import AreaOfEffect from '@/client/play/game/entity/attack/aoe'
import Bullet from '@/client/play/game/entity/attack/bullet'

import Unit from '@/client/play/game/entity/unit/unit'

//LOCAL

// const TARGET_NONE = 0
const TARGET_SELF = 1
const TARGET_GROUND = 2
const TARGET_ENEMY = 3

const levelMultiplier = function (base, level, multiplier) {
	return base + (level - 1) * multiplier
}

//SKILLS

export default {

//SPLODGE

	splodge: [
		{
			name: 'Shield',
			description: 'Increase armor by [[Armor]]',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectArmor (level) {
				return levelMultiplier(21, level, 5)
			},
			getDuration (level) {
				return levelMultiplier(30, level, 5)
			},
			getCooldown (level) {
				return 200
			},
			start (index, level, ship) {
				// 4	16%
				// 6	23%
				// 8	28%
				// 10	33%
				// 12	37%
				// 14	41%
				// 16	44%
				// 18	47%
				// 20	50%
				// 22	52%
				ship.modify(this.name, 'armor', 'add', this.getEffectArmor(level))
				ship.armorMesh = Render.outline(ship.base.children[0], 0x000000, 1.07)
			},
			end (ship) {
				ship.modify(this.name, 'armor', null)
				if (ship.armorMesh) {
					Render.remove(ship.armorMesh)
					ship.armorMesh = null
				}
			},
		},
		{
			name: 'Repair',
			description: 'Repair [[Regen]]',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectRegen (level) {
				return levelMultiplier(20, level, 20)
			},
			getDuration (level) {
				return 100
			},
			getCooldown (level) {
				return 200
			},
			start (index, level, ship) {
				ship.modify(this.name, 'healthRegen', 'add', this.getEffectRegen(level))
				ship.healMesh = Render.outline(ship.top.children[0], 0x00ff00, 1.07)
			},
			end (ship) {
				ship.modify(this.name, 'healthRegen', null)
				if (ship.healMesh) {
					Render.remove(ship.healMesh)
					ship.healMesh = null
				}
			},
		},
		{
			name: 'Sight',
			description: 'Permanently increases sight by [[Range]]',
			target: TARGET_SELF,
			getEffectRange (level) {
				return levelMultiplier(10, level, 3)
			},
			levelup (index, level, ship) {
				ship.modify(this.name, 'sightRange', 'add', this.getEffectRange(level) * 100)
			},
		},
	],

//BASHER

	basher: [
		{
			name: 'Overload',
			description: 'Increases attack speed by [[AttackSpeed]]',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectAttackSpeed (level) {
				return levelMultiplier(20, level, 5)
			},
			getDuration (level) {
				return 60
			},
			getCooldown (level) {
				return 120
			},
			start (index, level, ship) {
				ship.modify(this.name, 'attackCooldown', 'multiply', Float.subtract(1, Float.divide(this.getEffectAttackSpeed(level), 100)))
				ship.overloadMesh = Render.outline(ship.top.children[0], 0xffcc00, 1.07)
			},
			end (ship) {
				ship.modify(this.name, 'armor', null)
				if (ship.overloadMesh) {
					Render.remove(ship.overloadMesh)
					ship.overloadMesh = null
				}
			},
		},
		{
			name: 'AP Shells',
			description: 'Your attacks pierce [[Pierce]] armor',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectPierce (level) {
				return levelMultiplier(10, level, 1)
			},
			getDuration (level) {
				return 50
			},
			getCooldown (level) {
				return 200
			},
			start (index, level, ship) {
				this.attackPierceBonus = this.getEffectPierce(level)
				ship.pierceMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
			},
			end (ship) {
				this.attackPierceBonus = null
				if (ship.pierceMesh) {
					Render.remove(ship.pierceMesh)
					ship.pierceMesh = null
				}
			},
		},
		{
			name: 'HE Shells',
			description: 'Permanently increases your attacks by [[Damage]]',
			target: TARGET_SELF,
			getEffectDamage (level) {
				return 5
			},
			levelup (index, level, ship) {
				ship.addAttackDamage(this.getEffectDamage(), true)
			},
		},
	],

//DOC

	doc: [
		{
			name: 'Repair All',
			description: 'Repairs allies inside for [[Regen]]',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectRegen (level) {
				return levelMultiplier(30, level, 6)
			},
			getRange (level) {
				return levelMultiplier(100, level, 2) //70 1
			},
			getEffectDuration (level) {
				return levelMultiplier(30, level, 5) * 100
			},
			getCooldown (level) {
				return 150
			},
			start (index, level, ship) {
				new AreaOfEffect(ship, {
					dot: false,
					color: 0x0033ff,
					opacity: 0.2,
					radius: this.getRange(level),
					allies: true,
					modify: {
						name: this.name,
						stat: 'healthRegen',
						method: 'add',
						value: this.getEffectRegen(level),
						expires: 3000,
					},
				})
			},
		},
		{
			name: 'Far Sight',
			description: 'Increase sight range by [[Range]]',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectRange (level) {
				return levelMultiplier(80, level, 10) // 50 5
			},
			getDuration (level) {
				return 50
			},
			getCooldown (level) {
				return 150
			},
			start (index, level, ship) {
				ship.modify(this.name, 'sightRange', 'add', this.getEffectRange(level) * 100)
			},
			end (ship) {
				ship.modify(this.name, 'sightRange', null)
			},
		},
		{
			name: 'Engine',
			description: 'Permanently increases move speed by [[MoveSpeed]]',
			suffixMoveSpeed: 'kph',
			factorMoveSpeed: 10,
			target: TARGET_SELF,
			getEffectMoveSpeed (level) {
				return levelMultiplier(15, level, 12)
			},
			levelup (index, level, ship) {
				const moveSpeed = Float.divide(this.getEffectMoveSpeed(level), 15)
				ship.modify(this.name, 'moveSpeed', 'add', moveSpeed)
			},
		},
	],

//STINGER

	stinger: [
		{
			name: `Stun Bolt`,
			description: 'Deals [[Damage]] to the target, and stuns them for [[Duration]].',
			suffixMoveSpeed: '%',
			hitsTowers: true,
			target: TARGET_ENEMY,
			getEffectDuration (level) {
				return levelMultiplier(20, level, 1) * 100
			},
			getEffectDamage (level) {
				return levelMultiplier(40, level, 5)
			},
			getRange (level) {
				return 160 //TODO attack range
			},
			getCooldown (level) {
				return levelMultiplier(200, level, -10)
			},
			start (index, level, ship, target) {
				const damage = this.getEffectDamage(level) * 100
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 10,
					bulletColor: 0xdddd00,
					attackDamage: damage,
					attackPierce: 0,
					bulletSpeed: 8,
					stunDuration: this.getEffectDuration(level),
				}
				new Bullet(ship, target, bulletData, ship.px, ship.py, ship.top.aim)
			},
		},
		{
			name: 'Glue Bomb',
			description: 'Slows enemy movement [[MoveSpeed]] for [[Duration]]',
			suffixMoveSpeed: '%',
			target: TARGET_GROUND,
			getEffectRange (level) {
				return 60 //TODO
			},
			getEffectDuration (level) {
				return 30 * 100
			},
			getEffectMoveSpeed (level) {
				return levelMultiplier(26, level, 10)
			},
			getRange (level) {
				return 160 //TODO attack range
			},
			getCooldown (level) {
				return levelMultiplier(180, level, -10)
			},
			start (index, level, ship, target) {
				const aoeRange = this.getEffectRange(level)
				const moveSpeed = Float.subtract(1, Float.divide(this.getEffectMoveSpeed(level), 100))
				const bulletData = {
					dot: false,
					opacity: 0.5,
					bulletSize: 9,
					bulletColor: 0x00ff00,
					attackPierce: 0,
					bulletSpeed: 10,
					explosionRadius: aoeRange,
					allies: false,
					modify: {
						name: this.name,
						stat: 'moveSpeed',
						method: 'multiply',
						value: moveSpeed,
						expires: this.getEffectDuration(level),
					},
				}
				new Bullet(ship, target, bulletData, ship.px, ship.py, ship.top.aim)
			},
		},
		{
			name: 'Boost',
			description: 'Boost attack speed [[AttackSpeed]], and movement speed by [[MoveSpeed]]',
			suffixAttackSpeed: '%',
			factorMoveSpeed: 10,
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectAttackSpeed (level) {
				return levelMultiplier(15, level, 4)
			},
			getEffectMoveSpeed (level) {
				return levelMultiplier(45, level, 9)
			},
			getDuration (level) {
				return 50
			},
			getCooldown (level) {
				return 150
			},
			start (index, level, ship) {
				ship.modify(this.name, 'attackCooldown', 'multiply', Float.subtract(1, Float.divide(this.getEffectAttackSpeed(level), 100)))
				const moveSpeed = Float.divide(this.getEffectMoveSpeed(level), 10)
				ship.modify(this.name, 'moveSpeed', 'add', moveSpeed)

				ship.enrageMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
			},
			end (ship) {
				ship.modify(this.name, 'attackCooldown', null)
				ship.modify(this.name, 'moveSpeed', null)
				if (ship.enrageMesh) {
					Render.remove(ship.enrageMesh)
					ship.enrageMesh = null
				}
			},
		},
	],

//SHOUTY

	shouty: [
		{
			name: `Missile`,
			description: 'Deals [[Damage]] to the target, ignoring armor',
			hitsTowers: true,
			target: TARGET_ENEMY,
			getEffectDamage (level) {
				return levelMultiplier(30, level, 5)
			},
			getRange (level) {
				return 170 // 130
			},
			getCooldown (level) {
				return 120
			},
			start (index, level, ship, target) {
				const damage = this.getEffectDamage(level) * 100
				const maxRange = this.getRange(level)
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 10,
					bulletColor: 0x00dddd,
					attackDamage: damage,
					attackPierce: 100,
					bulletSpeed: 4,
					bulletAcceleration: true,
					maxRange: maxRange,
				}
				new Bullet(ship, target, bulletData, ship.px, ship.py, ship.top.aim)
			},
		},
		{
			name: `Mortar`,
			description: 'Hurls a large shell that explodes on impact for [[Damage]] to enemies within [[Range]]',
			target: TARGET_GROUND,
			hitsTowers: true,
			getEffectRange (level) {
				return levelMultiplier(60, level, 7) // 40 5
			},
			getEffectDamage (level) {
				return levelMultiplier(30, level, 9)
			},
			getRange (level) {
				return 200 // 150
			},
			getCooldown (level) {
				return 200
			},
			start (index, level, ship, target, startAt, endAt) {
				const aoeRange = this.getEffectRange(level)
				const damage = this.getEffectDamage(level) * 100
				const maxRange = this.getRange(level)
				const bulletSpeed = 4
				const bulletData = {
					hitsTowers: this.hitsTowers,
					bulletSize: 8,
					bulletColor: 0x660066,
					attackDamage: damage,
					attackPierce: 10,
					bulletSpeed: bulletSpeed,
					maxRange: maxRange,
					explosionRadius: aoeRange,
					firstCollision: false,
				}
				const flingBullet = new Bullet(ship, target, bulletData, ship.px, ship.py, ship.top.aim)
				Animate.apply(flingBullet)
				const moveConstant = flingBullet.moveConstant
				const animationDuration = Math.sqrt(Util.pointDistance(ship.px, ship.py, target[0], target[1])) / moveConstant / 1000
				flingBullet.queueAnimation('container', 'position', {
					axis: 'z',
					from: 0,
					to: 0,
					parabola: 2,
					max: maxRange + 50,
					start: startAt,
					duration: animationDuration,
				})
			},
		},
		{
			name: 'Reload',
			description: 'Instantly reloads Missile and Mortar.',
			target: TARGET_SELF,
			activatable () {
				return store.state.local.skills.cooldowns[0] || store.state.local.skills.cooldowns[1]
			},
			getCooldown (level) {
				return levelMultiplier(600, level, -40)
			},
			start (index, level, ship, target, startAt, endAt) {
				for (let skillIndex = 0; skillIndex < 2; skillIndex += 1) {
					const cooldownEnd = ship.skills.cooldowns[skillIndex]
					if (cooldownEnd > startAt) {
						ship.updateCooldown(skillIndex, 0, 0)
					}
				}
			},
		},
	],

//SNEAKY

	sneaky: [
		{
			name: 'Grenade',
			description: 'Strike enemies inside for [[Damage]]',
			target: TARGET_GROUND,
			hitsTowers: true,
			getEffectRange (level) {
				return levelMultiplier(70, level, 2) // 70 1
			},
			getEffectDamage (level) {
				return levelMultiplier(25, level, 6)
			},
			getRange (level) {
				return levelMultiplier(80, level, 5)
			},
			getCooldown (level) {
				return 80
			},
			start (index, level, ship, target, startAt) {
				const damage = this.getEffectDamage(level) * 100
				const aoeRange = this.getEffectRange(level)
				new AreaOfEffect(ship, {
					dot: false,
					hitsTowers: this.hitsTowers,
					color: 0xff0000,
					opacity: 0.5,
					px: target[0], py: target[1],
					radius: aoeRange,
					time: startAt,
					attackDamage: damage,
					attackPierce: 0,
				})
			},
		},
		{
			name: 'Blink',
			description: 'Teleports to the selected destination.', //TODO toward the selected direction
			target: TARGET_GROUND,
			startsImmediately: false,
			hideDuration: true,
			getRange (level) {
				return levelMultiplier(150, level, 15) // 120 10
			},
			getDuration (level) {
				return 3
			},
			getCooldown (level) {
				return levelMultiplier(280, level, -20)
			},
			start (index, level, ship, target, startAt, endAt, cooldown, isLocal) {
				ship.customPosition = true
				ship.uncontrollable = true
				ship.untargetable = true
				ship.disableAttacking = true

				let destX = target[0]
				let destY = target[1]
				while (ship.blocked(destX, destY)) { //TODO prevent going backwards
					// p('Blocked', destX, destY, ship.moveX, ship.moveY)
					destX -= ship.moveX
					destY -= ship.moveY
				}

				const duration = endAt - startAt
				ship.queueAnimation('container', 'position', {
					axis: 'x',
					from: ship.px / 100,
					to: destX / 100,
					pow: 2,
					start: startAt,
					duration: duration,
				})
				ship.queueAnimation('container', 'position', {
					axis: 'y',
					from: ship.py / 100,
					to: destY / 100,
					pow: 2,
					start: startAt,
					duration: duration,
				})

				ship.px = destX
				ship.py = destY
			},
			end (ship) {
				ship.customPosition = false
				ship.uncontrollable = false
				ship.untargetable = false
				ship.disableAttacking = false
			},
		},
		{
			name: 'Armor',
			description: 'Permanently increases armor by [[Armor]]',
			target: TARGET_SELF,
			getEffectArmor (level) {
				return levelMultiplier(2, level, 2)
			},
			levelup (index, level, ship) {
				ship.modify(this.name, 'armor', 'add', this.getEffectArmor(level))
			},
		},
	],

//DASH

	dash: [
		{
			name: 'Frenzy',
			description: 'Increases attack speed [[AttackSpeed]]',
			suffixAttackSpeed: '%',
			target: TARGET_SELF,
			endOnDeath: true,
			getEffectAttackSpeed (level) {
				return levelMultiplier(100, level, 20)
			},
			getDuration (level) {
				return 25
			},
			getCooldown (level) {
				return levelMultiplier(300, level, -10)
			},
			start (index, level, ship, target, startAt, endAt) {
				ship.modify(this.name, 'attackCooldown', 'multiply', Float.divide(50, this.getEffectAttackSpeed(level)))
				ship.frenzyMesh = Render.outline(ship.top.children[0], 0xffaa00, 1.07)
			},
			end (ship) {
				ship.modify(this.name, 'attackCooldown', null)
				if (ship.frenzyMesh) {
					Render.remove(ship.frenzyMesh)
					ship.frenzyMesh = null
				}
			},
		},
		{
			name: 'Blur',
			description: 'Turn invisible, gaining [[MoveSpeed]] move speed',
			target: TARGET_SELF,
			endOnDeath: true,
			getDuration (level) {
				return levelMultiplier(30, level, 4)
			},
			getEffectMoveSpeed (level) {
				return 12
			},
			getCooldown (level) {
				return levelMultiplier(200, level, -10)
			},
			start (index, level, ship, target, startAt, endAt, cooldown) {
				ship.removeTarget()
				ship.invisible = true
				const moveSpeed = this.getEffectMoveSpeed(level)
				ship.modify(this.name, 'moveSpeed', 'add', moveSpeed)

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
					p('cancel invisibility')
					ship.cancelAnimation(null, 'opacity')
					ship.opacity(1)
					ship.updateCooldown(index, store.state.game.renderTime, cooldown)
					ship.endSkill(index)
				}
			},
			end (ship) {
				ship.modify(this.name, 'moveSpeed', null)

				ship.invisible = false
				ship.endInvisible = null
			},
		},
		{
			name: 'Nanobots',
			description: 'Permanently increases hp regen by [[Regen]]',
			target: TARGET_SELF,
			getEffectRegen (level) {
				return levelMultiplier(2, level, 2) // 0.4 0.2
			},
			levelup (index, level, ship) {
				ship.modify(this.name, 'healthRegen', 'add', this.getEffectRegen(level))
			},
		},
	],

}
