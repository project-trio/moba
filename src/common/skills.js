import Bullet from '@/play/game/entity/unit/bullet'

const isDisabledBy = function (actives) {
  let disabling = false
  for (let idx = 0; idx < actives.length; idx += 1) {
    if (actives[idx] > 0 && this.disabledBy[idx]) {
      return true
    }
  }
  return false
}

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
      getDuration: function (level) {
        return 0
      },
      getCooldown: function (level) {
        return this.cooldown
      },
      start: function (index, level, ship, cancel, target) {
        const bulletData = {
          bulletSize: 11,
          bulletColor: 0x00ff00,
          attackDamage: 100,
          attackMoveSpeed: 10,
          attackPierce: 10,
          maxRange: 250 * 100,
          explosionRadius: 50 * 100,
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
      description: 'Dive down to safety, dealing damage to enemies around you',
      target: 1,
      isDisabledBy: null,
      duration: 35,
      cooldown: 200,
      getDuration: function (level) {
        return this.duration + (level - 1) * 2
      },
      getCooldown: function (level) {
        return this.cooldown - (level - 1) * 10
      },
      start: function (index, level, ship) {
        ship.removeTarget()
        ship.untargetable = true
        ship.noTargeting = true
      },
      update: function (ship, start, current, end) {
        const elapsed = current - start
        const transitionTime = 500
        const diveDepth = -33
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
      },
    },
    {
      name: 'Effervesce',
      description: 'Causes you to deal damage back to attackers',
      target: 1,
      disabledBy: [false, true, null],
      isDisabledBy: isDisabledBy,
      duration: 50,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration
      },
      getCooldown: function (level) {
        return this.cooldown - (level - 1) * 5
      },
      start: function (index, level, ship) {
        ship.reflectDamage = (50 + (level - 1) * 5) * 10
      },
      end: function (ship) {
        ship.reflectDamage = null
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
        return this.duration + (level - 1) * 10
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
        return this.duration + (level - 1) * 5
      },
      getCooldown: function (level) {
        return this.cooldown - (level - 1) * 10
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
        return this.cooldown - (level - 1) * 5
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
