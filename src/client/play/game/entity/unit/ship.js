import Decimal from 'decimal.js'

import CommonSkills from 'common/skills'

import store from '@/store'

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
			levels: [0, 0, 0],
			leveled: 1,
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

		// Unit

		const offset = name == 'roller' ? -19 : 0

		Render.voxel(name, {parent: this.top, z: offset, owner: this})

		// const base = Render.sprite('ship')
		// this.base.add(base)

		Render.text(player.name, -this.hpWidth / 2, this.hpHeight, {
			size: 11,
			color: team === 1 ? 0xff1010 : 0x0090ff,
			parent: this.unitInfo,
		})
		this.renderLevelText()
	}

	// Move

	canMove () {
		return !this.isDying
	}

	shouldMove () {
		return this.isMoving// && (!this.moveToTarget || !this.attackTarget || !this.inAttackRange(this.attackTarget))
	}

	// Skills

	performSkill (renderTime, index, target) {
		const skill = this.skills.data[index]
		const skillLevel = this.skills.levels[index]
		const endTime = renderTime + skill.getDuration(skillLevel) * 100
		this.skills.actives[index] = endTime
		skill.start(index, skillLevel, this, this.endSkill)

		if (this.isLocal) {
			store.state.skills.actives.splice(index, 1, endTime)
			store.state.skills.cooldowns.splice(index, 1, renderTime + skill.getCooldown(skillLevel) * 100)
		}
	}

	levelup (index) {
		if (this.skills.leveled < this.level) {
			const currentLevel = this.skills.levels[index]
			if (currentLevel < 10) {
				this.skills.leveled += 1
				console.log('levelup', index, this.skills.leveled, currentLevel)
				this.skills.levels[index] = currentLevel + 1

				if (this.isLocal) {
					store.state.skills.leveled = this.skills.leveled
					store.state.skills.levels.splice(index, 1, currentLevel + 1)
				}
			} else {
				console.error('Skill already maxed', index, currentLevel)
			}
		} else {
			console.error('levelup not ready', index)
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
	}

	respawn () {
		this.respawned = true
		this.isBlocking = false
		this.isDying = false

		const spawnAt = this.player.spawnLocation()
		this.setLocation(spawnAt[0], spawnAt[1])
	}

	setAlive () {
		this.isDead = false
		this.timeOfDeath = null
		this.isBlocking = true

		this.opacity(1.0)
		this.infoContainer.visible = true
	}

	reemerge () {
		this.updateHealth(this.stats.healthMax)
		this.container.alpha = 1.0
		this.infoContainer.visible = true

		this.setAlive()
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
				return this.setTarget(target, dist)
			}
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

	checkAttack (renderTime) {
		if (this.invisible) {
			return
		}
		super.checkAttack(renderTime)
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
			const unit = units[idx]
			let revealUnit = this.alliedTo(unit)
			if (revealUnit) {
				unit.isRendering = true
			} else {
				const isInSight = this.canSee(unit)
				unit.visibleForFrame = isInSight
				const updatedVisibility = unit.isRendering !== isInSight
				if (updatedVisibility) {
					unit.isRendering = isInSight
					unit.container.visible = isInSight || unit.renderInBackground || false
					unit.infoContainer.visible = isInSight
				}
				revealUnit = isInSight && (updatedVisibility || unit.isMoving)
			}
			if (revealUnit && unit.movable) {
				unit.updatePosition()
			}
		}
	}

}

export default Ship
