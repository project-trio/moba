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

		this.skills = CommonSkills[name]
		this.statBase = statBase
		this.id = player.id
		this.player = player
		this.name = name

		this.level = 1
		this.levelExp = 0
		this.expPerLevel = expPerLevel
		this.respawned = false
		this.isBlocking = true
		this.exactDestination = false
		this.selected = false

		// Unit

		const offset = name == 'roller' ? -19 : 0

		Render.voxel(name, {parent: this.top, z: offset})

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

	setDestination (x, y, preadjusted) {
		super.setDestination(x, y, preadjusted)

		this.moveToTarget = false
	}

	// Skills

	performSkill (index, target) {
		console.log('performSkill', index, target)
	}

	// Health

	doRegenerate () {
		this.addHealth(this.stats.healthRegen)
	}

	die (time) {
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

	getAttackTarget (units) {
		let closest = this.attackRangeCheck
		let target = this.attackTarget
		if (target) {
			if (this.attackableStatus(target)) {
				const dist = this.distanceTo(target)
				if (dist <= closest) {
					return this.setTarget(target, closest)
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
