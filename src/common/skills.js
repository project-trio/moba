module.exports = {
  boxy: [
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
      start: function (index, level, ship, cancel) {
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
      start: function (index, level, ship, cancel) {
        ship.setTarget(null)
        ship.invisible = true
        ship.opacity(0.33)
        ship.endInvisible = function () {
          cancel(index)
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
      start: function (index, level, ship, cancel) {
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
