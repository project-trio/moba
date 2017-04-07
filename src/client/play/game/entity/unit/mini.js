import minisData from '@/play/data/minis'

import Render from '@/play/render/render'

import Movable from '@/play/game/entity/unit/movable'
import Unit from '@/play/game/entity/unit/unit'

//CLASS

let mapWidth, mapHeight
let spawnCount = 0

class Mini extends Movable {

  constructor (team, type, path, mirrored) {
    const stats = minisData[type]

    super(team, stats, 1)

    this.type = type
    this.name = `${type} mini`
    this.moveToTarget = true
    this.exactDestination = true

    this.setPath(path, mirrored)

    Render.voxel(team, 'mini', { z: -7, parent: this.top, owner: this, cache: true })
  }

  setPath (path, mirrored) {
    this.id = `mini${spawnCount}`
    spawnCount += 1
    this.path = path
    this.pathFlip = false
    this.mirrored = mirrored
    this.pathProgress = 0
    this.pathing = true
    this.returningToPath = false
    this.pathStep = 0

    this.updateDestination()
    this.setLocation(this.currentDest[0], this.currentDest[1])
    this.reachedDestination(true)
  }

  refresh (team, path, mirrored) {
    this.isDead = false
    this.isDying = false
    this.updateHealth(this.stats.healthMax)
    if (this.isRendering) {
      this.container.visible = true
    }

    this.setPath(path, mirrored)

    this.damagers = {}
    this.attackTarget = null
    this.invisible = false
  }

  setDestination (x, y, preadjusted, moveX, moveY, fixedMovement) {
    this.returningToPath = false
    super.setDestination(x, y, preadjusted, moveX, moveY)

    // if (fixedMovement) {
    //   const moveAngle = Math.atan2(y*100 - this.py, x*100 - this.px)
    //   const diffX = Math.round(Math.cos(moveAngle) * 1000)
    //   const diffY = Math.round(Math.sin(moveAngle) * 1000)
    //   if (diffX != moveX || diffY != moveY) {
    //     const sourceDest = this.path[this.pathProgress]
    //     console.log('Invalid fixed movement', [sourceDest[0],sourceDest[1]], [moveX,moveY], [diffX,diffY])
    //   }
    // }
  }

  updateDestination () {
    let nextDest = this.path[this.pathProgress]
    if (nextDest) {
      nextDest = nextDest.slice()
      if (this.pathFlip) {
        const prevDest = this.path[this.pathProgress + 1]
        nextDest[2] = prevDest[2]
        nextDest[3] = prevDest[3]
      }

      if (this.mirrored) {
        nextDest[0] = mapWidth - nextDest[0]
      }
      if (nextDest[2] && this.pathFlip === this.mirrored) {
        nextDest[2] = -nextDest[2]
      }
      if ((this.team === 0) != this.pathFlip) {
        nextDest[1] = mapHeight - nextDest[1]
      }
      if (nextDest[3] && this.team === 1) {
        nextDest[3] = -nextDest[3]
      }
    }
    this.currentDest = nextDest
  }

  reachedDestination (needsNewDestination) {
    if (!this.pathing && this.returningToPath) {
      this.pathing = true
    }
    if (this.pathing) {
      if (needsNewDestination) {
        if (this.pathFlip || this.pathProgress == this.path.length - 1) {
          this.pathProgress -= 1
          if (this.pathProgress < 0) {
            return false
          }
          this.pathFlip = true
        } else {
          this.pathProgress += 1
        }
        this.updateDestination()
      }
      if (this.currentDest) {
        this.setDestination(this.currentDest[0], this.currentDest[1], false, this.currentDest[2], this.currentDest[3], true)
        return true
      }
    } else {
      this.getAttackTarget(Unit.all())
      if (!this.attackTarget) {
        this.setDestination(this.currentDest[0], this.currentDest[1], false)
        this.returningToPath = true
      }
    }
  }

  blocked (bx, by) {
    return false
  }

  shouldMove () {
    return this.currentDest != null && super.shouldMove()
  }

  die () {
    this.isDead = true
    this.container.visible = false
    this.isRendering = false
    this.invisible = true
    this.removeTarget()

    cache[this.type][this.team].push(this)
  }

  // Aim

  getAttackTarget (units) {
    let closest = this.sightRangeCheck
    let target = null
    for (let idx = 0; idx < units.length; idx += 1) {
      const unit = units[idx]
      if (this.attackableStatus(unit)) {
        const dist = this.distanceTo(unit)
        if (dist < closest) {
          target = unit
          closest = dist
        }
      }
    }
    return this.setTarget(target, closest)
  }

  updateMoveTarget () {
    const hasTarget = super.updateMoveTarget()
    if (hasTarget && this.pathing) {
      this.pathing = false
    }
  }

}

//CACHE

let cache

Mini.spawn = function (team, type, path, mirrored) {
  const cachedMini = cache[type][team].pop()
  if (cachedMini) {
    cachedMini.refresh(team, path, mirrored)
    return cachedMini
  }
  return new Mini(team, type, path, mirrored)
}

Mini.init = function (_mapWidth, _mapHeight) {
  cache = {
    melee: [[], []],
    ranged: [[], []],
  }
  mapWidth = _mapWidth
  mapHeight = _mapHeight
}

Mini.destroy = function () {
  cache = null
}

export default Mini
