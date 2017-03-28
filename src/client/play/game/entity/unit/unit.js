import Decimal from 'decimal.js'

import store from '@/store'

import Bridge from '@/play/events/bridge'
import Local from '@/play/local'

import Render from '@/play/render/render'
import RenderFog from '@/play/render/fog'

import Util from '@/play/game/util'

import Bullet from '@/play/game/entity/unit/bullet'

//LOCAL

const allUnits = []

let targetingGround = false

//CLASS

class Unit {

  // Constructor

  constructor (team, statBase, unitScale, x, y, startAngle) {
    this.team = team
    this.localAlly = team === Local.player.team
    this.startAngle = startAngle
    this.damagers = {}

    this.renderInBackground = false
    this.movable = false
    this.attackTarget = null
    this.isAttackingTarget = false
    this.requiresSightOfTarget = true
    this.bulletCount = 0
    this.height = 0
    this.angleBase = false
    this.untargetable = false

    this.container = Render.group()
    this.shipContainer = Render.group()
    this.base = Render.group()
    this.top = Render.group()
    this.floor = Render.group()

    const ringOffset = unitScale > 3 ? 2 : 6
    const selectionRing = Render.ring(statBase.collision + ringOffset, 4, null)
    this.floor.add(selectionRing)
    this.selectionIndicator = selectionRing
    this.applyOpacity(this.floor, true, 0.5)
    this.selectionIndicator.visible = false

    this.container.add(this.floor)
    this.shipContainer.add(this.base)
    this.shipContainer.add(this.top)
    this.container.add(this.shipContainer)
    Local.game.map.floorContainer.add(this.container)

    RenderFog.add(this)

    // Stats

    this.stats = {
      healthMax: statBase.healthMax[0] * 1000,
      healthRegen: statBase.healthRegen[0],
      armor: statBase.armor[0],
      sightRange: statBase.sightRange[0] * 100,
      attackRange: statBase.attackRange[0] * 100,
      attackDamage: statBase.attackDamage[0] * 1000,
      attackPierce: statBase.attackPierce[0] * 1000,
      attackCooldown: statBase.attackCooldown[0],
      attackMoveSpeed: statBase.attackMoveSpeed[0],
      moveSpeed: statBase.moveSpeed[0],
      turnSpeed: statBase.turnSpeed || 8,
      collision: statBase.collision * 100,
      bulletSize: statBase.bulletSize,
      bulletColor: statBase.bulletColor,
    }

    this.healthRemaining = this.stats.healthMax
    this.sightRangeCheck = Util.squared(this.stats.sightRange)
    this.attackRangeCheck = Util.squared(this.stats.attackRange)
    // this.stats.collisionCheck = Util.squared(this.stats.collision)
    this.moveConstant = new Decimal(this.stats.moveSpeed).dividedBy(2000)

    this.lastAttack = 0

    // Health Bar

    const outlineWeight = 1
    const hpRadius = 3

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
    this.unitInfo = Render.group()
    this.infoContainer.add(this.unitInfo)
    this.unitInfo.position.y = 40
    this.unitInfo.position.z = hpOffsetZ
    this.hpHeight = hpHeight
    this.hpWidth = hpWidth

    Render.rectangle(0, 0, hpWidth, hpHeight, { // HP Backing
      color: 0xFF3333,
      strokeWidth: outlineWeight,
      strokeColor: 0xFFFFFF,
      radius: hpRadius,
      parent: this.unitInfo,
    })

    this.healthBar = Render.rectangle(-hpWidth / 2, 0, hpWidth, hpHeight, {
      color: 0x33FF99,
      radius: hpRadius + 2,
      parent: this.unitInfo,
    })
    this.healthBar.geometry.translate(hpWidth / 2, 0, 0)

    Local.game.map.addInfo(this.infoContainer)

    // Start location

    if (x) {
      this.setLocation(x, y)
    }

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

  applyOpacity (container, isTransluscent, opacity) {
    const mesh = container.children[0]
    if (mesh) {
      mesh.material.transparent = isTransluscent
      if (isTransluscent) {
        mesh.material.opacity = opacity
      }
    }
  }

  opacity (opacity) {
    const isTransluscent = opacity < 1
    this.applyOpacity(this.base, isTransluscent, opacity)
    this.applyOpacity(this.top, isTransluscent, opacity)
  }

  // Pointer

  onHover () {
    document.body.style.cursor = 'pointer'
  }

  onBlur () {
    document.body.style.cursor = null
  }

  onClick (point, rightClick) {
    setTimeout(() => {
      store.setSelectedUnit(this)
    }, 0)
    if (this.isLocal) { //TODO remove
      return false
    }
    if (this.localAlly) {
      return false
    }
    if (store.state.skills.getGroundTarget) {
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
    this.infoContainer.position.set(x, y, 0)

    const angle = this.startAngle || (-Math.PI * 1.5 * (this.team == 0 ? -1 : 1))
    this.top.rotation.z = angle
    this.base.rotation.z = angle
  }

  distanceTo (unit) {
    return Util.pointDistance(this.px, this.py, unit.px, unit.py)
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
    if (this.healthRemaining == this.stats.healthMax) {
      return
    }

    const newHealth = Math.min(this.healthRemaining + addedHealth, this.stats.healthMax)
    this.updateHealth(newHealth)
  }

  takeDamage (source, renderTime, amount, pierce) {
    let armor = Math.max(0, this.stats.armor - pierce)
    if (this.armorModifier) {
      armor *= this.armorModifier
      if (!Number.isInteger(armor)) {
        console.error('armor', armor)
      }
    }
    const damage = Math.max(1, amount - armor) //TODO percent
    const newHealth = Math.max(this.healthRemaining - damage, 0)
    if (newHealth == 0) {
      this.isDying = true
    }
    this.updateHealth(newHealth)

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
    this.infoContainer.visible = false
    this.setTarget(null)
    this.attackTarget = null
  }

  destroy () {
    Render.remove(this.infoContainer)
    Render.remove(this.container)
    if (this.fogCircle) {
      Render.remove(this.fogCircle)
    }
    this.remove = true
  }

  // Target

  setTargetId (id) {
    for (let idx = 0; idx < allUnits.length; idx += 1) {
      const unit = allUnits[idx]
      if (unit.id === id) {
        if (unit.isDead) {
          return false
        }
        const dist = this.distanceTo(unit)
        this.moveToTarget = true
        return this.setTarget(unit, dist, this.isLocal)
      }
    }
    console.error('Target id not found', id)
  }

  setTarget (target, distance, highlight) {
    if (target != this.attackTarget) {
      if (this.attackTarget && this.isLocal) {
        this.attackTarget.setSelection(null)
      }
      if (target) {
        this.attackTarget = target
        if (highlight) {
          target.setSelection(0xff0000)
        }
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
    let aimTop, aimBase
    if (this.attackTarget) {
      aimTop = Util.angleBetween(this, this.attackTarget, true)
    }
    if (this.moveTargetAngle) {
      aimBase = this.moveTargetAngle
    }
    if (!aimTop) {
      aimTop = aimBase
    }
    if (this.angleBase) {
      if (!aimBase) {
        aimBase = aimTop
      }
    } else {
      aimBase = null
    }
    if (aimTop) {
      this.angleTo(this.top, aimTop)
    }
    if (aimBase) {
      this.angleTo(this.base, aimBase)
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

  targetableStatus (unit) {
    return !unit.invisible && !unit.isDead
  }
  attackableStatus (unit) {
    return this.targetableStatus(unit) && !unit.hasDied() && !this.alliedTo(unit)
  }

  // canAttack (unit) {
  //   return this.attackableStatus(unit) && this.inAttackRange(unit)
  // }

  attack (enemy, renderTime) {
    this.lastAttack = renderTime
    if (!this.stats.attackMoveSpeed) { //SAMPLE || this.stats.attackMoveSpeed != 11) {
      enemy.takeDamage(this, renderTime, this.stats.attackDamage, this.stats.attackPierce)
    } else {
      new Bullet(this, enemy, this.stats, this.px, this.py, this.base.rotation.z)
    }
  }

  isAttackOffCooldown (renderTime) {
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
    let attackForTick = this.getAttackTarget(allUnits)
    this.isFiring = attackForTick && this.cacheAttackCheck
    if (this.isFiring) {
      this.attack(attackForTick, renderTime)
    }
  }

}

//STATIC

Unit.all = function () {
  return allUnits
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
        unit.updateMoveTarget()
      }
    }
  }

  // Move

  for (let idx = 0; idx < allUnits.length; idx += 1) {
    const unit = allUnits[idx]
    if (unit.isDying) {
      continue
    }
    unit.updateAim()

    if (tweening && (!unit.isRendering || unit.isBlocked)) {
      continue
    }
    if (unit.shouldMove()) {
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
