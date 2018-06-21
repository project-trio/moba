const TICK_DURATION = 50

module.exports = {

	PORT: 8091,

	VERSION: '0.0.1',

	TESTING: process.env.NODE_ENV !== 'production',

	TICK_DURATION,
	TICKS_PER_SECOND: 1000 / TICK_DURATION,
	UPDATE_DURATION: 200,

	GAME_SIZES: [ 1, 2, 4, 6, 8, 12, 25 ],

	SHIP_NAMES: [ 'boxy', 'sinker', 'glitch', 'proppy', 'pulter', 'beedle', 'stitches', 'tempest', 'charger' ],
	RETRO_SHIP_NAMES: [ 'splodge', 'basher', 'doc', 'stinger', 'shouty', 'sneaky', 'dash' ],

	GAME_MODES: [
		{ name: 'PvP', description: 'Team up to defend your base and destroy your opponents' },
		{ name: 'bots', description: 'Train against bots to learn a new unit or hone your skills' },
	],

}
