import Render from '@/play/render/render'

import Util from '@/play/game/util'

const POSITION_MAGNITUDE_OFFSET = 100

const areaofEffects = []

//CLASS

class AreaOfEffect {

  // Constructor

  constructor (source, withUnit, data) {
    this.source = source
    this.withUnit = withUnit
    this.dot = data.dot
    this.active = true

    this.circle = Render.circle(data.radius, { color: data.color, opacity: data.opacity, parent: data.parent })

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
    for (let idx = 0; idx < units.length; idx += 1) {
      const target = units[idx]
      if (!fromUnit.alliedTo(target) && !target.isDying && !target.untargetable) {
        let distance
        if (this.withUnit) {
          distance = fromUnit.distanceTo(target)
        } else {
          distance = Util.pointDistance(this.px, this.py, target.px, target.py)
        }
        if (Util.withinSquared(distance, this.collisionSize * POSITION_MAGNITUDE_OFFSET)) {
          if (this.attackDamage) {
            target.takeDamage(fromUnit, renderTime, this.attackDamage, this.attackPierce)
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

AreaOfEffect.all = function () {
  return areaofEffects
}

AreaOfEffect.update = function (renderTime, units) {
  for (let idx = 0; idx < areaofEffects.length; idx += 1) {
    const aoe = areaofEffects[idx]
    if (aoe.active) {
      aoe.apply(renderTime, units)
      if (!aoe.dot) {
        aoe.active = false
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