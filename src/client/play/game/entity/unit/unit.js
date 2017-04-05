import Decimal from 'decimal.js'

import store from '@/store'

import Bridge from '@/play/events/bridge'
import Local from '@/play/local'

import Render from '@/play/render/render'

import Util from '@/play/game/util'

import Bullet from '@/play/game/entity/attack/bullet'

//LOCAL

let allUnits = null

let targetingGround = false

//CLASS

class Unit {

  // Constructor

  constructor (team, statBase, unitScale, sx, sy, startAngle, isLocal, renderInBackground) {
    const unattackable = !statBase.healthMax
    this.team = team
    this.localAlly = Local.player && team === Local.player.team
    this.startAngle = startAngle
    this.damagers = {}
    this.isLocal = isLocal

    this.renderInBackground = renderInBackground
    this.movable = false
    this.attackTarget = null
    this.isAttackingTarget = false
    this.requiresSightOfTarget = true
    this.bulletCount = 0
    this.height = 0
    this.split = false
    this.unattackable = unattackable
    this.untargetable = unattackable
    this.noTargeting = unattackable
    this.eyeShield = null
    this.isStunned = false

    this.fogRadius = null
    this.fogCircle = null
    this.minimapCircle = null

    this.container = Render.group()
    this.model = Render.group()
    this.base = Render.group()
    this.top = Render.group()
    this.floor = Render.group()

    this.container.add(this.floor)
    this.model.add(this.base)
    this.model.add(this.top)
    this.container.add(this.model)
    Local.game.map.floorContainer.add(this.container)

    // Stats

    this.stats = {
      sightRange: statBase.sightRange[0] * 100,
    }
    this.sightRangeCheck = Util.squared(this.stats.sightRange)

    if (!unattackable) {
      const ringOffset = unitScale > 3 ? 2 : 6
      const selectionRing = Render.ring(statBase.collision + ringOffset, 4, { color: 0x000000, opacity: 0.5, parent: this.floor })
      this.selectionIndicator = selectionRing
      this.selectionIndicator.visible = false

      const clickCircle = Render.circle(statBase.collision + 8, { color: 0x000000, opacity: 0, parent: this.container })
      clickCircle.position.z = 1
      clickCircle.owner = this

      this.stats.healthMax = statBase.healthMax[0] * 100
      this.stats.healthRegen = statBase.healthRegen[0]
      this.stats.armor = statBase.armor[0]
      this.stats.sightRange = statBase.sightRange[0] * 100
      this.stats.attackRange = statBase.attackRange[0] * 100
      this.stats.attackDamage = statBase.attackDamage[0] * 100
      this.stats.attackPierce = statBase.attackPierce[0] * 100
      this.stats.attackCooldown = statBase.attackCooldown[0]
      this.stats.attackMoveSpeed = statBase.attackMoveSpeed
      this.stats.turnSpeed = statBase.turnSpeed || 8
      this.stats.collision = statBase.collision * 100
      this.stats.bulletSize = statBase.bulletSize
      this.stats.bulletColor = statBase.bulletColor

      this.healthRemaining = this.stats.healthMax
      this.attackRangeCheck = Util.squared(this.stats.attackRange)

      const moveSpeed = statBase.moveSpeed ? statBase.moveSpeed[0] : false
      if (moveSpeed) {
        this.stats.moveSpeed = moveSpeed
        this.moveConstant = new Decimal(moveSpeed).dividedBy(2000)
      }

      this.lastAttack = 0

      // Health Bar
      let hpHeight, hpWidth
      let hpOffsetZ
      if (unitScale === 1) {
        hpHeight = 3
        hpWidth = 40
        hpOffsetZ = 40
      } else if (unitScale === 2 || unitScale === 3) {
        hpHeight = 4
        hpWidth = 62
        hpOffsetZ = 60
      } else {
        hpHeight = 5
        hpWidth = 72
        hpOffsetZ = 80
      }
      this.healthWidth = hpWidth
      this.infoContainer = Render.group()
      this.infoContainer.position.y = 40
      this.infoContainer.position.z = hpOffsetZ
      this.hpHeight = hpHeight
      this.hpWidth = hpWidth

      const outlineWeight = 1
      Render.rectangle(0, 0, hpWidth + outlineWeight, hpHeight + outlineWeight, {
        color: 0x000000,
        parent: this.infoContainer,
      })
      Render.rectangle(0, 0, hpWidth, hpHeight, {
        color: 0xFF3333,
        parent: this.infoContainer,
      })
      this.healthBar = Render.rectangle(-hpWidth / 2, 0, hpWidth, hpHeight, {
        color: 0x33FF99,
        parent: this.infoContainer,
      })
      this.healthBar.geometry.translate(hpWidth / 2, 0, 0)

      this.container.add(this.infoContainer)
    }

    // Start location

    if (sx) {
      this.setLocation(sx, sy)
    }

    Render.addUnit(this, this.stats.collision)
    allUnits.push(this)
  }

  allyNotLocal () {
    return this.localAlly
  }

  // Render

  renderTargetRing (x, y) {
    const targetRing = Local.game.map.targetRing
    targetRing.visible = true
    targetRing.position.x = x
    targetRing.position.y = y
    targetRing.scale.x = 1
    targetRing.scale.y = 1
    targetingGround = true
  }

  setSelection (color) {
    const isVisible = color != null
    this.selectionIndicator.visible = isVisible
    if (isVisible) {
      this.selectionIndicator.material.color.setHex(color)
    }
  }

  opacity (opacity) {
    const isTransluscent = opacity < 1
    this.model.traverse((node) => {
      if (node.material) {
        node.material.transparent = isTransluscent
        if (isTransluscent) {
          node.material.opacity = opacity
        }
      }
    })
  }

  // Pointer

  onHover () {
    if (this.isDying) {
      return false
    }
    if (this.id !== store.state.local.skills.unitTarget) {
      if (store.state.local.skills.getUnitTarget) {
        store.state.local.skills.unitTarget = this.id
        if (store.state.local.skills.withAlliance === this.localAlly) {
          this.setSelection(0xff0000)
        }
      } else {
        store.state.local.skills.unitTarget = this.id
      }
    }
    document.body.style.cursor = 'pointer'
  }

  onBlur () {
    if (this.id === store.state.local.skills.unitTarget) {
      store.state.local.skills.unitTarget = null
      if (store.state.local.skills.getUnitTarget) {
        this.setSelection(null)
      }
    }
    document.body.style.cursor = null
  }

  onClick (point, rightClick) {
    setTimeout(() => {
      store.setSelectedUnit(this)
    }, 0)
    if (this.isLocal) { //TODO remove
      return false
    }
    if (this.isDying) {
      return false
    }
    if (store.state.local.skills.getUnitTarget) {
      const withAlliance = store.state.local.skills.withAlliance
      if (withAlliance === null || withAlliance === this.localAlly) {
        store.state.local.skills.activation(this.id)
        return true
      }
    }
    if (this.localAlly) {
      return false
    }
    if (store.state.local.skills.getGroundTarget) {
      return false
    }

    Bridge.emit('action', { target: this.id })
    return true
  }

  // Geometry

  setLocation (x, y) {
    this.px = x * 100
    this.py = y * 100
    this.container.position.set(x, y, 0)

    const angle = this.startAngle || (-Math.PI * 1.5 * (this.team == 0 ? -1 : 1))
    this.top.rotation.z = angle
    this.base.rotation.z = angle
  }

  distanceTo (unit) {
    return Util.pointDistance(this.px, this.py, unit.px, unit.py)
  }
  distanceToPoint (px, py) {
    return Util.pointDistance(this.px, this.py, px, py)
  }

  shouldMove () {
    return false
  }

  // Health

  update (renderTime, timeDelta) {
    if (this.selected) {
      store.everyUpdateStats(this)
    }
  }

  hasDied () {
    return this.healthRemaining <= 0
  }

  updateHealth (newHealth) {
    if (newHealth != null) {
      if (!Number.isInteger(newHealth)) { //TODO debug only
        console.error('newHealth', newHealth)
      }
      this.healthRemaining = newHealth
    } else {
      newHealth = this.healthRemaining
    }

    const healthScale = newHealth / this.stats.healthMax
    if (healthScale > 0) {
      this.healthBar.scale.x = healthScale
      this.healthBar.visible = true
    } else {
      this.healthBar.visible = false
    }
  }

  addHealth (addedHealth) {
    if (this.healthRemaining === this.stats.healthMax) {
      return
    }

    const newHealth = Math.min(this.healthRemaining + addedHealth, this.stats.healthMax)
    this.updateHealth(newHealth)
  }

  takeDamage (source, renderTime, amount, pierce, reflected) {
    let armor = Math.max(0, this.stats.armor - pierce)
    if (this.eyeShield) {
      armor += this.eyeShield
    }
    if (this.armorModifier) {
      armor *= this.armorModifier
      if (!Number.isInteger(armor)) {
        console.error('armor', armor)
      }
    }
    const damage = Math.max(1, amount - armor * 10) //TODO percent
    const newHealth = Math.max(this.healthRemaining - damage, 0)
    if (newHealth == 0) {
      this.isDying = true
    }
    this.updateHealth(newHealth)

    if (!reflected && this.reflectDamageRatio) {
      const reflectedDamage = Math.round((damage * this.reflectDamageRatio) / 100) //TODO desyncs?
      // console.log(damage, reflectedDamage)
      source.takeDamage(this, renderTime, reflectedDamage, 0, true)
    }

    if (source.displayStats) {
      source.displayStats.damage += damage
    }
    const sid = source.player ? source.id : source.name
    const damager = this.damagers[sid]
    if (damager) {
      damager.at = renderTime
      damager.total += damage
    } else {
      this.damagers[sid] = {
        at: renderTime,
        total: damage,
        unit: source,
      }
    }
  }

  die (time) {
    this.isDead = true
    this.timeOfDeath = time
    if (this.infoContainer) {
      this.infoContainer.visible = false
    }
    this.removeTarget()
  }

  destroy () {
    Render.remove(this.container)
    if (this.fogCircle) {
      Render.remove(this.fogCircle)
    }
    if (this.minimapCircle) {
      Render.remove(this.minimapCircle)
    }
    this.remove = true
  }

  // Target

  removeTarget () {
    this.setTarget(null)
    this.attackTarget = null
  }

  setTargetId (id) {
    const target = Unit.get(id)
    if (target && !target.isDead) {
      const dist = this.distanceTo(target)
      this.moveToTarget = true
      return this.setTarget(target, dist, this.isLocal)
    }
  }

  setTarget (target, distance) {
    if (target != this.attackTarget) {
      if (this.attackTarget && this.isLocal) {
        this.attackTarget.setSelection(null)
      }
      if (target) {
        this.attackTarget = target
      } else {
        this.isAttackingTarget = false
      }
    }
    if (target) {
      this.cacheAttackCheck = distance <= this.attackRangeCheck
    } else if (this.attackTarget) {
      if (this.attackTarget.isDying || this.distanceTo(this.attackTarget) >= this.attackRangeCheck) {
        this.attackTarget = null
      }
    }
    return target
  }

  // Aim

  angleTo (container, destAngle) {
    let currAngle = container.rotation.z
    let newAngle
    let angleDiff = Util.distanceBetweenAngles(currAngle, destAngle)
    let turnSpeed = this.stats.turnSpeed / 100
    if (Math.abs(angleDiff) < turnSpeed) {
      newAngle = destAngle
    } else {
      let spinDirection = angleDiff < 0 ? -1 : 1
      newAngle = currAngle + (turnSpeed * spinDirection)
    }
    container.rotation.z = newAngle
    return newAngle
  }

  updateAim () {
    let aimTop
    if (this.attackTarget) {
      aimTop = Util.angleBetween(this, this.attackTarget, true)
    }
    let aimBase = this.isMoving && this.moveTargetAngle

    if (!aimTop) {
      aimTop = aimBase
    }
    if (this.split) {
      if (!aimBase) {
        aimBase = aimTop
      }
      if (aimBase) {
        this.angleTo(this.base, aimBase)
      }
    }
    if (aimTop) {
      this.angleTo(this.top, aimTop)
    }
  }

  // Visibility

  inSightRange (unit) {
    return this.distanceTo(unit) < this.sightRangeCheck
  }

  isGloballyVisible () {
    return this.isDying || this.isFiring || this.renderInBackground
  }

  hasSightOf (unit) {
    return !this.isDead && this.inSightRange(unit)
  }

  canSee (enemy) {
    return !enemy.invisible && (enemy.isGloballyVisible() || this.hasSightOf(enemy))
  }

  // Attack

  alliedTo (target) {
    return this.team == target.team
  }

  inAttackRange (unit) {
    return this.distanceTo(unit) < this.attackRangeCheck
  }

  targetableStatus () {
    return !this.invisible && !this.isDead && !this.untargetable
  }
  attackableStatus (unit) {
    return unit.targetableStatus() && !unit.hasDied() && !this.alliedTo(unit)
  }

  // canAttack (unit) {
  //   return this.attackableStatus(unit) && this.inAttackRange(unit)
  // }

  attack (enemy, renderTime) {
    this.lastAttack = renderTime
    if (!this.stats.attackMoveSpeed) {
      enemy.takeDamage(this, renderTime, this.stats.attackDamage, this.stats.attackPierce)
    } else {
      new Bullet(this, enemy, this.stats, this.px, this.py, this.base.rotation.z) //TODO top rotation
    }
  }

  isAttackOffCooldown (renderTime) {
    if (this.unattackable) {
      return false
    }
    let cooldown = this.stats.attackCooldown * 100
    if (this.attackCooldownModifier) {
      cooldown *= this.attackCooldownModifier
      if (!Number.isInteger(cooldown)) {
        console.error('cooldown', cooldown)
      }
    }
    return renderTime - this.lastAttack > cooldown
  }

  getAttackTarget (units) {
    return null
  }

  checkAttack (renderTime) {
    if (this.isStunned) {
      return
    }
    const attackForTick = this.getAttackTarget(allUnits)
    this.isFiring = attackForTick && this.cacheAttackCheck
    if (this.isFiring) {
      this.attack(attackForTick, renderTime)
    }
  }

}

//STATIC

Unit.init = function () {
  allUnits = []
  targetingGround = false
}

Unit.destroy = function () {
  allUnits = null
}

Unit.all = function () {
  return allUnits
}

Unit.get = function (id) {
  for (let idx = 0; idx < allUnits.length; idx += 1) {
    const unit = allUnits[idx]
    if (unit.id === id) {
      return unit
    }
  }
  console.error('Target id not found', id)
}

Unit.update = function (renderTime, timeDelta, tweening) {

  if (!tweening) {
    // Update
    for (let idx = 0; idx < allUnits.length; idx += 1) {
      const unit = allUnits[idx]
      unit.update(renderTime, timeDelta)
    }
    // Attack
    for (let idx = 0; idx < allUnits.length; idx += 1) {
      const unit = allUnits[idx]
      if (!unit.isDead && unit.isAttackOffCooldown(renderTime)) {
        unit.checkAttack(renderTime)
      }
    }
    // Die
    for (let idx = allUnits.length - 1; idx >= 0; idx -= 1) {
      const unit = allUnits[idx]
      if (unit.isDying && !unit.isDead) {
        unit.die(renderTime)
        if (unit.remove) {
          allUnits.splice(idx, 1)
          idx -= 1
        }
      }
    }
    // Target
    for (let idx = 0; idx < allUnits.length; idx += 1) {
      const unit = allUnits[idx]
      if (!unit.isDead && unit.movable) {
        unit.updateMoveTarget(renderTime)
      }
      unit.eyeShield = null
    }
  }

  // Move

  for (let idx = 0; idx < allUnits.length; idx += 1) {
    const unit = allUnits[idx]
    if (unit.isDying) {
      continue
    }
    if (unit.tween) {
      unit.tween(renderTime)
    }
    unit.updateAim()

    if (tweening && (!unit.isRendering || unit.isBlocked)) {
      continue
    }
    if (unit.shouldMove(renderTime, tweening)) {
      unit.move(timeDelta, tweening)
    }
  }

  if (targetingGround) {
    const targetRing = Local.game.map.targetRing
    const remainingScale = targetRing.scale.x
    const newScale = remainingScale <= 0.01 ? 0 : Math.pow(remainingScale - 0.007, 1.1)
    if (newScale <= 0) {
      targetRing.visible = false
      targetingGround = false
    } else {
      targetRing.scale.x = newScale
      targetRing.scale.y = newScale
    }
  }

}

export default Unit
