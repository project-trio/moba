import Local from '@/play/local'

import Render from '@/play/render/render'

import Animate from '@/play/game/helpers/animate'
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
    this.startAt = data.delay ? data.time + data.delay : null
    this.endAt = data.endAt
    this.active = true
    this.hitsTowers = data.hitsTowers
    if (data.allies !== undefined) {
      this.allies = data.allies
    } else {
      this.allies = false
    }
    this.modify = data.modify

    const startingOpacity = this.startAt ? 0 : data.opacity
    this.circle = Render.circle(data.radius, { color: data.color, opacity: startingOpacity, parent: withUnit ? data.parent : Local.game.map.floorContainer })

    if (data.px) {
      this.px = data.px
      this.py = data.py
      this.circle.position.x = this.px / POSITION_MAGNITUDE_OFFSET
      this.circle.position.y = this.py / POSITION_MAGNITUDE_OFFSET
    }
    if (data.z) {
      this.circle.position.z = data.z
    }

    this.collisionSize = data.radius * POSITION_MAGNITUDE_OFFSET
    this.attackDamage = data.attackDamage
    this.attackPierce = data.attackPierce
    this.stunDuration = data.stunDuration

    areaofEffects.push(this)
    Animate.apply(this)

    if (this.startAt) {
      this.queueAnimation('circle', 'opacity', {
        from: 0,
        to: 0.1,
        final: data.opacity,
        start: data.time,
        duration: data.delay,
      })
    }
  }

  apply (renderTime, units) {
    const fromUnit = this.source
    for (let idx = units.length - 1; idx >= 0; idx -= 1) {
      const target = units[idx]
      if (target.isDead || target.untargetable || (target.tower && !this.hitsTowers)) {
        continue
      }
      const isAlly = fromUnit.alliedTo(target)
      if (isAlly !== this.allies) {
        continue
      }
      let distance
      if (this.withUnit) {
        distance = fromUnit.distanceTo(target)
      } else {
        distance = Util.pointDistance(this.px, this.py, target.px, target.py)
      }
      if (Util.withinSquared(distance, this.collisionSize + target.stats.collision)) {
        if (this.modify) {
          target.modifyData(renderTime, this.modify)
        }
        if (!isAlly) {
          if (this.attackDamage) {
            target.takeDamage(fromUnit, renderTime, this.attackDamage, this.attackPierce)
          }
          if (this.stunDuration) {
            target.stun(renderTime, this.stunDuration)
          }
        }
      }
    }
  }

  destroy () {
    Render.remove(this.circle)
    this.remove = true
  }

  deactivate (renderTime) {
    this.active = false
    this.queueAnimation('circle', 'opacity', {
      from: this.circle.material.opacity / 1.5,
      to: 0,
      start: renderTime,
      duration: 300,
      onComplete: () => {
        this.destroy()
      },
    })
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
  for (let idx = areaofEffects.length - 1; idx >= 0; idx -= 1) {
    const aoe = areaofEffects[idx]
    aoe.updateAnimations(renderTime)
    if (aoe.remove) {
      areaofEffects.splice(idx, 1)
      continue
    }
    if (!aoe.active || (aoe.startAt && renderTime < aoe.startAt)) {
      continue
    }
    if (aoe.endAt && renderTime >= aoe.endAt) {
      aoe.deactivate(renderTime)
    } else {
      aoe.apply(renderTime, units)
      if (!aoe.dot) {
        aoe.deactivate(renderTime)
      }
    }
  }
}

export default AreaOfEffect
