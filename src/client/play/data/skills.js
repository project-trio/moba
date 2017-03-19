export default {
  boxy: [
  ],
  glitch: [
    {
      name: 'Disintigrate',
      description: 'Boost attack speed, but leaves you progressively more vulnerable to damage',
      target: 1,
      duration: 60,
      durationPerLevel: 10,
      cooldown: 150,
      cooldownPerLevel: 0,
    },
    {
      name: 'Encrypt',
      description: 'Stealth from enemies for a brief time',
      target: 1,
      duration: 40,
      durationPerLevel: 5,
      cooldown: 200,
      cooldownPerLevel: -10,
    },
    {
      name: 'Salvage',
      description: 'Boost health regeneration while lowering your movement speed',
      target: 1,
      duration: 50,
      durationPerLevel: 0,
      cooldown: 150,
      cooldownPerLevel: -5,
    },
  ],
}
