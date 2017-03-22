import Local from '@/play/local'

import Render from '@/play/render/render'

import Unit from '@/play/game/entity/unit/unit'

//LOCAL

const TOWER_STATS = {
	// [start, levelup, max]
	base: {
		healthMax: [300, 0, 0],
		healthRegen: [0, 0, 0],
		armor: [20, 0, 0],

		sightRange: [200, 0, 0],
		attackRange: [200, 0, 0],

		attackDamage: [5, 0, 0],
		attackPierce: [10, 0, 0],
		attackCooldown: [2, 0, 0],
		attackMoveSpeed: [10, 0, 0],
		bulletSize: 6,
		bulletColor: 0x660000,

		moveSpeed: [0, 0, 0],
		collision: 35,
		z: -5,
	},

	standard: {
		healthMax: [200, 0, 0],
		healthRegen: [0, 0, 0],
		armor: [10, 0, 0],

		sightRange: [190, 0, 0],
		attackRange: [190, 0, 0],

		attackDamage: [8, 0, 0],
		attackPierce: [2, 0, 0],
		attackCooldown: [10, 0, 0],
		attackMoveSpeed: [10, 0, 0],
		bulletSize: 5,
		bulletColor: 0x660000,

		moveSpeed: [0, 0, 0],
		collision: 30,
		z: -15,
	},

	turret: {
		healthMax: [160, 0, 0],
		healthRegen: [0, 0, 0],
		armor: [0, 0, 0],

		sightRange: [180, 0, 0],
		attackRange: [180, 0, 0],

		attackDamage: [6, 0, 0],
		attackPierce: [6, 0, 0],
		attackCooldown: [10, 0, 0],
		attackMoveSpeed: [10, 0, 0],
		bulletSize: 5,
		bulletColor: 0x770000,

		moveSpeed: [0, 0, 0],
		collision: 30,
		z: -25,
	},
}

let spawnCount = 0

//CLASS

class Tower extends Unit {

	constructor (team, towerType, x, y) {
		const stats = TOWER_STATS[towerType]

		super(team, stats, towerType == 'base' ? 3 : 2, x, y)

		this.id = `tower${spawnCount}`
		spawnCount += 1
		this.towerType = towerType
		this.targetedAt = null

		Render.voxel('turret-base', {parent: this.base, owner: this})
		Render.voxel('turret-top', {parent: this.top, owner: this})

		this.renderInBackground = true
		this.isBlocking = true

		this.container.position.z = stats.z
	}

	// Aim

	getAttackTarget (units) {
		let closest = this.attackRangeCheck
		let target = this.attackTarget
		let updateTarget = true
		if (target) {
			if (this.attackableStatus(target)) {
				const dist = this.distanceTo(target)
				if (dist < closest) {
					closest = this.targetedAt
					updateTarget = false
				} else {
					target = null
				}
			} else {
				target = null
			}
		}
		for (let idx = 0; idx < units.length; idx += 1) {
			const unit = units[idx]
			if (!unit.movable || (target && unit.id == target.id)) {
				continue
			}
			if (this.attackableStatus(unit)) {
				const dist = this.distanceTo(unit)
				if (dist < closest) {
					target = unit
					closest = dist
					updateTarget = true
				}
			}
		}
		if (this.setTarget(target, closest) && updateTarget) {
			this.targetedAt = target ? closest : null
		}
		return target
	}

	// Damage

	die (time) {
		Render.remove(this.infoContainer)
		Render.remove(this.top)

		this.isBlocking = false
		this.container.position.z = -44

		this.opacity(0.5)

		super.die(time)

		if (this.towerType == 'base') {
			Local.game.end(this.team)
		}
	}

}

export default Tower
