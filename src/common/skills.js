import Render from '@/play/render/render'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Bullet from '@/play/game/entity/attack/bullet'

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
  ],

//SUNKEN

  sunken: [
    {
      name: 'Torpedo',
      description: 'Fires a torpedo that explodes on the first enemy target',
      target: 2,
      disabledBy: [null, true, false],
      isDisabledBy: isDisabledBy,
      duration: 0,
      cooldown: 150,
      range: 200,
      getRange: function (level) {
        return this.range
      },
      getDuration: function (level) {
        return 0
      },
      getCooldown: function (level) {
        return this.cooldown
      },
      start: function (index, level, ship, cancel, target) {
        const damage = levelMultiplier(120, level, 20)
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
      duration: 35,
      cooldown: 200,
      range: 100,
      getRange: function (level) {
        return this.range
      },
      getDuration: function (level) {
        return levelMultiplier(this.duration, level, 2)
      },
      getCooldown: function (level) {
        return levelMultiplier(this.cooldown, level, -10)
      },
      start: function (index, level, ship) {
        ship.removeTarget()
        ship.untargetable = true
        ship.noTargeting = true

        const radius = this.getRange(level)
        const damage = 10
        ship.diveCircle = new AreaOfEffect(ship, true, {
          dot: true,
          color: 0x0066aa,
          opacity: 0.5,
          z: -4,
          radius: radius,
          attackDamage: damage * 100,
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
      description: 'Deal damage back to attackers',
      target: 1,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      duration: 50,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration
      },
      getCooldown: function (level) {
        return levelMultiplier(this.cooldown, level, -5)
      },
      start: function (index, level, ship) {
        ship.reflectDamageRatio = levelMultiplier(50, level, 5)
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
      duration: 60,
      cooldown: 150,
      getDuration: function (level) {
        return levelMultiplier(this.duration, level, 10)
      },
      getCooldown: function (level) {
        return this.cooldown
      },
      start: function (index, level, ship) {
        ship.attackCooldownModifier = 0.25
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
      duration: 40,
      cooldown: 200,
      getDuration: function (level) {
        return levelMultiplier(this.duration, level, 5)
      },
      getCooldown: function (level) {
        return levelMultiplier(this.cooldown, level, -10)
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
      duration: 50,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration
      },
      getCooldown: function (level) {
        return levelMultiplier(this.cooldown, level, -5)
      },
      start: function (index, level, ship) {
        ship.healthRegenModifier = 2
        ship.moveSpeedModifier = 0.5
      },
      end: function (ship) {
        ship.healthRegenModifier = null
        ship.moveSpeedModifier = null
      },
    },
  ],
}
