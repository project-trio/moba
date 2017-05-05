import Decimal from 'decimal.js'

import store from '@/store'

import Render from '@/play/render/render'

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

//CHARGER

  charger: [
    {
      name: '[TBD]',
      description: '',
    },
    {
      name: '[TBD]',
      description: '',
    },
    {
      name: '[TBD]',
      description: '',
    },
  ],

//TEMPEST

    tempest: [
      {
        name: 'Bolt',
        description: 'Strike enemies inside after [[Duration]] for [[Damage]]',
        target: TARGET_GROUND,
        hitsTowers: false,
        disabledBy: [null, true, false],
        isDisabledBy: isDisabledBy,
        endOnDeath: false,
        getEffectDuration: function (level) {
          return 500
        },
        getEffectRange: function (level) {
          return 60
        },
        getEffectDamage: function (level) {
          return levelMultiplier(80, level, 10)
        },
        getRange: function (level) {
          return levelMultiplier(80, level, 5)
        },
        getCooldown: function (level) {
          return levelMultiplier(150, level, -5)
        },
        start: function (index, level, ship, target, startAt) {
          const delay = this.getEffectDuration(level)
          const damage = this.getEffectDamage(level)
          const aoeRange = this.getEffectRange(level)
          new AreaOfEffect(ship, false, {
            dot: false,
            hitsTowers: this.hitsTowers,
            color: 0xffff00,
            opacity: 0.9,
            px: target[0], py: target[1],
            radius: aoeRange,
            time: startAt,
            delay: delay,
            attackDamage: damage * 100,
            attackPierce: 0,
          })
        },
      },
      {
        name: 'Scud',
        description: 'Fly by the power of the wind',
        target: TARGET_GROUND,
        isDisabledBy: null,
        startsImmediately: false,
        getRange: function (level) {
          return levelMultiplier(110, level, 10)
        },
        getDuration: function (level) {
          return 3
        },
        getCooldown: function (level) {
          return levelMultiplier(300, level, -10)
        },
        start: function (index, level, ship, target, startAt, endAt, cooldown) {
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

          ship.queueAnimation('top', 'position', {
            child: 0,
            axis: 'z',
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
        end: function (ship) {
          ship.customPosition = false
          ship.uncontrollable = false
          ship.untargetable = false
          ship.disableAttacking = false
        },
      },
      {
        name: 'Chain strike',
        description: 'Lightning passes through up to [[Propagates]] enemies within [[Range]], dealing [[Damage]] to each',
        target: TARGET_ENEMY,
        hitsTowers: true,
        disabledBy: [false, true, null],
        isDisabledBy: isDisabledBy,
        getEffectRange: function (level) {
          return 70
        },
        getEffectPropagates: function (level) {
          return 5
        },
        getEffectDamage: function (level) {
          return levelMultiplier(70, level, 5)
        },
        getRange: function (level) {
          return 140
        },
        getCooldown: function (level) {
          return levelMultiplier(200, level, -5)
        },
        start: function (index, level, ship, target) {
          const damage = this.getEffectDamage(level)
          const bulletData = {
            hitsTowers: this.hitsTowers,
            bulletSize: 10,
            bulletColor: 0xdddd00,
            attackDamage: damage * 100,
            attackPierce: 10,
            attackMoveSpeed: 7,
            propagates: this.getEffectPropagates(level),
            propagateRange: this.getEffectRange(level),
          }
          new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
        },
      },
    ],

//STITCHES

  stitches: [
    {
      name: `Repair Swarm`,
      description: 'Repairs allies in range by [[Regen]] for [[Duration]]',
      target: TARGET_SELF,
      hitsTowers: false,
      isDisabledBy: null,
      endOnDeath: false,
      getEffectRegen: function (level) {
        return levelMultiplier(300, level, 30)
      },
      getEffectDuration: function (level) {
        return 3000
      },
      getRange: function (level) {
        return 100
      },
      getCooldown: function (level) {
        return levelMultiplier(250, level, -10)
      },
      start: function (index, level, ship) {
        new AreaOfEffect(ship, false, {
          dot: false,
          hitsTowers: this.hitsTowers,
          color: 0x00ccff,
          opacity: 0.5,
          px: ship.px, py: ship.py,
          radius: this.getRange(level),
          allies: true,
          modify: {
            name: this.name,
            stat: 'healthRegen',
            method: 'add',
            value: this.getEffectRegen(level),
            expires: this.getEffectDuration(level),
          },
        })
      },
    },
    {
      name: 'Jetsam',
      description: 'Toss repair debris overboard, slowing enemies that walk over it by [[MoveSpeed]] for [[Duration]]',
      suffixMoveSpeed: '%',
      target: TARGET_GROUND,
      isDisabledBy: null,
      getRange: function (level) {
        return 120
      },
      getEffectRange: function (level) {
        return levelMultiplier(70, level, 2)
      },
      getEffectRemainsDuration: function (level) {
        return levelMultiplier(3000, level, 200)
      },
      getEffectDuration: function (level) {
        return levelMultiplier(1000, level, 200)
      },
      getEffectMoveSpeed: function (level) {
        return levelMultiplier(50, level, 2)
      },
      getCooldown: function (level) {
        return 220
      },
      start: function (index, level, ship, target) {
        const moveSpeed = new Decimal(1).minus(new Decimal(this.getEffectMoveSpeed(level)).dividedBy(100))
        const aoeRange = this.getEffectRange(level)
        const effectDuration = this.getEffectDuration(level)
        const effectRemainsDuration = this.getEffectRemainsDuration(level)
        const bulletData = {
          dot: true,
          opacity: 0.5,
          attackMoveSpeed: 18,
          bulletSize: 14,
          bulletColor: 0x222222,
          allies: false,
          modify: {
            name: this.name,
            stat: 'moveSpeed',
            method: 'times',
            value: moveSpeed,
            expires: effectDuration,
          },
          explosionRadius: aoeRange,
          effectDuration: effectRemainsDuration,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
    {
      name: 'Emergency',
      description: 'Expend a huge boost of [[MoveSpeed]] movement speed',
      suffixAttackSpeed: '%',
      suffixMoveSpeed: '%',
      target: TARGET_SELF,
      isDisabledBy: null,
      endOnDeath: true,
      getEffectMoveSpeed: function (level) {
        return levelMultiplier(25, level, 10)
      },
      getDuration: function (level) {
        return 40
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -2)
      },
      start: function (index, level, ship) {
        ship.modify(this.name, 'moveSpeed', 'times', new Decimal(1).plus(new Decimal(this.getEffectMoveSpeed(level)).dividedBy(100)))
        ship.emergencyMesh = Render.outline(ship.top.children[0], 0x0000ff, 1.07)
      },
      end: function (ship) {
        ship.modify(this.name, 'moveSpeed', null)
        if (ship.emergencyMesh) {
          Render.remove(ship.emergencyMesh)
          ship.emergencyMesh = null
        }
      },
    },
  ],

//BEEDLE

  beedle: [
    {
      name: `Poison Sting`,
      description: 'Deals [[Damage]] to the target, and slowing by [[MoveSpeed]] for [[Duration]]. If target is [[poisoned:poison]], they are stunned instead.',
      suffixMoveSpeed: '%',
      hitsTowers: false,
      target: TARGET_ENEMY,
      isDisabledBy: null,
      getEffectMoveSpeed: function (level) {
        return levelMultiplier(50, level, 2)
      },
      getEffectDuration: function (level) {
        return levelMultiplier(2000, level, 200)
      },
      getEffectDamage: function (level) {
        return levelMultiplier(40, level, 5)
      },
      getRange: function (level) {
        return 120
      },
      getCooldown: function (level) {
        return levelMultiplier(250, level, -5)
      },
      start: function (index, level, ship, target) {
        const damage = this.getEffectDamage(level)
        const moveSpeed = new Decimal(1).minus(new Decimal(this.getEffectMoveSpeed(level)).dividedBy(100))
        const effectDuration = this.getEffectDuration(level)
        const maxRange = this.getRange(level)
        const bulletData = {
          hitsTowers: this.hitsTowers,
          bulletSize: 10,
          bulletColor: 0xdddd00,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: 8,
          maxRange: maxRange,
          modify: {
            name: 'Poison',
            stat: 'moveSpeed',
            method: 'times',
            value: moveSpeed,
            expires: effectDuration,
          },
          stunDuration: effectDuration,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
    {
      name: 'Acid Drop',
      description: 'Spit a toxic glob on the ground for [[Duration]], [[poisoning:poison]] enemies for [[Dps]] and move speed by [[MoveSpeed]]',
      suffixMoveSpeed: '%',
      target: TARGET_GROUND,
      hitsTowers: true,
      isDisabledBy: null,
      getRange: function (level) {
        return 160
      },
      getEffectRange: function (level) {
        return 60
      },
      getEffectDuration: function (level) {
        return levelMultiplier(1000, level, 100)
      },
      getEffectMoveSpeed: function (level) {
        return levelMultiplier(25, level, 2)
      },
      getEffectDps: function (level) {
        return levelMultiplier(400, level, 50)
      },
      getCooldown: function (level) {
        return levelMultiplier(180, level, -5)
      },
      start: function (index, level, ship, target) {
        const dps = this.getEffectDps(level)
        const aoeRange = this.getEffectRange(level)
        const effectDuration = this.getEffectDuration(level)
        const moveSpeed = new Decimal(1).minus(new Decimal(this.getEffectMoveSpeed(level)).dividedBy(100))
        const bulletData = {
          dot: true,
          hitsTowers: this.hitsTowers,
          opacity: 0.5,
          bulletSize: 9,
          bulletColor: 0x00ff00,
          attackDamage: dps,
          attackPierce: 0,
          attackMoveSpeed: 12,
          explosionRadius: aoeRange,
          effectDuration: effectDuration,
          allies: false,
          modify: {
            name: 'Poison',
            stat: 'moveSpeed',
            method: 'times',
            value: moveSpeed,
            expires: effectDuration,
          },
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
        ship.modify(this.name, 'attackCooldown', 'times', new Decimal(1).minus(new Decimal(this.getEffectAttackSpeed(level)).dividedBy(100)))
        ship.modify(this.name, 'moveSpeed', 'times', new Decimal(1).plus(new Decimal(this.getEffectMoveSpeed(level)).dividedBy(100)))

        ship.enrageMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
      },
      end: function (ship) {
        ship.modify(this.name, 'attackCooldown', null)
        ship.modify(this.name, 'moveSpeed', null)
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
      getRange: function (level) {
        return levelMultiplier(150, level, 5)
      },
      getEffectDamage: function (level) {
        return levelMultiplier(80, level, 15)
      },
      getCooldown: function (level) {
        return 60
      },
      start: function (index, level, ship, target) {
        const damage = this.getEffectDamage(level)
        const maxRange = this.getRange(level)
        const bulletData = {
          toMaxRange: true,
          hitsTowers: this.hitsTowers,
          bulletSize: 12,
          bulletColor: 0xcc0000,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: 12,
          maxRange: maxRange,
          firstCollision: true,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
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
      start: function (index, level, ship, target, startAt, endAt, cooldown) {
        ship.modify(this.name, 'moveSpeed', 'times', 3)
        ship.uncontrollable = true
        ship.untargetable = true
        ship.disableAttacking = true
        ship.opacity(0.75)

        ship.endBarrelRoll = function () {
          p('cancel barrel roll')
          ship.updateCooldown(index, store.state.game.renderTime, cooldown)
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
        ship.modify(this.name, 'moveSpeed', null)
        ship.endBarrelRoll = null
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
      description: 'Basic attacks return to heal [[Rebound]] of damage dealt',
      suffixRebound: '%',
      target: TARGET_SELF,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      endOnDeath: true,
      getEffectRebound: function (level) {
        return levelMultiplier(40, level, 5)
      },
      getDuration: function (level) {
        return levelMultiplier(50, level, 5)
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -5)
      },
      start: function (index, level, ship) {
        ship.rebound = new Decimal(this.getEffectRebound(level)).dividedBy(100)
        ship.reboundMesh = Render.outline(ship.base.children[1], 0x0000ff, 1.07)
      },
      end: function (ship) {
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
      name: `Homer`,
      description: 'Deals [[Damage]] to the target',
      hitsTowers: true,
      target: TARGET_ENEMY,
      isDisabledBy: null,
      getEffectDamage: function (level) {
        return levelMultiplier(100, level, 10)
      },
      getRange: function (level) {
        return 170
      },
      getCooldown: function (level) {
        return 100
      },
      start: function (index, level, ship, target) {
        const damage = this.getEffectDamage(level)
        const maxRange = this.getRange(level)
        const bulletData = {
          hitsTowers: this.hitsTowers,
          bulletSize: 10,
          bulletColor: 0x00dddd,
          attackDamage: damage * 100,
          attackPierce: 100,
          attackMoveSpeed: 6,
          maxRange: maxRange,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
    {
      name: `Fling`,
      description: 'Hurls a large shell that explodes on impact for [[Damage]] to nearby enemies in [[Range]]',
      target: TARGET_GROUND,
      hitsTowers: false,
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
        return 260
      },
      start: function (index, level, ship, target, startAt, endAt) {
        const aoeRange = this.getEffectRange(level)
        const damage = this.getEffectDamage(level)
        const maxRange = this.getRange(level)
        const attackMoveSpeed = 4
        const bulletData = {
          hitsTowers: this.hitsTowers,
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
    {
      name: 'Rearm',
      description: 'Lowers the cooldown of other abilities by [[Duration]]',
      target: TARGET_SELF,
      isDisabledBy: null,
      minLeveled: 1,
      activatable: function () {
        return store.state.local.skills.cooldowns[0] || store.state.local.skills.cooldowns[1]
      },
      getEffectDuration: function (level) {
        return levelMultiplier(80, level, 50) * 100
      },
      getCooldown: function (level) {
        return levelMultiplier(600, level, -40)
      },
      start: function (index, level, ship) {
        const reduction = this.getEffectDuration(level)
        for (let skillIndex = 0; skillIndex < 2; skillIndex += 1) {
          const cooldownEnd = ship.skills.cooldowns[skillIndex]
          ship.updateCooldown(skillIndex, cooldownEnd, -reduction)
        }
      },
    },
  ],

//BOXY

  boxy: [
    {
      name: 'Absorb Shield',
      description: 'Heal back [[Repair]] of damage received over 3 seconds',
      suffixRepair: '%',
      target: TARGET_SELF,
      isDisabledBy: null,
      endOnDeath: true,
      getEffectRepair: function (level) {
        return levelMultiplier(20, level, 4)
      },
      getDuration: function (level) {
        return levelMultiplier(50, level, 5)
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -5)
      },
      start: function (index, level, ship) {
        ship.repair = new Decimal(this.getEffectRepair(level)).dividedBy(100)
        ship.repairMesh = Render.outline(ship.base.children[0], 0x0000ff, 1.07)
      },
      end: function (ship) {
        ship.repair = null
        if (ship.repairMesh) {
          Render.remove(ship.repairMesh)
          ship.repairMesh = null
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
      getEffectArmor: function (level) {
        return levelMultiplier(30, level, 2)
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
      start: function (index, level, ship, target, startAt, endAt) {
        const radius = this.getRange(level)
        const armor = this.getEffectArmor(level)
        new AreaOfEffect(ship, false, {
          dot: true,
          hitsTowers: this.hitsTowers,
          color: 0x0066aa,
          opacity: 0.5,
          px: ship.px, py: ship.py,
          radius: radius,
          allies: true,
          modify: {
            name: this.name,
            stat: 'armor',
            method: 'add',
            value: armor,
            expires: 200,
          },
          endAt: endAt,
        })
      },
      end: function (ship) {
      },
    },
    {
      name: 'Providence',
      description: 'Spawns a seeing-eye that reveals enemies within [[Range]]',
      target: TARGET_GROUND,
      isDisabledBy: null,
      endOnDeath: false,
      getRange: function (level) {
        return levelMultiplier(160, level, 30)
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
        const sphere = Render.sphere(12, { parent: ship.eye.top, team: ship.team, segments: 16 })
        sphere.position.z = levelMultiplier(60, level, 5)
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
      hitsTowers: true,
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
          hitsTowers: this.hitsTowers,
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
      target: TARGET_SELF,
      hitsTowers: false,
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
        ship.disableAttacking = true

        const radius = this.getRange(level)
        const damage = this.getEffectDps(level)
        ship.diveCircle = new AreaOfEffect(ship, true, {
          hitsTowers: this.hitsTowers,
          dot: true,
          color: 0x0066aa,
          opacity: 0.5,
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
          max: -26,
          start: startAt,
          duration: endAt - startAt,
        })
      },
      end: function (ship) {
        ship.model.position.z = 0
        ship.untargetable = false
        ship.disableAttacking = false

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
        ship.reflectDamageRatio = new Decimal(this.getEffectStrength(level)).dividedBy(100)
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
      start: function (index, level, ship, target, startAt, endAt) {
        ship.modify(this.name, 'attackCooldown', 'times', new Decimal(1).minus(new Decimal(this.getEffectAttackSpeed(level)).dividedBy(100)))
        ship.modify(this.name, 'armor', 'times', 0.5)
        ship.bruteForceMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
      },
      end: function (ship) {
        ship.modify(this.name, 'attackCooldown', null)
        ship.modify(this.name, 'armor', null)
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
      start: function (index, level, ship, target, startAt, endAt, cooldown) {
        ship.removeTarget()
        ship.invisible = true

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
      end: function (ship) {
        ship.invisible = false
        ship.endInvisible = null
      },
    },
    {
      name: 'Salvage',
      description: 'Boost health regeneration [[Regen]], while halving movement speed',
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
        ship.modify(this.name, 'healthRegen', 'add', this.getEffectRegen(level))
        ship.modify(this.name, 'moveSpeed', 'times', 0.5)

        ship.salvageMesh = Render.outline(ship.top.children[0], 0x00ff00, 1.07)
      },
      end: function (ship) {
        ship.modify(this.name, 'healthRegen', null)
        ship.modify(this.name, 'moveSpeed', null)

        if (ship.salvageMesh) {
          Render.remove(ship.salvageMesh)
          ship.salvageMesh = null
        }
      },
    },
  ],
}
