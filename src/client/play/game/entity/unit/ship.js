import Decimal from 'decimal.js'

import store from '@/store'

import Local from '@/play/local'

import shipStats from '@/play/data/ships'
import skillsData from '@/play/data/skills'

import Render from '@/play/render/render'

import Util from '@/play/game/util'

import Movable from '@/play/game/entity/unit/movable'
import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const waitToRespawn = 2000
const expPerLevel = 1200
const maxLevel = 30

//CLASS

class Ship extends Movable {

  constructor (name, player, team, x, y, angle, isLocal) {
    const statBase = shipStats[name]
    super(team, statBase, 2, x, y, angle, isLocal)

    this.skills = {
      data: skillsData[name],
      started: [0, 0, 0],
      actives: [0, 0, 0],
      cooldowns: [0, 0, 0],
      levels: [0, 0, 0],
      leveled: 0,
    }
    this.tween = statBase.tween || null
    this.statBase = statBase
    this.id = player.id
    this.player = player
    this.name = name
    this.split = statBase.split
    this.reemergeAt = store.state.game.renderTime
    this.uncontrollable = false
    this.queueTarget = null
    this.queueSkill = null

    this.level = 1
    this.levelExp = 0
    this.expPerLevel = expPerLevel
    this.respawned = false
    this.isBlocking = true
    this.exactDestination = false
    this.selected = false
    this.requiresSightOfTarget = false
    this.reflectDamage = null
    this.targetingSkill = null

    const scores = { pid: player.id, level: this.level, kills: 0, deaths: 0, damage: 0 }
    store.state.game.ships.push(scores)
    this.displayStats = scores

    // Unit

    if (this.isLocal) {
      this.setSelection(0xffff00)
    }

    statBase.create(name, team, this.top, this.base, this)

    const displayName = player.name
    const displayTextSize = displayName.length < 4 ? 10 : 10 - (displayName.length - 4) / 4
    Render.text(displayName, -this.hpWidth / 2, this.hpHeight + 1, {
      size: displayTextSize,
      color: 0xaaaaaa,
      parent: this.infoContainer,
    })
    this.renderLevelText()
  }

  allyNotLocal () {
    return !this.isLocal && super.localAlly
  }

  // Ability indicator

  createIndicator (radius) {
    this.removeIndicator()
    this.indicator = Render.ring(radius - 1, 2, { color: 0xffffff, opacity: 0.5, parent: this.floor, segments: 64 })
  }

  removeIndicator () {
    if (this.indicator) {
      Render.remove(this.indicator)
      this.indicator = null
      Local.game.map.aoeRadiusIndicator(null)
    }
  }

  // Move

  canInput () {
    return !this.uncontrollable && !this.isDying
  }

  checkQueuedSkill (renderTime) {
    const targetSkill = this.targetingSkill
    if (targetSkill) {
      const unitTarget = !targetSkill.px
      const distance = unitTarget ? this.distanceTo(targetSkill.target) : this.distanceToPoint(targetSkill.px, targetSkill.py)
      if (Util.withinSquared(distance, targetSkill.range)) {
        this.performSkill(renderTime, targetSkill.index, targetSkill.target)
        if (!unitTarget) {
          this.reachedDestination(false)
        }
        this.targetingSkill = null
        return true
      }
    }
    return false
  }

  // Skills

  trySkill (renderTime, index, targetData) {
    if (targetData) {
      const skill = this.skills.data[index]
      const skillLevel = this.skills.levels[index]
      const skillRange = skill.getRange(skillLevel) * 100
      if (typeof targetData === 'string') {
        const target = this.setTargetId(targetData)
        if (target) {
          this.targetingSkill = {
            index: index,
            target: target,
            range: skillRange,
          }
          console.log('Queueing unit target skill', renderTime, this.targetingSkill)
        }
      } else {
        const destX = targetData[0]
        const destY = targetData[1]
        this.targetingSkill = {
          index: index,
          target: targetData,
          px: destX, py: destY,
          range: skillRange,
        }
        console.log('Queueing ground target skill', renderTime, this.targetingSkill)
        this.targetDestination(destX, destY)
      }
      return
    }
    this.performSkill(renderTime, index)
  }

  performSkill (renderTime, index, target) {
    if (this.isDead) {
      console.log('Skill disabled during death', renderTime, this.id, index)
      return
    }
    if (target && target.isDead) {
      console.log('Skill canceled by dead target', renderTime, this.id, index)
      return
    }
    if (renderTime < this.skills.cooldowns[index]) {
      console.log('Skill still on cooldown', renderTime, this.id, index)
      return
    }
    const skill = this.skills.data[index]
    if (skill.isDisabledBy && skill.isDisabledBy(this.skills.actives)) {
      console.log('Skill disabled by another active', this.id, index, skill.disabledBy, this.skills.actives)
      return
    }
    const instantaneous = skill.getDuration === undefined
    const skillLevel = this.skills.levels[index]

    const cooldownEndTime = renderTime + skill.getCooldown(skillLevel) * 100
    this.skills.started[index] = renderTime
    this.skills.cooldowns[index] = cooldownEndTime
    if (this.isLocal) {
      store.state.local.skills.cooldowns.splice(index, 1, cooldownEndTime)
    }
    if (!instantaneous) {
      const durationEndTime = renderTime + skill.getDuration(skillLevel) * 100
      this.skills.actives[index] = durationEndTime
      if (this.isLocal) {
        store.state.local.skills.actives.splice(index, 1, durationEndTime)
      }
    }

    skill.start(index, skillLevel, this, target)
  }

  levelup (index) {
    if (this.skills.leveled < this.level) {
      const currentLevel = this.skills.levels[index]
      if (currentLevel < 10) {
        this.skills.leveled += 1
        this.skills.levels[index] = currentLevel + 1

        if (this.isLocal) {
          store.state.local.skills.leveled = this.skills.leveled
          store.state.local.skills.levels.splice(index, 1, currentLevel + 1)
        }
      } else {
        console.error('Skill already maxed', index, currentLevel)
      }
    } else {
      console.error('levelup not ready', index, this.skills.leveled, this.level)
    }
  }

  // Health

  doRegenerate () {
    let regen = this.stats.healthRegen
    if (this.healthRegenModifier) {
      regen += this.healthRegenModifier
      if (!Number.isInteger(regen)) {
        console.error('regen', regen)
      }
    }
    this.addHealth(regen)
  }

  endSkill (index) {
    this.skills.actives[index] = 0
    this.skills.data[index].end(this)

    if (this.isLocal) {
      store.state.local.skills.actives.splice(index, 1, 0)
    }
  }

  updateSkills (renderTime) {
    for (let ai = 0; ai < 3; ai += 1) {
      let durationEnd = this.skills.actives[ai]
      if (durationEnd !== 0) {
        const skill = this.skills.data[ai]
        let endSkill = false
        if (renderTime !== null) {
          endSkill = renderTime >= durationEnd
        } else {
          endSkill = skill.endOnDeath
        }
        if (endSkill) {
          this.endSkill(ai)
        } else {
          const update = skill.update
          if (update) {
            const startTime = this.skills.started[ai]
            update(this, startTime, renderTime, durationEnd)
          }
        }
      }
    }
  }

  die (renderTime) {
    const killIndex = 1 - this.team
    const oldKills = store.state.game.stats.kills[killIndex]
    store.state.game.stats.kills.splice(killIndex, 1, oldKills + 1)
    this.updateSkills(null)
    this.opacity(0.5)
    this.respawned = false
    this.reemergeAt = renderTime + waitToRespawn * 2 + 1000 * this.level
    this.queueTarget = null
    this.queueSkill = null

    super.die(renderTime)

    if (this.player) {
      this.displayStats.deaths += 1
    }

    const killData = {
      kill: this.player.name,
      damagers: [],
      team: this.team,
      executed: false,
    }
    let lastDamager = null
    let lastDamageAt = 0
    for (let did in this.damagers) {
      const enemyDamage = this.damagers[did]
      const damagedAt = enemyDamage.at
      if (damagedAt > lastDamageAt) {
        lastDamageAt = damagedAt
        lastDamager = did
      }
      if (enemyDamage.unit.player && damagedAt > renderTime - 10 * 1000) {
        this.displayStats.deaths += 1
        enemyDamage.unit.kills += 1
        killData.damagers.push(enemyDamage.unit.player.name)
      }
    }
    if (!killData.damagers.length) {
      killData.damagers.push(lastDamager)
      killData.executed = true
    }
    store.state.chatMessages.push(killData)

    if (this.isLocal) {
      store.state.local.dead = true
      store.state.local.reemergeAt = this.reemergeAt
    }
  }

  respawn () {
    this.damagers = {}
    this.respawned = true
    this.isBlocking = false
    this.isDying = false

    const spawnAt = this.player.spawnLocation()
    this.setLocation(spawnAt[0], spawnAt[1])
  }

  reemerge () {
    this.updateHealth(this.stats.healthMax)
    this.isDead = false
    this.timeOfDeath = null
    this.isBlocking = true
    this.opacity(1.0)

    this.infoContainer.visible = true
    if (this.isLocal) {
      store.state.local.dead = false
    }
  }

  // Experience

  renderLevelText () {
    if (this.infoContainer.levelText) {
      Render.remove(this.infoContainer.levelText)
    }
    Render.text(this.level, this.hpWidth / 2, this.hpHeight, {
      size: 12,
      color: 0x666666,
      parent: this.infoContainer,
      ref: 'levelText',
    })
  }

  levelUp (over) {
    this.level += 1
    this.displayStats.level = this.level
    if (this.level >= maxLevel) {
      this.maxLevel = true
    }
    this.levelExp = over

    const healthIncrease = this.statBase.healthMax[1] * 100
    this.stats.healthMax += healthIncrease
    this.addHealth(healthIncrease)

    this.stats.healthRegen += this.statBase.healthRegen[1]
    this.stats.armor += this.statBase.armor[1]
    this.stats.sightRange += this.statBase.sightRange[1]
    this.stats.attackRange += this.statBase.attackRange[1] * 100
    this.stats.attackDamage += this.statBase.attackDamage[1] * 100
    this.stats.attackPierce += this.statBase.attackPierce[1] * 100
    this.stats.attackCooldown += this.statBase.attackCooldown[1]

    this.sightRangeCheck = Util.squared(this.stats.sightRange)
    this.attackRangeCheck = Util.squared(this.stats.attackRange)

    this.stats.moveSpeed += this.statBase.moveSpeed[1]
    this.moveConstant = new Decimal(this.stats.moveSpeed).dividedBy(2000)

    this.updateHealth()

    if (this.selected) {
      store.levelUpStats(this)
    }
    this.renderLevelText()

    if (this.isLocal) {
      store.state.local.level = this.level
    }
  }

  updateExperience () {
    if (this.maxLevel) {
      return
    }
    const increment = this.isFiring ? 3 : 2
    this.levelExp += increment
    const leveledOver = this.levelExp - this.expPerLevel
    if (leveledOver >= 0) {
      this.levelUp(leveledOver)
    }
  }

  // Aim

  setTarget (target, distance, highlight) {
    if (target) {
      if (highlight) {
        target.setSelection(0xff0000)
      }
    } else {
      if (this.moveToTarget) {
        this.targetingSkill = null
        if (this.isLocal) {
          console.warn('target canceled')
        }
      }
      this.moveToTarget = false
    }
    return super.setTarget(target, distance)
  }

  getAttackTarget (units) {
    if (this.noTargeting) {
      return null
    }
    let closest = this.attackRangeCheck
    let target = this.attackTarget
    if (target && this.moveToTarget) {
      if (this.attackableStatus(target)) {
        const dist = this.distanceTo(target)
        this.setTarget(target, dist)
        if (this.cacheAttackCheck && this.endInvisible) {
          this.endInvisible()
        }
        return target
      }
    }
    if (this.invisible) {
      return null
    }
    if (target) {
      if (this.attackableStatus(target)) {
        const dist = this.distanceTo(target)
        if (dist <= closest) {
          return this.setTarget(target, dist)
        }
      }
      target = null
    }
    for (let idx = 0; idx < units.length; idx += 1) {
      const unit = units[idx]
      if (target && unit.id == target.id) {
        continue
      }
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

  // Update

  update (renderTime, timeDelta) {
    this.updateSkills(renderTime)

    if (this.isDead) {
      if (this.timeOfDeath) {
        const deathDuration = renderTime - this.timeOfDeath
        if (deathDuration >= waitToRespawn) {
          if (!this.respawned) {
            this.respawn()
          } else if (renderTime >= this.reemergeAt) {
            if (this.blocked()) {
              //TODO warning
            } else {
              this.reemerge()
            }
          }
        }
      }
    } else {
      this.updateExperience()
      this.doRegenerate()

      super.update(renderTime, timeDelta)

      if (this.canInput()) {
        if (this.queueSkill !== null) {
          this.trySkill(renderTime, this.queueSkill, this.queueTarget)
          this.queueSkill = null
          this.queueTarget = null
        } else if (this.queueTarget !== null) {
          if (typeof this.queueTarget === 'string') {
            this.setTargetId(this.queueTarget)
          } else {
            this.targetDestination(this.queueTarget[0], this.queueTarget[1])
          }
          this.queueTarget = null
        }
        this.checkQueuedSkill(renderTime)
      }
    }
  }

  updateVisibility () {
    const units = Unit.all()
    for (let idx = 0; idx < units.length; idx += 1) {
      const sightTarget = units[idx]
      let revealUnit = sightTarget.localAlly
      if (revealUnit) {
        sightTarget.isRendering = true
      } else {
        let isInSight = !sightTarget.invisible
        if (isInSight && sightTarget.bulletCount <= 0) {
          isInSight = false
          for (let sidx = 0; sidx < units.length; sidx += 1) {
            const checkSightFromUnit = units[sidx]
            if (checkSightFromUnit.localAlly && checkSightFromUnit.hasSightOf(sightTarget)) {
              isInSight = true
              break
            }
          }
        }
        sightTarget.visibleForFrame = isInSight
        const updatedVisibility = sightTarget.isRendering !== isInSight
        if (updatedVisibility) {
          sightTarget.isRendering = isInSight
          if (!sightTarget.renderInBackground) {
            sightTarget.container.visible = isInSight
          }
        }
        revealUnit = isInSight && (updatedVisibility || sightTarget.isMoving)
      }
      if (revealUnit && sightTarget.movable) {
        sightTarget.updatePosition()
      }
    }
  }

}

export default Ship
