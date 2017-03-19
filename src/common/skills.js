module.exports = {
  boxy: [
  ],
  glitch: [
    {
      name: 'Disintigrate',
      description: 'Boost attack speed, but more vulnerable to damage',
      target: 1,
      duration: 60,
      cooldown: 150,
      getDuration: function (level) {
        return this.duration + level * 10
      },
      getCooldown: function (level) {
        return this.cooldown
      },
      start (index, level, ship, cancel) {
      },
      end (ship) {
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
      start (index, level, ship, cancel) {
        ship.setTarget(null)
        ship.invisible = true
        ship.opacity(0.33)
        ship.endInvisible = () => {
          cancel(index)
        }
      },
      end (ship) {
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
      start (index, level, ship, cancel) {
      },
      end (ship) {
      },
    },
  ],
}
