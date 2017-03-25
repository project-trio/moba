import Decimal from 'decimal.js'

import CommonSkills from 'common/skills'

import store from '@/store'

import dataConstants from '@/play/data/constants'
import shipStats from '@/play/data/ships'

import Render from '@/play/render/render'

import Util from '@/play/game/util'

import Movable from '@/play/game/entity/unit/movable'
import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const waitToRespawn = 1990
const expPerLevel = 1200
const maxLevel = 30

//CLASS

class Ship extends Movable {

	constructor (name, player, team, x, y, angle) {
		const statBase = shipStats[name]
		super(team, statBase, 2, x, y, angle)

		this.skills = {
			data: CommonSkills[name],
			actives: [0, 0, 0],
			cooldowns: [0, 0, 0],
			levels: [0, 0, 0],
			leveled: 0,
		}
		this.statBase = statBase
		this.id = player.id
		this.player = player
		this.name = name
		this.isLocal = false

		this.level = 1
		this.levelExp = 0
		this.expPerLevel = expPerLevel
		this.respawned = false
		this.isBlocking = true
		this.exactDestination = false
		this.selected = false
		this.requiresSightOfTarget = false

		// Unit

		const offset = name === 'roller' ? -19 : 0
		const teamColor = dataConstants.teamColors[team]
		Render.voxel(name, {teamColor: teamColor, parent: this.top, z: offset, owner: this})

		// const base = Render.sprite('ship')
		// this.base.add(base)

		const displayName = player.name
		const displayTextSize = displayName.length < 4 ? 10 : 10 - (displayName.length - 4) / 4
		Render.text(displayName, -this.hpWidth / 2, this.hpHeight + 1, {
			size: displayTextSize,
			color: 0xaaaaaa,
			parent: this.unitInfo,
		})
		this.renderLevelText()
	}

	// Move

	canMove () {
		return !this.isDying
	}

	shouldMove () {
		return this.isMoving
	}

	// Skills

	performSkill (renderTime, index, target) {
		if (this.isDead) {
			console.log('Skill disabled during death', this.id, index)
			return
		}
		if (renderTime < this.skills.cooldowns[index]) {
			console.log('Skill still on cooldown', this.id, index)
			return
		}
		const skill = this.skills.data[index]
		const skillLevel = this.skills.levels[index]
		const durationEndTime = renderTime + skill.getDuration(skillLevel) * 100
		const cooldownEndTime = renderTime + skill.getCooldown(skillLevel) * 100
		this.skills.actives[index] = durationEndTime
		this.skills.cooldowns[index] = cooldownEndTime
		skill.start(index, skillLevel, this, this.endSkill)

		if (this.isLocal) {
			store.state.skills.actives.splice(index, 1, durationEndTime)
			store.state.skills.cooldowns.splice(index, 1, cooldownEndTime)
		}
	}

	levelup (index) {
		if (this.skills.leveled < this.level) {
			const currentLevel = this.skills.levels[index]
			if (currentLevel < 10) {
				this.skills.leveled += 1
				console.log('levelup', index, this.skills.leveled, this.level, currentLevel)
				this.skills.levels[index] = currentLevel + 1

				if (this.isLocal) {
					store.state.skills.leveled = this.skills.leveled
					store.state.skills.levels.splice(index, 1, currentLevel + 1)
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
			regen *= this.healthRegenModifier
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
			store.state.skills.actives.splice(index, 1, 0)
		}
	}

	endSkills (renderTime) {
		for (let ai = 0; ai < 3; ai += 1) {
			let durationEnd = this.skills.actives[ai]
			if (durationEnd !== 0 && (!renderTime || renderTime >= durationEnd)) {
				this.endSkill(ai)
			}
		}
	}

	die (time) {
		this.endSkills(null)
		this.opacity(0.5)
		this.respawned = false

		super.die(time)

		if (this.isLocal) {
			store.state.dead = true
		}
	}

	respawn () {
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

		if (this.localAlly || this.isRendering) {
			this.infoContainer.visible = true
		}
		if (this.isLocal) {
			store.state.dead = false
		}
	}

	// Experience

	renderLevelText () {
		if (this.unitInfo.levelText) {
			Render.remove(this.unitInfo.levelText)
		}
		Render.text(this.level, this.hpWidth / 2, this.hpHeight, {
			size: 12,
			color: 0x666666,
			parent: this.unitInfo,
			ref: 'levelText',
		})
	}

	levelUp (over) {
		this.level += 1
		if (this.level >= maxLevel) {
			this.maxLevel = true
		}
		this.levelExp = over

		const healthIncrease = this.statBase.healthMax[1] * 1000
		this.stats.healthMax += healthIncrease
		this.addHealth(healthIncrease)

		this.stats.healthRegen += this.statBase.healthRegen[1]
		this.stats.armor += this.statBase.armor[1]
		this.stats.moveSpeed += this.statBase.moveSpeed[1]
		this.stats.sightRange += this.statBase.sightRange[1]
		this.stats.attackRange += this.statBase.attackRange[1] * 100
		this.stats.attackDamage += this.statBase.attackDamage[1] * 1000
		this.stats.attackPierce += this.statBase.attackPierce[1] * 1000
		this.stats.attackCooldown += this.statBase.attackCooldown[1]
		this.stats.attackMoveSpeed += this.statBase.attackMoveSpeed[1]

		this.sightRangeCheck = Util.squared(this.stats.sightRange)
		this.attackRangeCheck = Util.squared(this.stats.attackRange)
		this.moveConstant = new Decimal(this.stats.moveSpeed).dividedBy(2000)

		this.updateHealth()

		if (this.selected) {
			store.levelUpStats(this)
		}
		this.renderLevelText()

		if (this.isLocal) {
			store.state.level = this.level
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

	setTarget (target, distance) {
		if (!target) {
			if (this.isLocal && this.moveToTarget) {
				console.log('target canceled')
			}
			this.moveToTarget = false
		}
		return super.setTarget(target, distance)
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

	update (renderTime, timeDelta, tweening) {
		if (tweening) {
			return
		}
		this.endSkills(renderTime)

		if (this.isDead) {
			if (this.timeOfDeath) {
				const deathDuration = renderTime - this.timeOfDeath
				if (deathDuration > waitToRespawn) {
					if (!this.respawned) {
						this.respawn()
					} else if (deathDuration > waitToRespawn + 1000 * this.level) {
						if (!this.blocked()) {
							this.reemerge()
						}
					}
				}
			}
		} else {
			this.updateExperience()
			this.doRegenerate()
			if (this.selected) {
				store.everyUpdateStats(this)
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
						sightTarget.infoContainer.visible = isInSight
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
