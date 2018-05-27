import store from '@/client/store'

import Local from '@/client/play/local'

import shipStats from '@/client/play/data/ships'
import skillsData from '@/client/play/data/skills'

import Render from '@/client/play/render/render'

import Util from '@/client/play/game/util'

import Movable from '@/client/play/game/entity/unit/movable'
import Unit from '@/client/play/game/entity/unit/unit'

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
		this.onDeath = statBase.onDeath || null
		this.onRespawn = statBase.onRespawn || null

		this.statBase = statBase
		this.id = player.id
		this.player = player
		this.name = name
		this.split = statBase.split
		this.reemergeAt = store.state.game.renderTime
		this.uncontrollable = false
		this.rebound = null

		this.level = 1
		this.levelExp = 0
		this.expPerLevel = expPerLevel
		this.respawned = false
		this.isBlocking = true
		this.exactDestination = false
		this.selected = false
		this.requiresSightOfTarget = false
		this.reflectDamage = null

		this.queuedForActivation = [false, false, false]
		this.queuedForTarget = null
		this.targetingSkill = null
		this.toggleSkillIndex = null
		this.toggleSkillAt = 0
		this.toggleSkillDuration = null

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
		return !this.isLocal && super.allyNotLocal()
	}

	// Ability indicator

	createIndicator (radius) {
		this.removeIndicator()
		this.indicator = Render.ring(radius - 1, 2, {
			color: 0xffffff,
			opacity: 0.33,
			// segments: 32,
			parent: this.floor,
		})
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
		return !this.isDying && !this.uncontrollable
	}

	move (timeDelta, tweening) {
		super.move(timeDelta, tweening)

		if (!tweening) {
			if (this.isBlocked && this.onStopped) {
				this.onStopped()
			}
		}
	}

	reachedDestination (needsNewDestination) {
		if (this.onStopped) {
			this.onStopped()
		}

		super.reachedDestination(needsNewDestination)
	}

	// Target

	checkLoseTarget () {
		if (this.attackTarget.isDying) {
			if (this.moveToTarget) {
				this.removeTarget()
				this.reachedDestination(false)
			} else {
				this.setTarget(null)
			}
		}
	}

	checkUpdateTarget (renderTime) {
		if (!this.moveToTarget) {
			return
		}
		if (this.checkQueuedSkill && this.checkQueuedSkill(renderTime)) {
			this.setTarget(null)
			this.reachedDestination(false)
		} else {
			super.checkUpdateTarget(renderTime)
		}
	}

	// Skills

	checkQueuedSkill (renderTime) {
		const targetSkill = this.targetingSkill
		if (targetSkill) {
			const unitTarget = targetSkill.px === undefined
			const skillData = this.skills.data[targetSkill.index]
			let closeEnough = skillData.startsImmediately
			if (!closeEnough) {
				const distance = unitTarget ? this.distanceTo(targetSkill.target) : this.distanceToPoint(targetSkill.px, targetSkill.py)
				closeEnough = distance <= targetSkill.rangeCheck
			}
			if (closeEnough) {
				if (this.performSkill(renderTime, targetSkill.index, targetSkill.target)) {
					if (!unitTarget && !skillData.continuesToDestination) {
						this.reachedDestination(false)
					}
					this.targetingSkill = null
					return true
				}
			}
		}
		return false
	}

	trySkill (renderTime, index, targetData) {
		if (!targetData) {
			return this.performSkill(renderTime, index)
		}
		const skill = this.skills.data[index]
		if (!skill) {
			console.error('No queued skill for index', index, this.skills.data)
			return true
		}
		if (!skill.getRange) {
			console.error('No range for queued skill', index, this.skills.data)
			return true
		}
		const skillLevel = this.skills.levels[index]
		const skillRangeCheck = Util.squared(skill.getRange(skillLevel) * 100)
		if (typeof targetData === 'string') {
			const target = this.setTargetId(targetData)
			if (target) {
				this.targetingSkill = {
					index: index,
					target: target,
					rangeCheck: skillRangeCheck,
				}
				// p('Queueing unit target skill', renderTime, this.targetingSkill)
			}
		} else {
			const destX = targetData[0]
			const destY = targetData[1]
			this.targetingSkill = {
				index: index,
				target: targetData,
				px: destX, py: destY,
				rangeCheck: skillRangeCheck,
			}
			// p('Queueing ground target skill', renderTime, this.targetingSkill)
			this.targetDestination(destX, destY)
		}
		return true
	}

	updateCooldown (index, startTime, cooldown) {
		const cooldownEndTime = startTime + cooldown
		this.skills.cooldowns[index] = cooldownEndTime
		if (this.isLocal) {
			store.state.local.skills.cooldowns.splice(index, 1, cooldownEndTime)
		}
	}

	performSkill (renderTime, index, target) {
		if (this.isDead) {
			// p('Skill disabled during death', renderTime, this.id, index)
			return false
		}
		if (target && target.isDead) {
			p('Skill canceled by dead target', renderTime, this.id, index)
			return false
		}
		if (renderTime < this.skills.cooldowns[index]) {
			// p('Skill still on cooldown', renderTime, this.id, index)
			return false
		}
		const skill = this.skills.data[index]
		if (!skill.getCooldown) {
			console.error('Invalid skill', this.name, index, skill)
			return false
		}
		if (skill.isDisabledBy && skill.isDisabledBy(this.skills.actives)) {
			// p('Skill disabled by another active', this.id, index, skill.disabledBy, this.skills.actives)
			return false
		}
		const instantaneous = skill.getDuration === undefined
		const skillLevel = this.skills.levels[index]

		this.skills.started[index] = renderTime
		let endDurationAt = renderTime
		if (!instantaneous) {
			endDurationAt += skill.getDuration(skillLevel) * 100
			this.skills.actives[index] = endDurationAt
			if (this.isLocal) {
				store.state.local.skills.actives.splice(index, 1, endDurationAt)
			}
		}
		const cooldownDuration = skill.getCooldown(skillLevel) * 100
		this.updateCooldown(index, endDurationAt, cooldownDuration)

		if (skill.toggle) {
			this.toggleSkillIndex = index
			this.toggleSkillDuration = skill.toggle * 100
			if (this.isLocal) {
				store.state.local.skills.toggle = index
			}
		} else {
			skill.start(index, skillLevel, this, target, renderTime, endDurationAt, cooldownDuration)
		}
		return true
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
				// p('Skill already maxed', index, currentLevel)
			}
		} else {
			console.error('levelup not ready', index, this.skills.leveled, this.level)
		}
	}

	// Health

	endSkill (index, renderTime) {
		this.skills.actives[index] = 0
		this.skills.data[index].end(this, this.skills.levels[index]) //TODO level when skill started

		if (this.isLocal) {
			store.state.local.skills.actives.splice(index, 1, 0)
		}
	}

	updateSkills (renderTime) {
		for (let ai = 0; ai < 3; ai += 1) {
			const durationEnd = this.skills.actives[ai]
			if (durationEnd !== 0) {
				const skill = this.skills.data[ai]
				let endSkill = false
				if (renderTime !== null) {
					endSkill = renderTime >= durationEnd
				} else {
					endSkill = skill.endOnDeath
				}
				if (endSkill) {
					this.endSkill(ai, renderTime)
				// } else {
				//   const update = skill.update
				//   if (update) {
				//     const startTime = this.skills.started[ai]
				//     update(this, startTime, renderTime, durationEnd)
				//   }
				}
			}
		}
	}

	enqueue (skill, target) {
		if (target) {
			this.targetingSkill = null
			this.queuedForTarget = [skill !== undefined ? skill : null, target]
		} else {
			this.queuedForActivation[skill] = true
		}
	}

	die (renderTime) {
		if (this.onDeath) {
			this.onDeath(renderTime)
		}
		this.updateSkills(null)

		const animDuration = 500
		this.queueAnimation(null, 'opacity', {
			from: 1,
			to: 0.5,
			start: renderTime,
			duration: animDuration,
		})
		this.reemergeAt = renderTime + waitToRespawn * 2 + 1000 * this.level
		this.queueAnimation(null, 'opacity', {
			from: 0.5,
			to: 1,
			until: this.reemergeAt,
			duration: animDuration,
		})
		this.respawned = false
		this.moveTargetAngle = null

		this.targetingSkill = null
		this.queuedForTarget = null
		this.queuedForActivation = [false, false, false]
		this.toggleSkillIndex = null
		this.toggleSkillAt = 0

		super.die(renderTime)

		this.healthRemaining = 0

		const killData = {
			kill: this.player.name,
			damagers: [],
			team: this.team,
			executed: false,
		}
		let lastDamager = null
		let lastDamageAt = 0
		let playerAssisted = false
		for (let did in this.damagers) {
			const enemyDamage = this.damagers[did]
			const damagedAt = enemyDamage.at
			if (damagedAt > lastDamageAt) {
				lastDamageAt = damagedAt
				lastDamager = did
			}
			const damageUnit = enemyDamage.unit
			if (damageUnit.player && damagedAt > renderTime - 10 * 1000) {
				playerAssisted = true
				damageUnit.displayStats.kills += 1
				damageUnit.awardExperience(1000)
				killData.damagers.push(damageUnit.player.name)
			}
		}
		if (playerAssisted) {
			this.displayStats.deaths += 1
			const killIndex = 1 - this.team
			const oldKills = store.state.game.stats.kills[killIndex]
			store.state.game.stats.kills.splice(killIndex, 1, oldKills + 1)
		}
		if (!killData.damagers.length) {
			killData.damagers.push(lastDamager)
			killData.executed = true
		}
		store.state.chatMessages.push(killData)

		if (this.isLocal) {
			store.state.local.dead = true
			store.state.local.reemergeAt = this.reemergeAt
			store.state.local.skills.toggle = null
		}
	}

	respawn (renderTime) {
		if (this.onRespawn) {
			this.onRespawn(renderTime)
		}

		this.damagers = {}
		this.respawned = true
		this.isBlocking = false
		this.isDying = false
		this.stunnedUntil = 0
		this.modify('Death', 'moveSpeed', 'times', 0.5)

		const spawnAt = this.player.spawnLocation()
		this.setLocation(spawnAt[0], spawnAt[1])

		if (this.isLocal) {
			Local.game.centerOnUnit()
		}
	}

	reemerge () {
		this.updateHealth(this.stats.healthMax)
		this.isDead = false
		this.timeOfDeath = null
		this.isBlocking = true
		this.opacity(1.0)
		this.modify('Death', 'moveSpeed', null)

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
		this.stats.attackCooldown += this.statBase.attackCooldown[1] * 100

		this.sightRangeCheck = Util.squared(this.stats.sightRange)
		this.attackRangeCheck = Util.squared(this.stats.attackRange)

		this.stats.moveSpeed += this.statBase.moveSpeed[1]

		this.updateModifiers()

		this.updateHealth()

		if (this.selected) {
			store.levelUpStats(this)
		}
		this.renderLevelText()

		if (this.isLocal) {
			store.state.local.level = this.level
		}
	}

	awardExperience (amount) {
		if (this.maxLevel) {
			return
		}
		this.levelExp += amount
		this.updateExperience()
	}

	updateExperience () {
		const leveledOver = this.levelExp - this.expPerLevel
		if (leveledOver >= 0) {
			this.levelUp(leveledOver)
		}
	}

	// Aim

	targetDestination (x, y) {
		this.moveToTarget = false
		super.targetDestination(x, y)
	}

	setTarget (target, distance, highlight) {
		if (target) {
			if (highlight) {
				target.setSelection(0xff0000)
			}
		} else {
			if (this.moveToTarget) {
				this.moveToTarget = false
				// if (this.isLocal) {
				//   p('target canceled')
				// }
			}
		}
		return super.setTarget(target, distance)
	}

	setTargetId (id) {
		const target = Unit.get(id)
		if (target && target.targetableStatus()) {
			const dist = this.distanceTo(target)
			this.moveToTarget = true
			return this.setTarget(target, dist, this.isLocal)
		}
	}

	getAttackTarget (units) {
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
		for (let idx = units.length - 1; idx >= 0; idx -= 1) {
			const unit = units[idx]
			if (target && unit.id === target.id) {
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
		this.awardExperience(2)

		if (this.isDead && this.timeOfDeath) {
			const deathDuration = renderTime - this.timeOfDeath
			if (deathDuration >= waitToRespawn) {
				if (!this.respawned) {
					this.respawn(renderTime)
				} else if (renderTime >= this.reemergeAt) {
					if (this.blocked()) {
						//TODO warning
					} else {
						this.reemerge()
					}
				}
			}
		}

		super.update(renderTime, timeDelta)

		if (this.canInput()) {
			if (this.queuedForTarget) {
				const skill = this.queuedForTarget[0]
				const target = this.queuedForTarget[1]
				if (skill !== null) {
					if (this.trySkill(renderTime, skill, target)) {
						this.queuedForTarget = null
					}
				} else {
					if (typeof target === 'string') {
						this.setTargetId(target)
					} else {
						this.targetDestination(target[0], target[1])
					}
					this.queuedForTarget = null
				}
			}
			for (let skillIndex = this.queuedForActivation.length - 1; skillIndex >= 0; skillIndex -= 1) {
				if (this.queuedForActivation[skillIndex]) {
					this.performSkill(renderTime, skillIndex)
					this.queuedForActivation[skillIndex] = false
				}
			}
			const toggleIndex = this.toggleSkillIndex
			if (toggleIndex !== null && this.toggleSkillAt + this.toggleSkillDuration < renderTime) {
				const skill = this.skills.data[toggleIndex]
				const skillLevel = this.skills.levels[toggleIndex]
				skill.activate(toggleIndex, skillLevel, this)
				this.toggleSkillAt = renderTime
			}

			this.checkQueuedSkill(renderTime)
		}
	}

	updateVisibility () {
		const units = Unit.all()
		for (let idx = units.length - 1; idx >= 0; idx -= 1) {
			const sightTarget = units[idx]
			let revealUnit = sightTarget.localAlly
			if (revealUnit) {
				sightTarget.isRendering = true
			} else {
				let isInSight = !sightTarget.invisible
				if (isInSight && (!sightTarget.attackTarget || !sightTarget.cacheAttackCheck)) {
					isInSight = false
					for (let sidx = units.length - 1; sidx >= 0; sidx -= 1) {
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
						// sightTarget.container.visible = true //SAMPLE
					}
				}
				revealUnit = isInSight && (updatedVisibility || sightTarget.hasDestination)
			}
			if (revealUnit && sightTarget.movable && !sightTarget.customPosition) {
				sightTarget.updatePosition()
			}
		}
	}

}

export default Ship
