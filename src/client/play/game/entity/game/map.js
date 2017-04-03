import store from '@/store'

import Local from '@/play/local'

import dataConstants from '@/play/data/constants'

import Bridge from '@/play/events/bridge'

import pointer from '@/play/render/pointer'
import Render from '@/play/render/render'
import RenderMinimap from '@/play/render/minimap'

import Mini from '@/play/game/entity/unit/mini'
import Tower from '@/play/game/entity/unit/tower'

//LAYOUTS

const maps = {}

const wallRadius = 24

maps.tiny = {
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

const STANDARD_WIDTH = 1200
const STANDARD_HEIGHT = 2000
const SWH = STANDARD_WIDTH / 2
const SHH = STANDARD_HEIGHT / 2
maps.standard = {
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

//CONSTRUCTOR

const GameMap = function (parent) {

  let layout
  let automateTimer = null

  let container = Render.group()
  const floorContainer = Render.group()
  const wallContainer = Render.group()
  const fogContainer = Render.group()
  floorContainer.add(wallContainer)
  container.add(floorContainer)
  container.add(fogContainer)
  parent.add(container)
  this.floorContainer = floorContainer

  pointer.init(floorContainer)

  const walls = []

//LISTEN

  let previousPositionX, previousPositionY, previousCameraX, previousCameraY

  container.interactive = true

//MANAGE

  const sightsArray = []

  this.addSight = function (sight) {
    sightsArray.push(sight)
  }

  this.blockCheck = function (moveX, moveY) {
    if (moveX < 1 || moveY < 1 || moveX >= layout.width * 1000 || moveY >= layout.height * 1000) {
      return null
    }
    return walls
  }

  const createWallRect = function (x, y, w, h, team) {
    walls.push([(x - w / 2) * 100, (y - h / 2) * 100, w * 100, h * 100])

    RenderMinimap.addWall(x, y, w, h, team)
    Render.wall(x, y, w, h, {
      color: dataConstants.wallColors[team],
      parent: wallContainer,
    })
  }

  const createWallCap = function (x, y, radius, team) {
    radius = radius / 2
    walls.push([x * 100, y * 100, radius * 100])

    RenderMinimap.addWallCap(x, y, radius, team)
    Render.wallCap(x, y, radius, {
      color: dataConstants.wallColors[team],
      parent: wallContainer,
    })
  }

  const getTargetFromPoint = function (point) {
    const diffX = Math.round((point.x - previousCameraX) * 100)
    const diffY = Math.round((point.y - previousCameraY) * 100)
    return [diffX, diffY]
  }

  this.build = function (name) {
    name = 'standard'
    layout = maps[name]

    const mapWidth = layout.width
    const mapHeight = layout.height
    Render.positionCamera(mapWidth / 2, mapHeight / 2)

    Mini.init(mapWidth, mapHeight)

    this.selectionRing = Render.ring(32, 4, {
      color: 0xff00dd,
      opacity: 0.5,
      parent: floorContainer,
    })
    this.selectionRing.visible = false

    this.targetRing = Render.ring(32, 4, {
      color: 0xff0000,
      opacity: 0.5,
      parent: floorContainer,
    })
    this.targetRing.visible = false

    const ground = Render.ground(mapWidth, mapHeight, {
      color: 0x448866,
      floor: floorContainer,
      ceiling: fogContainer,
    })
    ground.owner = ground

    ground.onHover = () => {
    }
    ground.onMove = (point) => {
      const showActivateGround = store.state.local.skills.getGroundTarget
      if (showActivateGround) {
        const target = getTargetFromPoint(point)
        store.state.local.skills.groundTarget = target
        this.selectionRing.position.x = target[0] / 100
        this.selectionRing.position.y = target[1] / 100
      }
      this.selectionRing.visible = showActivateGround
    }
    ground.onBlur = () => {
      this.selectionRing.visible = false
    }

    ground.onClick = (point) => {
      const target = getTargetFromPoint(point)

      if (store.state.local.skills.getGroundTarget) {
        store.state.local.skills.activation(target)
      } else {
        store.cancelActiveSkill()
        Bridge.emit('action', { target })
        store.setSelectedUnit(Local.player.unit)

        if (automateTimer) {
          clearInterval(automateTimer)
          automateTimer = null
        }
      }
      return true
    }

    if (Local.TESTING || Local.player.name === 'bot') {
      automateTimer = setInterval(() => { //SAMPLE
        if (Local.player) {
          const dx = Math.round(Math.random() * 100 * layout.width)
          const dy = Math.round(Math.random() * 100 * layout.height)
          Bridge.emit('action', { target: [dx, dy] })
        }
      }, Math.random() * 2000 + 1000)
    }

    for (let idx = 0; idx < layout.minions.length; idx += 1) {
      const minionSpawn = layout.minions[idx]
      for (let team = 0; team < 2; team += 1) {
        for (let pidx = 0; pidx < minionSpawn.paths.length; pidx += 1) {
          const mini = Mini.spawn(team, minionSpawn.type, minionSpawn.paths[pidx], minionSpawn.mirrored)
          mini.isDying = true
        }
      }
    }

    for (let idx = 0; idx < layout.walls.length; idx += 1) {
      const wall = layout.walls[idx]
      const radius = wall.radius
      for (let team = 0; team < 2; team += 1) {
        const firstTeam = team === 0
        let teamX = firstTeam ? mapWidth - wall.start.x : wall.start.x
        let teamY = firstTeam ? mapHeight - wall.start.y : wall.start.y
        const teamMp = firstTeam ? -1 : 1
        for (let mirror = 0; mirror < (wall.mirror ? 2 : 1); mirror += 1) {
          const mirrored = mirror > 0
          const mirroredMp = mirrored ? 1 : -1
          let segmentX = mirrored ? mapWidth - teamX : teamX
          let segmentY = teamY
          for (let pidx = 0; pidx < wall.move.length; pidx += 1) {
            const point = wall.move[pidx]
            const dx = -point.dx * teamMp * mirroredMp
            const dy = point.dy * teamMp
            const vertical = dy !== 0
            createWallCap(segmentX, segmentY, radius * 2, team)

            let wallX = segmentX
            let wallY = segmentY
            if (vertical) {
              wallY += dy
            } else {
              wallX += dx
            }
            const wallWidth = Math.abs(point.dx || radius) * 2
            const wallHeight = Math.abs(point.dy || radius) * 2
            createWallRect(wallX, wallY, wallWidth, wallHeight, team)

            segmentX += dx * 2
            segmentY += dy * 2
            if (pidx + 1 === wall.move.length && wall.endCap) {
              createWallCap(segmentX, segmentY, radius * 2, team)
            }
          }
        }
      }
    }
    for (let idx = 0; idx < layout.towers.length; idx += 1) {
      const tower = layout.towers[idx]
      const towerType = tower[0]
      const ox = tower[1]
      const oy = tower[2]
      const mirroring = tower[3]
      let mirrored = false
      for (let mirror = 0; mirror < (mirroring ? 2 : 1); mirror += 1) {
        mirrored = !mirrored
        for (let team = 0; team < 2; team += 1) {
          const firstTeam = team === 0
          const tx = firstTeam != mirrored ? mapWidth - ox : ox
          const ty = firstTeam ? mapHeight - oy : oy
          new Tower(team, towerType, tx, ty)
        }
      }
    }
  }

  this.destroy = function () {
    Mini.destroy()

    if (automateTimer) {
      clearInterval(automateTimer)
      automateTimer = null
    }
  }

  this.track = function (cameraX, cameraY) {
    if (cameraX !== previousPositionX) {
      previousPositionX = cameraX

      const lwh = layout.width / 2
      cameraX = -cameraX + lwh
      const minX = -lwh / 2
      if (cameraX < minX) {
        cameraX = minX
      } else {
        const maxX = lwh / 2
        if (cameraX > maxX) {
          cameraX = maxX
        }
      }
      if (cameraX != previousCameraX) {
        container.position.x = cameraX
        previousCameraX = cameraX
      }
    }
    const ratio = layout.height / window.innerHeight
    cameraY -= 16 * ratio
    if (cameraY !== previousPositionY) {
      previousPositionY = cameraY

      const offset = ratio * 96
      const lhh = layout.height / 2
      cameraY = -cameraY + lhh
      const minY = -lhh / 2 - offset
      if (cameraY < minY) {
        cameraY = minY
      } else {
        const maxY = lhh / 2 + offset
        if (cameraY > maxY) {
          cameraY = maxY
        }
      }
      if (cameraY != previousCameraY) {
        container.position.y = cameraY
        previousCameraY = cameraY
      }
    }
  }

  this.minionData = function () {
    return layout.minions
  }

//DIMENSIONS

  this.width = function () {
    return layout.width
  }

  this.height = function () {
    return layout.height
  }

  this.centerX = function () {
    return layout.width * 0.5
  }

  this.centerY = function () {
    return layout.height * 0.5
  }

}

export default GameMap
