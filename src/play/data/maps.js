const maps = {}

{
	const WALL_RADIUS = 24
	let wH, hH

	// Tutorial

	const TUTORIAL_WIDTH = 400
	const TUTORIAL_HEIGHT = 1000
	wH = TUTORIAL_WIDTH / 2
	hH = TUTORIAL_HEIGHT / 2
	const WALL_Y = hH - 80
	const WALL_LENGTH = 116
	maps.tutorial = {
		minSize: 0,
		maxSize: 0,

		width: TUTORIAL_WIDTH,
		height: TUTORIAL_HEIGHT,

		towers: [
			['base', wH, 44, false],
			['turret', WALL_LENGTH + 4, WALL_Y, false],
		],

		walls: [
			{
				start: { x: TUTORIAL_WIDTH / 2, y: 0 },
				radius: WALL_RADIUS,
				move: [
					{ dx: TUTORIAL_WIDTH / 4, dy: 0},
					{ dx: 0, dy: WALL_Y / 2 },
					{ dx: -(WALL_LENGTH) / 2 + WALL_RADIUS, dy: 0 },
				],
				mirror: false,
				endCap: true,
			},
		],

		spawn: {
			interval: 25,
			initialDelay: 10,
		},

		minions: [
			{
				type: 'ranged',
				paths: [
					[[wH - 40, 74, 0, 0], [wH - 40, hH, 0, -1000]],
					[[wH, 80, 0, 0], [wH, hH, 0, -1000]],
					[[wH + 40, 74, 0, 0], [wH + 40, hH, 0, -1000]],
				],
				mirror: false,
			},
		],
	}

	// Tiny

	const TINY_WIDTH = 900
	const TINY_HEIGHT = 800
	wH = TINY_WIDTH / 2
	hH = TINY_HEIGHT / 2
	maps.tiny = {
		minSize: 0,
		maxSize: 2,

		width: TINY_WIDTH,
		height: TINY_HEIGHT,

		towers: [
			['base', wH, 44, false],
			['turret', wH - 70, hH - 95, false],
		],

		walls: [
			{
				start: { x: TINY_WIDTH / 5, y: TINY_HEIGHT / 5 },
				radius: WALL_RADIUS,
				move: [
					{ dx: 0, dy: -hH / 5 },
				],
				mirror: true,
				endCap: true,
			},
			{
				start: { x: TINY_WIDTH, y: hH },
				radius: WALL_RADIUS,
				move: [
					{ dx: -15, dy: 0 },
				],
				mirror: false,
				endCap: true,
			},
		],

		spawn: {
			interval: 20,
			initialDelay: 6,
		},

		minions: [
			{
				type: 'ranged',
				paths: [
					[[wH - 40, 74, 0, 0], [wH - 40, hH, 0, -1000]],
					[[wH, 80, 0, 0], [wH, hH, 0, -1000]],
					[[wH + 40, 74, 0, 0], [wH + 40, hH, 0, -1000]],
				],
				mirror: false,
			},
		],
	}

	// Small

	const SMALL_WIDTH = 1000
	const SMALL_HEIGHT = 1400
	wH = SMALL_WIDTH / 2
	hH = SMALL_HEIGHT / 2
	maps.small = {
		minSize: 0,
		maxSize: 4,

		width: SMALL_WIDTH,
		height: SMALL_HEIGHT,

		towers: [
			['base', wH, 44, false],
			['tower', 210, 340, true],
			['turret', wH + 80, hH - 100, false],
		],

		walls: [
			{
				start: { x: wH - 100, y: 330 },
				radius: WALL_RADIUS,
				move: [
					{ dx: 100, dy: 0 },
				],
				mirror: false,
				endCap: true,
			},
			{
				start: { x: SMALL_WIDTH, y: hH - 80 },
				radius: WALL_RADIUS,
				move: [
					{ dx: -50, dy: 0 },
				],
				mirror: false,
				endCap: true,
			},
		],

		spawn: {
			interval: 20,
			initialDelay: 6,
		},

		minions: [
			{
				type: 'melee',
				paths: [
					[[wH - 80, 30, 0, 0], [wH / 2 + 60, 300 - 30, 417, -909], [wH - 80 + 30, hH, -310, -951]],
					[[wH - 80, 60, 0, 0], [wH / 2 + 30, 300 + 0, 504, -864], [wH - 80 + 0, hH, -330, -944]],
					[[wH - 80, 90, 0, 0], [wH / 2 + 0, 300 + 30, 578, -816], [wH - 80 - 30, hH, -354, -935]],
				],
				mirror: true,
			},
		],
	}

	// Standard

	const STANDARD_WIDTH = 1200
	const STANDARD_HEIGHT = 2000
	wH = STANDARD_WIDTH / 2
	hH = STANDARD_HEIGHT / 2
	maps.standard = {
		minSize: 2,
		maxSize: 12,

		width: STANDARD_WIDTH,
		height: STANDARD_HEIGHT,

		towers: [
			['base', wH, 44, false],
			['tower', 435, 360, true],
			['turret', 44, 440, true],
			['turret', wH - 300, hH - 160, true],
		],

		walls: [
			{
				start: { x: 380, y: 360 },
				radius: WALL_RADIUS,
				move: [
					{ dx: -60, dy: 0 },
					{ dx: 0, dy: -60 },
				],
				mirror: true,
				endCap: true,
			},
		],

		spawn: {
			interval: 20,
			initialDelay: 6,
		},

		minions: [
			{
				type: 'melee',
				paths: [
					[[wH - 80, 90, 0, 0], [90, 100, hH, -23], [90, 360, 0, -hH], [260, 880, -311, -950], [260, hH, 0, -hH]],
					[[wH - 80, 60, 0, 0], [120, 70, hH, -25], [120, 390, 0, -hH], [300, 880, -345, -939], [300, hH, 0, -hH]],
					[[wH - 80, 30, 0, 0], [150, 40, hH, -27], [150, 420, 0, -hH], [340, 880, -382, -924], [340, hH, 0, -hH]],
				],
				mirror: true,
			},
			{
				type: 'ranged',
				paths: [
					[[wH - 40, 74, 0, 0], [wH - 40, hH, 0, -hH]],
					[[wH, 80, 0, 0], [wH, hH, 0, -hH]],
					[[wH + 40, 74, 0, 0], [wH + 40, hH, 0, -hH]],
				],
				mirror: false,
			},
		],
	}

	// Large

	const LARGE_WIDTH = 2000
	const LARGE_HEIGHT = 2000
	wH = LARGE_WIDTH / 2
	hH = LARGE_HEIGHT / 2
	maps.large = {
		minSize: 6,
		maxSize: 25,

		width: LARGE_WIDTH,
		height: LARGE_HEIGHT,

		towers: [
			['base', wH, 44, false],
			['tower', wH - 350, 400, true],
			['tower', 44, 440, true],
			['turret', 400, hH - 200, true],
			['turret', wH - 120, hH - 100, false],
		],

		walls: [
			{
				start: { x: 380, y: 400 },
				radius: WALL_RADIUS,
				move: [
					{ dx: -60, dy: 0 },
					{ dx: 0, dy: -60 },
				],
				mirror: true,
				endCap: true,
			},
			{
				start: { x: wH - 100, y: 400 },
				radius: WALL_RADIUS,
				move: [
					{ dx: 100, dy: 0 },
				],
				mirror: false,
				endCap: true,
			},
		],

		spawn: {
			interval: 20,
			initialDelay: 6,
		},

		minions: [
			{
				type: 'melee',
				paths: [
					[[wH - 80, 90, 0, 0], [90, 100, hH, -12], [90, 360, 0, -hH], [260, 880, -311, -950], [260, hH, 0, -hH]],
					[[wH - 80, 60, 0, 0], [120, 70, hH, -12], [120, 390, 0, -hH], [300, 880, -345, -939], [300, hH, 0, -hH]],
					[[wH - 80, 30, 0, 0], [150, 40, hH, -13], [150, 420, 0, -hH], [340, 880, -382, -924], [340, hH, 0, -hH]],
				],
				mirror: true,
			},
			{
				type: 'ranged',
				paths: [
					[[wH + 10, 80, 0, 0], [wH + 170, hH / 2, -356, -934], [wH + 170, hH, 0, -1000]],
					[[wH + 50, 80, 0, 0], [wH + 210, hH / 2, -356, -934], [wH + 210, hH, 0, -1000]],
					[[wH + 90, 80, 0, 0], [wH + 250, hH / 2, -356, -934], [wH + 250, hH, 0, -1000]],
				],
				mirror: true,
			},
		],
	}

	// Retro

	const RETRO_WIDTH = 1000
	const RETRO_HEIGHT = 1666
	const RETRO_WALL_RADIUS = 36
	wH = RETRO_WIDTH / 2
	hH = RETRO_HEIGHT / 2
	maps.retro = {
		minSize: 1,
		maxSize: 12,

		width: RETRO_WIDTH,
		height: RETRO_HEIGHT,

		towers: [
			['base', wH, 56, false],
			['tower', 317, 393, true],
			['tower', 285, 684, false],
			['tower', 800, 684, false],
		],

		walls: [
			{
				start: { x: 220, y: 320 },
				radius: RETRO_WALL_RADIUS,
				move: [
					{ dx: 48, dy: 0 },
					{ dx: 0, dy: -48 },
				],
				mirror: true,
				endCap: true,
			},
		],

		spawn: {
			interval: 20,
			initialDelay: 6,
			rangedDelay: 3,
			rangedWaveEvery: 2,
		},

		minions: [
			{
				type: 'melee',
				paths: [
					[[wH - 60, 90, 0, 0], [90, 100, hH, -23], [90, 360, 0, -hH], [260, 880, -311, -950], [260, hH, 0, -hH]],
					[[wH - 60, 60, 0, 0], [120, 70, hH, -25], [120, 390, 0, -hH], [300, 880, -345, -939], [300, hH, 0, -hH]],
					[[wH - 60, 30, 0, 0], [150, 40, hH, -27], [150, 420, 0, -hH], [340, 880, -382, -924], [340, hH, 0, -hH]],
				],
				mirror: true,
			},
			{
				type: 'ranged',
				paths: [
					[[wH - 40, 74, 0, 0], [wH - 40, hH, 0, -hH]],
					[[wH, 80, 0, 0], [wH, hH, 0, -hH]],
					[[wH + 40, 74, 0, 0], [wH + 40, hH, 0, -hH]],
				],
				mirror: false,
			},
		],
	}
}

module.exports = maps
