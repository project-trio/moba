const testing = process.env.NODE_ENV !== 'production'

module.exports = {

  PORT: 8091,

  VERSION: '0.0.1',

  TESTING: testing,

  GAME_SIZES: [1, 2, 4, 6, 8, 10, 25],

  SHIP_NAMES: ['boxy', 'sinker', 'glitch', 'proppy', 'pulter', 'beedle', 'stitches'],

  GAME_MODES: [
    { name: 'PvP', description: 'Team up to defend your base and destroy your opponents' },
    { name: 'bots', description: 'Train against bots to learn a new unit or hone your skills' },
  ],

}
