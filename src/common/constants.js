const testing = process.env.NODE_ENV !== 'production'

module.exports = {

  PORT: 8091,

  VERSION: '0.0.1',

  TESTING: testing,

  GAME_SIZES: [0, 1, 2, 3, 4, 5, 6, 10, 25],

}
