import Render from '@/play/render/render'

import dataConstants from '@/play/data/constants'

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
      name: `Electric sting`,
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
          collisionSize: 10 * 100,
          firstCollision: false,
          stunDuration: stunDuration,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
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
        return 100
      },
      getDuration: function (level) {
        return levelMultiplier(10, level, 1)
      },
      getCooldown: function (level) {
        return 200
      },
      start: function (index, level, ship, target) {
        ship.uncontrollable = true
        ship.untargetable = true
        ship.unattackable = true
        ship.noTargeting = true
        ship.opacity(0.5)

        ship.endBarrelRoll = function () {
          console.log('cancel barrel roll')
          ship.endSkill(index)
        }
      },
      end: function (ship) {
        ship.endBarrelRoll = null

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
      start: function (index, level, ship, target) {
        const aoeRange = this.getEffectRange(level)
        const damage = this.getEffectDamage(level)
        const maxRange = this.getRange(level)
        const bulletData = {
          bulletSize: 8,
          bulletColor: 0x660066,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: 4,
          maxRange: maxRange,
          explosionRadius: aoeRange,
          collisionSize: 10 * 100,
          firstCollision: false,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
    },
  ],

//BOXY

  boxy: [
    {
      name: `Storm's Eye`,
      description: 'Reduces damage allies inside the effect take from attacks by [[Damage]]',
      target: TARGET_SELF,
      endOnDeath: false,
      isDisabledBy: null,
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
      suffixRange: ' range',
      target: TARGET_GROUND,
      endOnDeath: false,
      isDisabledBy: null,
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
      description: 'Fires a torpedo that explodes on the first enemy hit for [[Damage]]',
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
          collisionSize: 10 * 100,
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
      endOnDeath: true,
      isDisabledBy: null,
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
      start: function (index, level, ship) {
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
      },
      update: function (ship, start, current, end) {
        const elapsed = current - start
        const transitionTime = 500
        const diveDepth = -30
        if (elapsed <= transitionTime) {
          ship.model.position.z = elapsed * diveDepth / transitionTime
        } else {
          const remaining = end - current
          if (remaining <= transitionTime) {
            ship.model.position.z = remaining * diveDepth / transitionTime
          }
        }
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
      endOnDeath: true,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
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
      name: 'Brute force',
      description: 'Boosts attack speed by [[AttackSpeed]], while more vulnerable to damage',
      suffixAttackSpeed: '%',
      target: TARGET_SELF,
      endOnDeath: true,
      disabledBy: [null, false, true],
      isDisabledBy: isDisabledBy,
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
        ship.attackCooldownModifier = 1 - this.getEffectAttackSpeed(level) / 100
        ship.armorModifier = 0.5
        ship.bruteForceMesh = Render.outline(ship.top.children[0], 0xff0000, 1.07)
      },
      end: function (ship) {
        ship.attackCooldownModifier = null
        ship.armorModifier = null
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
      endOnDeath: true,
      disabledBy: [false, null, true],
      isDisabledBy: isDisabledBy,
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
      description: 'Boost health regeneration by [[Regen]], while halving movement speed',
      factorRegen: 50 / 1000 * 100, //TODO ticks
      suffixRegen: ' hp / s',
      target: TARGET_SELF,
      endOnDeath: true,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
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
        ship.healthRegenModifier = this.getEffectRegen(level)
        ship.moveSpeedModifier = 0.5
        ship.salvageMesh = Render.outline(ship.top.children[0], 0x00ff00, 1.07)
      },
      end: function (ship) {
        ship.healthRegenModifier = null
        ship.moveSpeedModifier = null
        if (ship.salvageMesh) {
          Render.remove(ship.salvageMesh)
          ship.salvageMesh = null
        }
      },
    },
  ],
}
