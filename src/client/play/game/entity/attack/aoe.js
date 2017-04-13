import Local from '@/play/local'

import Render from '@/play/render/render'

import Util from '@/play/game/util'

const POSITION_MAGNITUDE_OFFSET = 100

let areaofEffects = null

//CLASS

class AreaOfEffect {

  // Constructor

  constructor (source, withUnit, data) {
    this.source = source
    this.withUnit = withUnit
    this.dot = data.dot
    this.endAt = data.endAt
    this.active = true
    this.hitsTowers = data.hitsTowers
    this.allies = data.allies
    this.modify = data.modify

    this.circle = Render.circle(data.radius, { color: data.color, opacity: data.opacity, parent: withUnit ? data.parent : Local.game.map.floorContainer })

    if (data.px) {
      this.px = data.px
      this.py = data.py
      this.circle.position.x = this.px / POSITION_MAGNITUDE_OFFSET
      this.circle.position.y = this.py / POSITION_MAGNITUDE_OFFSET
    }
    if (data.z) {
      this.circle.position.z = data.z
    }

    this.collisionSize = data.radius
    this.attackDamage = data.attackDamage
    this.attackPierce = data.attackPierce

    areaofEffects.push(this)
  }

  apply (renderTime, units) {
    const fromUnit = this.source
    for (let idx = units.length - 1; idx >= 0; idx -= 1) {
      const target = units[idx]
      if (target.tower && !this.hitsTowers) {
        continue
      }
      const isAlly = fromUnit.alliedTo(target)

      if (isAlly === this.allies) {
        if (this.modify) {
          target.modifyData(renderTime, this.modify)
        }
      }
      if (!isAlly) {
        if (this.attackDamage && !target.isDying && !target.untargetable) {
          let distance
          if (this.withUnit) {
            distance = fromUnit.distanceTo(target)
          } else {
            distance = Util.pointDistance(this.px, this.py, target.px, target.py)
          }
          if (Util.withinSquared(distance, this.collisionSize * POSITION_MAGNITUDE_OFFSET + target.stats.collision)) {
            if (this.attackDamage) {
              target.takeDamage(fromUnit, renderTime, this.attackDamage, this.attackPierce)
            }
          }
        }
      }
    }
  }

  destroy () {
    Render.remove(this.circle)
    this.remove = true
  }

}

//STATIC

AreaOfEffect.init = function () {
  areaofEffects = []
}

AreaOfEffect.destroy = function () {
  areaofEffects = null
}

AreaOfEffect.all = function () {
  return areaofEffects
}

AreaOfEffect.update = function (renderTime, units) {
  for (let idx = 0; idx < areaofEffects.length; idx += 1) {
    const aoe = areaofEffects[idx]
    if (aoe.active) {
      if (aoe.endAt && renderTime >= aoe.endAt) {
        aoe.active = false
        aoe.circle.material.opacity /= 1.5
      } else {
        aoe.apply(renderTime, units)
        if (!aoe.dot) {
          aoe.active = false
        }
      }
    }
    if (!aoe.active) {
      const currentOpacity = aoe.circle.material.opacity
      if (currentOpacity < 0.01) {
        aoe.destroy()
      } else {
        aoe.circle.material.opacity -= 0.01
      }
    }
    if (aoe.remove) {
      areaofEffects.splice(idx, 1)
      idx -= 1
    }
  }
}

export default AreaOfEffect
