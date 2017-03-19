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
      start (level, ship) {
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
      start (level, ship) {
      },
      end (ship) {
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
      start (level, ship) {
      },
      end (ship) {
      },
    },
  ],
}
