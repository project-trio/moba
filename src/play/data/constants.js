const TICK_DURATION = 50

module.exports = {
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

	TEAM_COLORS: [
		0x5599cc,
		0xdd6677,
	],
	DARK_COLORS: [
		0x112266,
		0x661122,
	],
	WALL_COLORS: [
		0x7799aa,
		0xaa7788,
	],

	AXIS_X: 'x',
	AXIS_Y: 'y',
	AXIS_Z: 'z',

	MATH_ADD: 'add',
	MATH_DIVIDE: 'divide',
	MATH_MULTIPLY: 'multiply',
	MATH_SUBTRACT: 'subtract',

	PERCENT: '%',

	STAT_ATTACK_COOLDOWN: 'attackCooldown',
	STAT_ARMOR: 'armor',
	STAT_DAMAGE_OVER_TIME: 'dot',
	STAT_MOVE_SPEED: 'moveSpeed',
	STAT_SIGHT_RANGE: 'sightRange',

	// TARGET_NONE: 0,
	TARGET_SELF: 1,
	TARGET_GROUND: 2,
	TARGET_ENEMY: 3,
}
