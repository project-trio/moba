import Decimal from 'decimal.js'
import TrigCache from '@/play/external/trigcache'

import Local from '@/play/local'

import Render from '@/play/render/render'

import Util from '@/play/game/util'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const POSITION_MAGNITUDE_OFFSET = 100

let allBullets = null

//CLASS

class Bullet {

  // Constructor

  constructor (source, target, data, x, y, startAngle) {
    this.team = source.team
    this.source = source
    this.unitTarget = target.stats !== undefined
    source.bulletCount += 1
    if (data.heal) {
      this.heal = data.heal
    } else {
      this.rebound = source.rebound
    }

    this.dot = data.dot
    this.firstCollision = data.firstCollision
    this.hitsTowers = data.hitsTowers
    this.allies = data.allies
    this.modify = data.modify
    this.maxRange = this.unitTarget ? null : data.maxRange
    this.toMaxRange = data.toMaxRange === true
    this.explosionRadius = data.explosionRadius
    this.effectDuration = data.effectDuration
    this.stunDuration = data.stunDuration

    this.propagated = 0
    this.propagates = data.propagates
    this.propagateRange = data.propagateRange
    this.targeted = []
    this.color = this.rebound ? 0x0000ff : data.bulletColor || 0x000000

    this.container = Render.group()
    const ball = Render.sphere(data.bulletSize, { color: this.color, hideOutline: true })
    this.container.add(ball)
    Local.game.map.floorContainer.add(this.container)

    this.attackDamage = data.attackDamage
    this.attackPierce = data.attackPierce
    this.moveConstant = new Decimal(data.attackMoveSpeed).dividedBy(500)

    if (source.height) {
      this.dropRate = 1400000 * this.moveConstant.toNumber() / Math.sqrt(source.distanceTo(target))
    }
    if (!this.unitTarget) {
      this.collisionCheck = Util.squared(data.collisionSize || data.attackMoveSpeed * 100)
    }
    this.setLocation(x, y, source.height, startAngle)
    this.setTarget(target)

    allBullets.push(this)
  }

  setTarget (target) {
    this.target = target
    if (this.unitTarget) {
      this.collisionCheck = Util.squared(target.stats.collision)
    }
    if (this.unitTarget) {
      this.targeted.push(target.id)
      this.updateTarget(true)
    } else {
      this.setDestination(target[0], target[1])
    }
  }

  // Geometry

  setLocation (x, y, z, angle) {
    this.sx = x
    this.sy = y
    this.px = x
    this.py = y
    this.container.position.set(x, y, z)
    if (angle) {
      this.container.rotation.z = angle
    }
  }

  // Move

  setDestination (x, y) {
    const dx = x - this.px
    const dy = y - this.py
    let moveX, moveY
    if (dx !== 0 || dy !== 0) {
      const moveAngle = Util.angleOf(dx, dy, false)
      this.aimTargetAngle = moveAngle.toNumber() / 1000
      const angleIndex = TrigCache.indexFor(moveAngle)
      moveX = TrigCache.cos(angleIndex)
      moveY = TrigCache.sin(angleIndex)
    } else { //TODO workaround
      moveX = 0
      moveY = 0
      // warn('Bullet at destination', this.px, this.py)
    }
    this.moveX = moveX
    this.moveY = moveY
    this.destX = x
    this.destY = y
  }

  updatePosition (moveToX, moveToY) {
    if (!moveToX) {
      moveToX = this.px
      moveToY = this.py
    }
    moveToX /= POSITION_MAGNITUDE_OFFSET
    moveToY /= POSITION_MAGNITUDE_OFFSET
    this.container.position.x = moveToX
    this.container.position.y = moveToY
  }

  reachedDestination (renderTime) {
    if (this.explosionRadius) {
      new AreaOfEffect(this.source, false, {
        dot: this.dot,
        hitsTowers: this.hitsTowers,
        px: this.px,
        py: this.py,
        color: this.color,
        opacity: 0.25,
        allies: this.allies,
        modify: this.modify,
        radius: this.explosionRadius,
        attackDamage: this.attackDamage,
        attackPierce: this.attackPierce,
        endAt: (this.effectDuration ? renderTime + this.effectDuration : null),
        parent: Local.game.map.floorContainer,
      })
    } else if (this.heal) {
      this.target.addHealth(this.heal)
    } else if (this.unitTarget && !this.target.isDead) {
      if (this.attackDamage) {
        const damage = this.target.takeDamage(this.source, renderTime, this.attackDamage, this.attackPierce)
        if (this.rebound && !this.source.isDead) {
          const heal = new Decimal(damage).times(this.rebound).round().toNumber()
          new Bullet(this.target, this.source, { bulletColor: 0x00ff00, heal: heal, bulletSize: 8, attackMoveSpeed: 10 }, this.px, this.py, this.container.rotation.z)
        }
      }
      if (this.stunDuration && (this.hitsTowers || !this.target.tower) && this.target.hasModifier('moveSpeed', 'Poison')) {
        this.target.stun(renderTime, this.stunDuration)
      } else if (this.modify) {
        this.target.modifyData(renderTime, this.modify)
      }
    }

    if (this.propagates && this.propagated < this.propagates) {
      const units = Unit.all()
      const targetTeam = this.target.team
      let nearestUnit
      let nearestDistance = Util.squared(this.propagateRange * 100)
      for (let idx = units.length - 1; idx >= 0; idx -= 1) {
        const unit = units[idx]
        if (unit.team === targetTeam && unit.targetableStatus() && this.targeted.indexOf(unit.id) === -1) {
          const distance = unit.distanceTo(this.target)
          if (distance < nearestDistance) {
            nearestDistance = distance
            nearestUnit = unit
          }
        }
      }
      if (nearestUnit) {
        this.propagated += 1
        this.unitTarget = true
        this.setTarget(nearestUnit)
        return
      }
    }

    this.destroy()
  }

  destroy () {
    if (!this.remove) {
      this.source.bulletCount -= 1
      if (this.container.parent) {
        Render.remove(this.container)
      }
      this.remove = true
    }
  }

  distanceToStart () {
    return Util.pointDistance(this.px, this.py, this.sx, this.sy)
  }

  move (renderTime, timeDelta, tweening) {
    let cx, cy
    let moveByX, moveByY
    if (tweening) {
      cx = this.container.position.x * POSITION_MAGNITUDE_OFFSET
      cy = this.container.position.y * POSITION_MAGNITUDE_OFFSET

      const tweenScalar = this.currentSpeed * timeDelta
      moveByX = tweenScalar * this.moveX
      moveByY = tweenScalar * this.moveY
    } else {
      cx = this.px
      cy = this.py

      // Cache
      const moveSpeed = this.moveConstant
      this.currentSpeed = moveSpeed.toNumber()

      const moveScalar = moveSpeed.times(timeDelta)
      moveByX = moveScalar.times(this.moveX).round().toNumber()
      moveByY = moveScalar.times(this.moveY).round().toNumber()
    }

    let movingToX = cx + moveByX
    let movingToY = cy + moveByY
    if (tweening) {
      this.updatePosition(movingToX, movingToY)
    } else {
      let reachedApproximate = false
      if (this.maxRange && !Util.withinSquared(this.distanceToStart(), this.maxRange * 100)) {
        reachedApproximate = true
      } else if (!this.toMaxRange) {
        const distX = this.destX - movingToX
        const distY = this.destY - movingToY
        if (Math.abs(distX) < this.collisionCheck && Math.abs(distY) < this.collisionCheck) {
          reachedApproximate = Util.pointDistance(movingToX, movingToY, this.destX, this.destY) <= this.collisionCheck
        }
      }
      if (reachedApproximate) {
        this.reachedDestination(renderTime)
      } else {
        this.px = movingToX
        this.py = movingToY
        this.updatePosition(movingToX, movingToY)
        if (this.dropRate && this.container.position.z > 0) {
          this.container.position.z -= this.dropRate
        }
      }
    }
  }

  // Collision

  checkCollision (renderTime, units) {
    for (let idx = units.length - 1; idx >= 0; idx -= 1) {
      const unit = units[idx]
      if (unit.hittableStatus() && unit.team !== this.team && (!unit.tower || this.hitsTowers)) {
        const dist = Util.pointDistance(this.px, this.py, unit.px, unit.py)
        // if (Util.withinSquared(dist, this.collisionSize + unit.stats.collision)) { //TODO support bullet size
        if (dist <= unit.collisionCheck * 2) {
          if (!this.explosionRadius) {
            this.unitTarget = unit
            this.target = unit
          }
          this.reachedDestination(renderTime)
          return true
        }
      }
    }
  }

  // Aim

  updateAim () {
    this.aimTargetAngle = Util.angleBetween(this, this.target, true)
    this.container.rotation.z = this.aimTargetAngle
  }

  updateTarget (force) {
    if (!force && this.target.isDead) {
      this.unitTarget = false
      return
    }
    this.setDestination(this.target.px, this.target.py)
  }

}

//STATIC

Bullet.init = function () {
  allBullets = []
}

Bullet.destroy = function () {
  allBullets = null
}

Bullet.all = function () {
  return allBullets
}

Bullet.update = function (renderTime, timeDelta, tweening) {
  let startIndex = allBullets.length - 1

  if (!tweening) {
    // Update
    const units = Unit.all()
    for (let idx = startIndex; idx >= 0; idx -= 1) {
      const bullet = allBullets[idx]
      if (bullet.unitTarget) {
        bullet.updateTarget(false)
      } else if (bullet.firstCollision) {
        bullet.checkCollision(renderTime, units)
      }
      if (bullet.remove) {
        allBullets.splice(idx, 1)
        startIndex -= 1
      }
    }
  }

  // Move
  for (let idx = startIndex; idx >= 0; idx -= 1) {
    const bullet = allBullets[idx]
    if (bullet.unitTarget) {
      bullet.updateAim()
    }
    bullet.move(renderTime, timeDelta, tweening)
    if (bullet.updateAnimations) {
      bullet.updateAnimations(renderTime)
    }
  }
}

export default Bullet
