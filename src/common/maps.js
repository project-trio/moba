const maps = {}

{
  const wallRadius = 24

  // Mini

  maps.tiny = {
    minSize: 0,
    maxSize: 2,

    width: 800,
    height: 800,

    towers: [
      ['base', 400, 44, false],
      ['tower', 320, 320, false],
    ],

    walls: [
      {
        start: { x: 535, y: 320 },
        radius: wallRadius,
        move: [
          { dx: 133, dy: 0, },
        ],
        mirror: false,
        endCap: true,
      },
    ],

    minions: [
      {
        type: 'ranged',
        paths: [
          [[360, 74, 0, 0], [360, 400, 0, -1000]],
          [[400, 80, 0, 0], [400, 400, 0, -1000]],
          [[440, 74, 0, 0], [440, 400, 0, -1000]],
        ],
        mirror: false,
      },
    ],
  }

  maps.small = {
    minSize: 0,
    maxSize: 4,

    width: 800,
    height: 1400,

    towers: [
      ['base', 400, 44, false],
      ['tower', 190, 380, true],
      ['turret', 470, 600, false],
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
          [[360, 74, 0, 0], [360, 700, 0, -1000]],
          [[400, 80, 0, 0], [400, 700, 0, -1000]],
          [[440, 74, 0, 0], [440, 700, 0, -1000]],
        ],
        mirror: false,
      },
    ],
  }

  // Standard

  const STANDARD_WIDTH = 1200
  const STANDARD_HEIGHT = 2000
  const SWH = STANDARD_WIDTH / 2
  const SHH = STANDARD_HEIGHT / 2
  maps.standard = {
    minSize: 2,
    maxSize: 10,

    width: STANDARD_WIDTH,
    height: STANDARD_HEIGHT,

    towers: [
      ['base', SWH, 44, false],
      ['tower', 435, 360, true],
      ['turret', 44, 440, true],
      ['turret', SWH - 300, SHH - 160, true],
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
          [[SWH - 80, 90, 0, 0], [90, 100, SHH, -23], [90, 360, 0, -SHH], [260, 880, -311, -950], [260, 900, 0, -SHH]],
          [[SWH - 80, 60, 0, 0], [120, 70, SHH, -25], [120, 390, 0, -SHH], [300, 880, -345, -939], [300, 900, 0, -SHH]],
          [[SWH - 80, 30, 0, 0], [150, 40, SHH, -27], [150, 420, 0, -SHH], [340, 880, -382, -924], [340, 900, 0, -SHH]],
        ],
        mirror: true,
      },
      {
        type: 'ranged',
        paths: [
          [[SWH - 40, 74, 0, 0], [SWH - 40, SHH, 0, -SHH]],
          [[SWH, 80, 0, 0], [SWH, SHH, 0, -SHH]],
          [[SWH + 40, 74, 0, 0], [SWH + 40, SHH, 0, -SHH]],
        ],
        mirror: false,
      },
    ],
  }
}

module.exports = maps
