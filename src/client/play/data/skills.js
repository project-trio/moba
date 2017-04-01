import Render from '@/play/render/render'

import dataConstants from '@/play/data/constants'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Bullet from '@/play/game/entity/attack/bullet'

import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const levelMultiplier = function (base, level, multiplier) {
  return base + (level - 1) * multiplier
}

const isDisabledBy = function (actives) {
  for (var idx = 0; idx < actives.length; idx += 1) { //TODO let
    if (actives[idx] > 0 && this.disabledBy[idx]) {
      return true
    }
  }
  return false
}

//SKILLS

export default {

//BOXY

  boxy: [
    {
      name: `Lightning Eye`,
      description: 'Fires a bolt of lightning that stuns its target',
      target: 3,
      isDisabledBy: null,
      range: 200,
      getRange: function (level) {
        return this.range
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -5)
      },
      start: function (index, level, ship, cancel, target) {
        const damage = levelMultiplier(20, level, 5)
        const stunDuration = levelMultiplier(2000, level, 200)
        const maxRange = this.getRange(level)
        const bulletData = {
          bulletSize: 10,
          bulletColor: 0x00ff66,
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
      end: function (ship) {
      },
    },
    {
      name: `Storm's Eye`,
      description: 'Make a haven to protect allies, reducing the damage they take while inside',
      target: 1,
      isDisabledBy: null,
      range: 150,
      getRange: function (level) {
        return this.range
      },
      getDuration: function (level) {
        return levelMultiplier(35, level, 2)
      },
      getCooldown: function (level) {
        return levelMultiplier(200, level, -10)
      },
      start: function (index, level, ship) {
        const radius = this.getRange(level)
        const shield = levelMultiplier(25, level, 2)
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
      description: 'Spawns a seeing-eye that reveals nearby enemies',
      target: 2,
      isDisabledBy: null,
      range: 200,
      getRange: function (level) {
        return levelMultiplier(this.range, level, 30)
      },
      getDuration: function (level) {
        return levelMultiplier(25, level, 5)
      },
      getCooldown: function (level) {
        return levelMultiplier(400, level, -20)
      },
      start: function (index, level, ship, cancel, target) {
        const sightRange = levelMultiplier(140, level, 20)
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
      description: 'Fires a torpedo that explodes on the first enemy target',
      target: 2,
      disabledBy: [null, true, false],
      isDisabledBy: isDisabledBy,
      range: 200,
      getRange: function (level) {
        return this.range
      },
      getCooldown: function (level) {
        return 150
      },
      start: function (index, level, ship, cancel, target) {
        const damage = levelMultiplier(100, level, 10)
        const maxRange = this.getRange(level)
        const bulletData = {
          bulletSize: 10,
          bulletColor: 0xcc00ff,
          attackDamage: damage * 100,
          attackPierce: 10,
          attackMoveSpeed: 8,
          maxRange: maxRange,
          explosionRadius: 60,
          collisionSize: 10 * 100,
          firstCollision: true,
        }
        new Bullet(ship, target, bulletData, ship.px, ship.py, ship.base.rotation.z)
      },
      end: function (ship) {
      },
    },
    {
      name: 'Dive',
      description: 'Dive down to safety, while dealing damage to enemies around you',
      target: 1,
      isDisabledBy: null,
      range: 100,
      getRange: function (level) {
        return this.range
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
        const damage = levelMultiplier(300, level, 30)
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
          ship.shipContainer.position.z = elapsed * diveDepth / transitionTime
        } else {
          const remaining = end - current
          if (remaining <= transitionTime) {
            ship.shipContainer.position.z = remaining * diveDepth / transitionTime
          }
        }
      },
      end: function (ship) {
        ship.shipContainer.z = 0
        ship.untargetable = false
        ship.noTargeting = false

        ship.diveCircle.destroy()
        ship.diveCircle = null
      },
    },
    {
      name: 'Effervesce',
      description: 'Bounce a percentage of damage taken back on attackers',
      target: 1,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      getDuration: function (level) {
        return 50
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -5)
      },
      start: function (index, level, ship) {
        ship.reflectDamageRatio = levelMultiplier(14, level, 2)
      },
      end: function (ship) {
        ship.reflectDamageRatio = null
      },
    },
  ],

//GLITCH

  glitch: [
    {
      name: 'Brute force',
      description: 'Boosts attack speed, while more vulnerable to damage',
      target: 1,
      disabledBy: [null, false, true],
      isDisabledBy: isDisabledBy,
      getDuration: function (level) {
        return levelMultiplier(40, level, 5)
      },
      getCooldown: function (level) {
        return 150
      },
      start: function (index, level, ship) {
        ship.attackCooldownModifier = levelMultiplier(60, level, -5) / 100
        ship.armorModifier = 0.5
      },
      end: function (ship) {
        ship.attackCooldownModifier = null
        ship.armorModifier = null
      },
    },
    {
      name: 'Encrypt',
      description: 'Stealth from enemies for a brief time',
      target: 1,
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
      description: 'Boost health regeneration while lowering movement speed',
      target: 1,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      getDuration: function (level) {
        return 50
      },
      getCooldown: function (level) {
        return levelMultiplier(150, level, -2)
      },
      start: function (index, level, ship) {
        ship.healthRegenModifier = levelMultiplier(2, level, 1)
        ship.moveSpeedModifier = 0.5
      },
      end: function (ship) {
        ship.healthRegenModifier = null
        ship.moveSpeedModifier = null
      },
    },
  ],
}
