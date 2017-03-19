const testing = process.env.NODE_ENV !== 'production'

module.exports = {

	PORT: 8091,

	VERSION: '0.0.1',

	TESTING: testing,

	DEFAULT_GAME_SIZE: testing ? 0 : 1,

};
