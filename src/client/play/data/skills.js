import Decimal from 'decimal.js'

import Render from '@/play/render/render'

import dataConstants from '@/play/data/constants'

import Animate from '@/play/game/helpers/animate'
import Util from '@/play/game/util'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Bullet from '@/play/game/entity/attack/bullet'

import Unit from '@/play/game/entity/unit/unit'

//LOCAL

// const TARGET_NONE = 0
const TARGET_SELF = 1
const TARGET_GROUND = 2
const TARGET_ENEMY = 3

const levelMultiplier = function (base, level, multiplier) {
  return base + (level - 1) * multiplier
}

const isDisabledBy = function (actives) {
  for (let idx = 0; idx < actives.length; idx += 1) {
    if (actives[idx] > 0 && this.disabledBy[idx]) {
      return true
    }
  }
  return false
}

//SKILLS

export default {

//BEEDLE

  beedle: [
    {
      name: `Electric Sting`,
      description: 'Fires a bolt of electricity that stuns for [[Duration]], dealing [[Damage]]',
      target: TARGET_ENEMY,
      isDisabledBy: null,
      getEffectDuration: function (level) {
        return levelMultiplier(2000, level, 200)
      },
      getEffectDamage: function (level) {
        return levelMultiplier(20, level, 5)
      },
      getRange: function (level) {
        return 150
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -5)
      },
      start: function (index, level, ship, target) {
        const damage = this.getEffectDamage(level)
        const stunDuration = this.getEffectDuration(level)
        const maxRange = this.getRange(level)
        const bulletData = {
          bulletSize: 10,
          bulletColor: 0xdddd00,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: 8,
          maxRange: maxRange,
          firstCollision: false,
          stunDuration: stunDuration,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
    {
      name: 'Acid Drop',
      description: 'Spit a toxic glob on the ground, dealing [[Dps]] to enemies inside for [[Duration]]',
      factorDps: 50, //TODO ticks
      suffixDps: ' dps',
      target: TARGET_GROUND,
      isDisabledBy: null,
      getRange: function (level) {
        return 150
      },
      getEffectRange: function (level) {
        return 60
      },
      getEffectDuration: function (level) {
        return levelMultiplier(3000, level, 200)
      },
      getEffectDps: function (level) {
        return levelMultiplier(500, level, 50)
      },
      getCooldown: function (level) {
        return 200
      },
      start: function (index, level, ship, target) {
        const dps = this.getEffectDps(level)
        const aoeRange = this.getEffectRange(level)
        const effectDuration = this.getEffectDuration(level)
        const bulletData = {
          dot: true,
          opacity: 0.5,
          z: -4,
          bulletSize: 9,
          bulletColor: 0x00ff00,
          attackDamage: dps,
          attackPierce: 0,
          attackMoveSpeed: 12,
          explosionRadius: aoeRange,
          effectDuration: effectDuration,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
    {
      name: 'Enrage',
      description: 'Boost attack speed [[AttackSpeed]], and movement speed [[MoveSpeed]]',
      suffixAttackSpeed: '%',
      suffixMoveSpeed: '%',
      target: TARGET_SELF,
      isDisabledBy: null,
      endOnDeath: true,
      getEffectAttackSpeed: function (level) {
        return levelMultiplier(30, level, 3)
      },
      getEffectMoveSpeed: function (level) {
        return levelMultiplier(20, level, 4)
      },
      getDuration: function (level) {
        return 50
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -2)
      },
      start: function (index, level, ship) {
        ship.modify('Enrage', 'attackCooldown', 'times', new Decimal(1).minus(new Decimal(this.getEffectAttackSpeed(level)).dividedBy(100)))
        ship.modify('Enrage', 'moveSpeed', 'times', new Decimal(1).plus(new Decimal(this.getEffectMoveSpeed(level)).dividedBy(100)))

        ship.enrageMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
      },
      end: function (ship) {
        ship.modify('Enrage', 'attackCooldown', null)
        ship.modify('Enrage', 'moveSpeed', null)
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
      name: 'Barrel Roll',
      description: 'Burst forward while dodging out of incoming fire with this timeless aerial maneuver',
      target: TARGET_GROUND,
      isDisabledBy: null,
      startsImmediately: true,
      continuesToDestination: true,
      getRange: function (level) {
        return levelMultiplier(120, level, 10) //TODO calculate
      },
      getDuration: function (level) {
        return levelMultiplier(5, level, 1)
      },
      getCooldown: function (level) {
        return 200
      },
      start: function (index, level, ship, target, startAt, endAt) {
        ship.modify('Barrel Roll', 'moveSpeed', 'times', 3)
        ship.uncontrollable = true
        ship.untargetable = true
        ship.unattackable = true
        ship.noTargeting = true
        ship.opacity(0.75)

        ship.endBarrelRoll = function () {
          console.log('cancel barrel roll')
          ship.endSkill(index)
        }

        const duration = (endAt - startAt) - 100
        const angleChange = Math.PI * 2
        ship.queueAnimation('base', 'rotation', {
          child: 1,
          axis: 'x',
          from: 0.5 * Math.PI,
          to: 0.5 * Math.PI,
          parabola: 2,
          max: angleChange,
          start: startAt,
          duration: duration,
        })
        ship.queueAnimation('model', 'position', {
          axis: 'z',
          from: 0,
          to: 0,
          parabola: 4,
          max: 60,
          start: startAt,
          duration: duration,
        })
        ship.propGroup.visible = false
      },
      end: function (ship) {
        ship.modify('Barrel Roll', 'moveSpeed', null)
        ship.endBarrelRoll = null
        ship.propGroup.visible = true
        ship.base.rotation.x = 0

        ship.uncontrollable = false
        ship.untargetable = false
        ship.unattackable = false
        ship.noTargeting = false
        ship.opacity(1)
      },
    },
  ],

//PULTER

  pulter: [
    {
      name: `Fling`,
      description: 'Hurls a large shell that explodes on impact for [[Damage]] to nearby enemies in [[Range]]',
      target: TARGET_GROUND,
      isDisabledBy: null,
      getEffectRange: function (level) {
        return levelMultiplier(100, level, 5)
      },
      getEffectDamage: function (level) {
        return levelMultiplier(100, level, 10)
      },
      getRange: function (level) {
        return levelMultiplier(200, level, 10)
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -5)
      },
      start: function (index, level, ship, target, startAt, endAt) {
        const aoeRange = this.getEffectRange(level)
        const damage = this.getEffectDamage(level)
        const maxRange = this.getRange(level)
        const attackMoveSpeed = 4
        const bulletData = {
          bulletSize: 8,
          bulletColor: 0x660066,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: attackMoveSpeed,
          maxRange: maxRange,
          explosionRadius: aoeRange,
          firstCollision: false,
        }
        const flingBullet = new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
        Animate.apply(flingBullet)
        const animationDuration = Math.sqrt(Util.pointDistance(ship.px, ship.py, target[0], target[1])) / flingBullet.moveConstant.toNumber() / 1000
        flingBullet.queueAnimation('container', 'position', {
          axis: 'z',
          from: 0,
          to: 0,
          parabola: 2,
          max: maxRange,
          start: startAt,
          duration: animationDuration,
        })
      },
    },
  ],

//BOXY

  boxy: [
    {
      name: `Storm's Eye`,
      description: 'Reduces damage allies inside the effect take from attacks by [[Damage]]',
      target: TARGET_SELF,
      isDisabledBy: null,
      endOnDeath: false,
      getEffectDamage: function (level) {
        return levelMultiplier(25, level, 2)
      },
      getRange: function (level) {
        return 150
      },
      getDuration: function (level) {
        return levelMultiplier(35, level, 2)
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -10)
      },
      start: function (index, level, ship) {
        const radius = this.getRange(level)
        const shield = this.getEffectDamage(level)
        ship.eyeCircle = new AreaOfEffect(ship, false, {
          dot: true,
          color: 0x0066aa,
          opacity: 0.5,
          px: ship.px, py: ship.py,
          z: -4,
          radius: radius,
          eyeShield: shield,
        })
      },
      end: function (ship) {
        ship.eyeCircle.destroy()
        ship.eyeCircle = null
      },
    },
    {
      name: 'Providence',
      description: 'Spawns a seeing-eye that reveals enemies within [[Range]]',
      target: TARGET_GROUND,
      isDisabledBy: null,
      endOnDeath: false,
      getRange: function (level) {
        return levelMultiplier(200, level, 30)
      },
      getEffectRange: function (level) {
        return levelMultiplier(140, level, 20)
      },
      getDuration: function (level) {
        return levelMultiplier(25, level, 5)
      },
      getCooldown: function (level) {
        return levelMultiplier(400, level, -20)
      },
      start: function (index, level, ship, target) {
        const sightRange = this.getEffectRange(level)
        const stats = { sightRange: [sightRange, 0] }
        ship.eye = new Unit(ship.team, stats, null, target[0] / 100, target[1] / 100, null, false, true)
        const color = dataConstants.teamColors[ship.team]
        const sphere = Render.sphere(12, { parent: ship.eye.top, color: color, segments: 16 })
        sphere.position.z = levelMultiplier(70, level, 4)
      },
      end: function (ship) {
        ship.eye.isDying = true
        ship.eye.destroy()
      },
    },
  ],

//SINKER

  sinker: [
    {
      name: 'Torpedo',
      description: 'Explodes on the first enemy hit, damaging within [[Range]] for [[Damage]]',
      target: TARGET_GROUND,
      disabledBy: [null, true, false],
      isDisabledBy: isDisabledBy,
      getRange: function (level) {
        return 200
      },
      getEffectRange: function (level) {
        return 60
      },
      getEffectDamage: function (level) {
        return levelMultiplier(100, level, 10)
      },
      getCooldown: function (level) {
        return 100
      },
      start: function (index, level, ship, target) {
        const damage = this.getEffectDamage(level)
        const maxRange = this.getRange(level)
        const aoeRange = this.getEffectRange(level)
        const bulletData = {
          bulletSize: 9,
          bulletColor: 0xcc00ff,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: 7,
          maxRange: maxRange,
          explosionRadius: aoeRange,
          firstCollision: true,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
    {
      name: 'Dive',
      description: 'Dive down to safety, dealing [[Dps]] to enemies around you',
      factorDps: 50, //TODO ticks
      suffixDps: ' dps',
      target: TARGET_SELF,
      isDisabledBy: null,
      endOnDeath: true,
      getRange: function (level) {
        return 100
      },
      getEffectDps: function (level) {
        return levelMultiplier(300, level, 30)
      },
      getDuration: function (level) {
        return levelMultiplier(35, level, 2)
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -10)
      },
      start: function (index, level, ship, target, startAt, endAt) {
        ship.removeTarget()
        ship.untargetable = true
        ship.noTargeting = true

        const radius = this.getRange(level)
        const damage = this.getEffectDps(level)
        ship.diveCircle = new AreaOfEffect(ship, true, {
          dot: true,
          color: 0x0066aa,
          opacity: 0.5,
          z: -4,
          radius: radius,
          attackDamage: damage,
          attackPierce: 0,
          parent: ship.container,
        })

        ship.queueAnimation('model', 'position', {
          axis: 'z',
          from: 0,
          to: 0,
          parabola: 8,
          max: -31,
          start: startAt,
          duration: endAt - startAt,
        })
      },
      end: function (ship) {
        ship.model.position.z = 0
        ship.untargetable = false
        ship.noTargeting = false

        ship.diveCircle.destroy()
        ship.diveCircle = null
      },
    },
    {
      name: 'Effervesce',
      description: 'Bounce [[Strength]] of damage taken back on attackers',
      suffixStrength: '%',
      target: TARGET_SELF,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      endOnDeath: true,
      getEffectStrength: function (level) {
        return levelMultiplier(14, level, 2)
      },
      getDuration: function (level) {
        return 50
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -5)
      },
      start: function (index, level, ship) {
        ship.reflectDamageRatio = this.getEffectStrength(level)
        ship.effervesceMesh = Render.outline(ship.base.children[0], 0xff0000, 1.07)
      },
      end: function (ship) {
        ship.reflectDamageRatio = null
        if (ship.effervesceMesh) {
          Render.remove(ship.effervesceMesh)
          ship.effervesceMesh = null
        }
      },
    },
  ],

//GLITCH

  glitch: [
    {
      name: 'Brute Force',
      description: 'Boosts attack speed [[AttackSpeed]], while more vulnerable to damage',
      suffixAttackSpeed: '%',
      target: TARGET_SELF,
      disabledBy: [null, false, true],
      isDisabledBy: isDisabledBy,
      endOnDeath: true,
      getEffectAttackSpeed: function (level) {
        return levelMultiplier(40, level, 3)
      },
      getDuration: function (level) {
        return levelMultiplier(40, level, 2)
      },
      getCooldown: function (level) {
        return 150
      },
      start: function (index, level, ship) {
        ship.modify('Brute Force', 'attackCooldown', 'times', new Decimal(1).minus(new Decimal(this.getEffectAttackSpeed(level)).dividedBy(100)))
        ship.modify('Brute Force', 'armor', 'times', 0.5)
        ship.bruteForceMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
      },
      end: function (ship) {
        ship.modify('Brute Force', 'attackCooldown', null)
        ship.modify('Brute Force', 'armor', null)
        if (ship.bruteForceMesh) {
          Render.remove(ship.bruteForceMesh)
          ship.bruteForceMesh = null
        }
      },
    },
    {
      name: 'Encrypt',
      description: 'Turn invisible and untargetable to enemies',
      target: TARGET_SELF,
      disabledBy: [false, null, true],
      isDisabledBy: isDisabledBy,
      endOnDeath: true,
      getDuration: function (level) {
        return levelMultiplier(40, level, 5)
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -5)
      },
      start: function (index, level, ship) {
        ship.removeTarget()
        ship.invisible = true
        ship.opacity(0.33)
        ship.endInvisible = function () {
          console.log('cancel invisibility')
          ship.endSkill(index)
        }
      },
      end: function (ship) {
        ship.invisible = false
        ship.endInvisible = null
        ship.opacity(1)
      },
    },
    {
      name: 'Salvage',
      description: 'Boost health regeneration [[Regen]], while halving movement speed',
      factorRegen: 50 / 1000 * 100, //TODO ticks
      suffixRegen: ' hp / s',
      target: TARGET_SELF,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      endOnDeath: true,
      getEffectRegen: function (level) {
        return levelMultiplier(40, level, 4)
      },
      getDuration: function (level) {
        return 50
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -2)
      },
      start: function (index, level, ship) {
        ship.modify('Salvage', 'healthRegen', 'add', this.getEffectRegen(level))
        ship.modify('Salvage', 'moveSpeed', 'times', 0.5)

        ship.salvageMesh = Render.outline(ship.top.children[0], 0x00ff00, 1.07)
      },
      end: function (ship) {
        ship.modify('Salvage', 'healthRegen', null)
        ship.modify('Salvage', 'moveSpeed', null)

        if (ship.salvageMesh) {
          Render.remove(ship.salvageMesh)
          ship.salvageMesh = null
        }
      },
    },
  ],
}
