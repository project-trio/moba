import * as THREE from 'three'

import store from '@/app/store'

import { TESTING, MATH_MULTIPLY, STAT_MOVE_SPEED } from '@/play/data/constants'

import Local from '@/play/local'

import shipStats from '@/play/data/ships'
import retroShipStats from '@/play/data/ships-retro'
import skillsData from '@/play/data/skills'
import retroSkillsData from '@/play/data/skills-retro'

import Render from '@/play/render/render'
import RenderSound from '@/play/render/sound'

import { squared } from '@/play/game/util'

import Movable from '@/play/game/entity/unit/movable'
import Unit from '@/play/game/entity/unit/unit'

//AUDIO

const audioLoader = new THREE.AudioLoader()

let attackAllyBuffer, attackEnemyBuffer
audioLoader.load(require('@/play/assets/sounds/pop1.wav'), (buffer) => {
	attackAllyBuffer = buffer
})
audioLoader.load(require('@/play/assets/sounds/pop2.wav'), (buffer) => {
	attackEnemyBuffer = buffer
})

//LOCAL

const waitToRespawn = 2000
const expPerLevel = 1200
const maxLevel = 30

const EXP_PER_TICK = TESTING ? 2 : 2

//CLASS

class Ship extends Movable {

	constructor (name, player, team, x, y, angle, isLocal, retro) {
		const statBase = (retro ? retroShipStats : shipStats)[name]
		if (!statBase) {
			return console.error('No stats', name, retro)
		}
		super(team, statBase, 2, x, y, angle, isLocal)

		this.ox = x
		this.oy = y
		this.skills = {
			data: (retro ? retroSkillsData : skillsData)[name],
			started: [0, 0, 0],
			actives: [0, 0, 0],
			cooldowns: [0, 0, 0],
			levels: [0, 0, 0],
			leveled: (retro ? -2 : 0),
		}
		this.tween = statBase.tween || null
		this.onDeath = statBase.onDeath || null
		this.onRespawn = statBase.onRespawn || null
		this.onDamageDealt = statBase.onDamageDealt || null
		const statProperties = statBase.properties
		if (statProperties) {
			for (const prop in statProperties) {
				this[prop] = statProperties[prop]
			}
		}

		this.statBase = statBase
		this.id = player.id
		this.player = player
		this.name = name
		this.uncontrollable = false
		this.rebound = null

		this.level = 1
		this.levelExp = 0
		this.expPerLevel = expPerLevel
		this.exactDestination = false
		this.selected = false
		this.requiresSightOfTarget = false
		this.reflectDamage = null

		this.isDead = true
		this.timeOfDeath = -9000
		this.respawned = true
		this.isBlocking = false
		this.reemergeAt = TESTING ? 2000 : 4000 //SAMPLE
		this.modify('Spawn', STAT_MOVE_SPEED, MATH_MULTIPLY, 2)

		this.queuedForActivation = [false, false, false]
		this.queuedForTarget = null
		this.targetingSkill = null
		this.toggleSkillIndex = null
		this.toggleSkillAt = 0
		this.toggleSkillDuration = null

		const scores = { pid: player.id, level: this.level, kills: 0, deaths: 0, damage: 0 }
		store.state.game.ships.push(scores)
		this.displayStats = scores

		this.audio = RenderSound.positional(this.floor)

		// Unit

		if (this.isLocal) {
			this.setSelection(0xffff00)
		}

		statBase.create(name, team, this.top, this.base, this, Local.game.size < 10)

		const displayName = player.name
		const displayTextSize = displayName.length < 4 ? 10 : 10 - (displayName.length - 4) / 4
		Render.text(displayName, -this.hpWidth / 2, this.hpHeight + 1, {
			size: displayTextSize,
			color: 0xaaaaaa,
			parent: this.infoContainer,
		})
		this.renderLevelText()

		if (retro) {
			this.levelupSkill(0)
			this.levelupSkill(1)
			this.levelupSkill(2)
		}
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
			// if (this.isLocal) { //SAMPLE
			// 	this.playSound(attackAllyBuffer)
			// }
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
		if (this.moveToTarget) {
			super.checkUpdateTarget(renderTime)
		}
	}

	attack (enemy, renderTime) {
		super.attack(enemy, renderTime, this.localAlly ? attackAllyBuffer : attackEnemyBuffer)
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
					if (skillData.continueToDestination) {
						if (unitTarget) {
							this.moveToTarget = true
						}
					} else {
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
			return this.performSkill(renderTime, index, null)
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
		const skillRangeCheck = squared(skill.getRange(skillLevel) * 100)
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
			// p('Skill canceled by dead target', renderTime, this.id, index)
			return false
		}
		if (renderTime < this.skills.cooldowns[index]) {
			// p('Skill still on cooldown', renderTime, this.id, index)
			return false
		}
		const skill = this.skills.data[index]
		if (!skill.getCooldown) {
			p('Invalid skill', this.name, index + 1)
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
				RenderSound.activateSkill()
			}
		}
		const cooldownDuration = skill.getCooldown(skillLevel) * 100
		this.updateCooldown(index, store.state.game.retro ? renderTime : endDurationAt, cooldownDuration)

		if (skill.toggle) {
			this.toggleSkillIndex = index
			this.toggleSkillDuration = skill.toggle * 100
			if (this.isLocal) {
				store.state.local.skills.toggle = index
			}
		} else {
			skill.start(index, skillLevel, this, target, renderTime, endDurationAt, cooldownDuration, this.isLocal)
		}
		return true
	}

	levelupSkill (index) {
		if (this.skills.leveled < this.level) {
			const nextLevel = this.skills.levels[index] + 1
			if (nextLevel <= 10) {
				this.skills.leveled += 1
				this.skills.levels[index] = nextLevel
				const skillData = this.skills.data[index]
				if (skillData.levelup) {
					skillData.levelup(index, nextLevel, this)
					if (this.isLocal && this.level > 1) {
						RenderSound.activateSkill()
					}
				}

				if (this.isLocal) {
					store.state.local.skills.leveled = this.skills.leveled
					store.state.local.skills.levels.splice(index, 1, nextLevel)
				}
			} else {
				// p('Skill already maxed', index + 1, currentLevel)
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
				} else {
					// const update = skill.update
					// if (update) {
					// 	const startTime = this.skills.started[ai]
					// 	update(this, startTime, renderTime, durationEnd)
					// }
				}
			}
		}
	}

	enqueue (skill, target) {
		if (target) {
			this.targetingSkill = null
			this.queuedForTarget = [ skill, target ]
		} else {
			this.queuedForActivation[skill] = true
		}
	}

	die (renderTime, isRetro) {
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

		super.die(renderTime, isRetro)

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
		let killCreditUnit = null
		for (const did in this.damagers) {
			const enemyDamage = this.damagers[did]
			const damagedAt = enemyDamage.at
			const damageUnit = enemyDamage.unit
			if (damagedAt > lastDamageAt) {
				lastDamageAt = damagedAt
				lastDamager = did
				if (isRetro && damageUnit.player) {
					killCreditUnit = damageUnit
				}
			}
			if (damageUnit.player && damagedAt > renderTime - 10 * 1000) {
				playerAssisted = true
				if (!isRetro) {
					damageUnit.awardExperience(1000)
					damageUnit.displayStats.kills += 1
					killData.damagers.push(damageUnit.player.name)
				}
			}
		}
		if (killCreditUnit) {
			killCreditUnit.displayStats.kills += 1
			killData.damagers.push(killCreditUnit.player.name)
		}
		this.displayStats.deaths += 1
		if (playerAssisted) {
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

			RenderSound.die()
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
		this.modify('Spawn', STAT_MOVE_SPEED, MATH_MULTIPLY, 0.5)

		this.setLocation(this.ox, this.oy)

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
		this.modify('Spawn', STAT_MOVE_SPEED, null)

		this.infoContainer.visible = true
		if (this.isLocal) {
			store.state.local.dead = false
			RenderSound.respawn()
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

	addAttackDamage (value, update) {
		this.stats.attackDamage += value * 100
		if (update && this.selected) {
			store.modifierStats(this)
		}
	}

	levelUp (over) {
		this.level += 1
		this.displayStats.level = this.level
		if (this.level >= maxLevel && !store.state.game.retro) {
			this.maxLevel = true
		}
		this.levelExp = over

		const healthIncrease = this.statBase.healthMax[1] * 100
		this.stats.healthMax += healthIncrease
		this.addHealth(healthIncrease)

		this.addHealthRegen(this.statBase.healthRegen[1])
		this.stats.attackPierce += this.statBase.attackPierce[1] * 100
		this.stats.attackCooldown += this.statBase.attackCooldown[1] * 100
		this.stats.sightRange += this.statBase.sightRange[1] * 100

		const addAttackRange = this.statBase.attackRange[1]
		if (addAttackRange) {
			this.stats.attackRange += addAttackRange * 100
			this.attackRangeCheck = squared(this.stats.attackRange)
		}
		const addArmor = this.statBase.armor[1]
		if (addArmor) {
			this.stats.armor += addArmor
			this.armorCheck = Unit.calculateArmor(this.stats.armor)
		}

		const addDamage = this.statBase.attackDamage[1]
		if (addDamage) {
			this.addAttackDamage(addDamage, false)
		}

		this.stats.moveSpeed += this.statBase.moveSpeed[1]

		this.updateModifiers()

		this.updateHealth(null)

		if (this.selected) {
			store.levelUpStats(this)
		}
		this.renderLevelText()

		if (this.isLocal && over < this.expPerLevel) {
			store.state.local.level = this.level
			RenderSound.levelup()
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
				// 	p('target canceled')
				// }
			}
		}
		return super.setTarget(target, distance)
	}

	setTargetId (id) {
		const target = Unit.get(id)
		if (target && target.targetable()) {
			const dist = this.distanceTo(target)
			this.moveToTarget = true
			return this.setTarget(target, dist, this.isLocal)
		}
	}

	getAttackTarget (units) {
		let closest = this.attackRangeCheck
		let target = this.attackTarget
		if (target && this.moveToTarget && target.targetable()) {
			const dist = this.distanceTo(target)
			this.setTarget(target, dist)
			if (this.cacheAttackCheck && this.endInvisible) {
				this.endInvisible()
			}
			return target
		}
		if (this.invisible) {
			return null
		}
		if (target) {
			if (target.targetable()) {
				const dist = this.distanceTo(target)
				if (dist <= closest) {
					return this.setTarget(target, dist)
				}
			}
			target = null
		}
		const team = this.team, px = this.px, py = this.py
		for (const unit of units) {
			if (unit !== target && team !== unit.team && unit.targetable()) {
				const dist = unit.distanceToPoint(px, py)
				if (dist < closest) {
					target = unit
					closest = dist
				}
			}
		}
		return this.setTarget(target, closest)
	}

	// Update

	update (renderTime, timeDelta, isRetro) {
		this.updateSkills(renderTime)
		if (!isRetro || !this.isDead) {
			let exp = EXP_PER_TICK
			if (isRetro && this.isFiring && this.attackTarget && (this.attackTarget.player || this.attackTarget.tower)) {
				exp *= 2
			}
			this.awardExperience(exp)
		}

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
					this.performSkill(renderTime, skillIndex, null)
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
		for (const sightTarget of units) {
			let revealUnit = sightTarget.localAlly
			if (!revealUnit) {
				let isInSight = !sightTarget.invisible
				if (isInSight && (!sightTarget.attackTarget || !sightTarget.cacheAttackCheck)) {
					isInSight = false
					for (const checkSightFromUnit of units) {
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
				revealUnit = isInSight && (updatedVisibility || sightTarget.moveDestination)
			}
			if (revealUnit && sightTarget.movable && !sightTarget.customPosition) {
				sightTarget.updatePosition()
			}
		}
	}

}

export default Ship
