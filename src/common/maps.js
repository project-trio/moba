const maps = {}

{
  const wallRadius = 24
  let wH, hH

  // Tiny

  const TINY_SIZE = 900
  wH = TINY_SIZE / 2
  maps.tiny = {
    minSize: 0,
    maxSize: 2,

    width: TINY_SIZE,
    height: TINY_SIZE,

    towers: [
      ['base', wH, 44, false],
      ['turret', wH - 90, wH - 90, false],
    ],

    walls: [
      {
        start: { x: TINY_SIZE, y: wH - 130 },
        radius: wallRadius,
        move: [
          { dx: -160, dy: 0, },
        ],
        mirror: false,
        endCap: true,
      },
    ],

    minions: [
      {
        type: 'ranged',
        paths: [
          [[wH - 40, 74, 0, 0], [wH - 40, wH, 0, -1000]],
          [[wH, 80, 0, 0], [wH, wH, 0, -1000]],
          [[wH + 40, 74, 0, 0], [wH + 40, wH, 0, -1000]],
        ],
        mirror: false,
      },
    ],
  }

  // Small

  const SMALL_WIDTH = 900
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
      ['tower', 190, 380, true],
      ['turret', wH + 80, hH - 100, false],
    ],

    walls: [
      {
        start: { x: 190, y: 220 },
        radius: wallRadius,
        move: [
          { dx: 0, dy: 50 },
          { dx: 50, dy: 0, },
        ],
        mirror: true,
        endCap: true,
      },
    ],

    minions: [
      {
        type: 'ranged',
        paths: [
          [[wH - 40, 74, 0, 0], [wH - 40, hH, 0, -SMALL_HEIGHT]],
          [[wH, 80, 0, 0], [wH, hH, 0, -SMALL_HEIGHT]],
          [[wH + 40, 74, 0, 0], [wH + 40, hH, 0, -SMALL_HEIGHT]],
        ],
        mirror: false,
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
    maxSize: 10,

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
        radius: wallRadius,
        move: [
          { dx: -60, dy: 0, },
          { dx: 0, dy: -60 },
        ],
        mirror: true,
        endCap: true,
      },
    ],

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
    maxSize: null,

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
        radius: wallRadius,
        move: [
          { dx: -60, dy: 0, },
          { dx: 0, dy: -60 },
        ],
        mirror: true,
        endCap: true,
      },
      {
        start: { x: wH - 100, y: 400 },
        radius: wallRadius,
        move: [
          { dx: 100, dy: 0, },
        ],
        mirror: false,
        endCap: true,
      },
    ],

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
}

module.exports = maps
