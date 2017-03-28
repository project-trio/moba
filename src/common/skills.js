module.exports = {
  boxy: [
  ],
  sunken: [
    {
      name: 'Torpedo',
      description: 'Fires a torpedo that explodes on the first enemy target',
      target: 2,
      duration: 0,
      cooldown: 150,
      getDuration: function (level) {
        return 0
      },
      getCooldown: function (level) {
        return this.cooldown
      },
      start: function (index, level, ship) {
      },
      end: function (ship) {
      },
    },
    {
      name: 'Dive',
      description: 'Dive down to temporarily escape enemy fire, dealing damage to enemies around you',
      target: 1,
      duration: 30,
      cooldown: 200,
      getDuration: function (level) {
        return this.duration + level * 1
      },
      getCooldown: function (level) {
        return this.cooldown - level * 10
      },
      start: function (index, level, ship) {
        this.untargetable = true
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
        this.untargetable = false
      },
    },
    {
      name: 'Effervesce',
      description: 'Encase yourself in a bubble, reducing incoming damage',
      target: 1,
      duration: 50,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration
      },
      getCooldown: function (level) {
        return this.cooldown - level * 5
      },
      start: function (index, level, ship) {
      },
      end: function (ship) {
      },
    },
  ],
  glitch: [
    {
      name: 'Brute force',
      description: 'Boosts attack speed, while more vulnerable to damage',
      target: 1,
      duration: 60,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration + level * 10
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
      duration: 40,
      cooldown: 200,
      getDuration: function (level) {
        return this.duration + level * 5
      },
      getCooldown: function (level) {
        return this.cooldown - level * 10
      },
      start: function (index, level, ship) {
        ship.setTarget(null)
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
      duration: 50,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration
      },
      getCooldown: function (level) {
        return this.cooldown - level * 5
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
