import store from '@/client/store'

import towersData from '@/client/play/data/towers'
import retroTowersData from '@/client/play/data/towers-retro'

import Local from '@/client/play/local'

import Render from '@/client/play/render/render'

import Unit from '@/client/play/game/entity/unit/unit'

//CLASS

let spawnCount, extraHealth

class Tower extends Unit {

	constructor (team, towerType, x, y, retro) {
		const stats = (retro ? retroTowersData : towersData)[towerType]
		const isBase = towerType === 'base'
		super(team, stats, isBase ? 4 : 3, x, y, null, false, true)

		this.tower = true
		this.name = towerType
		this.id = `tower${spawnCount}`
		spawnCount += 1
		this.targetedAt = null

		const size = isBase ? 2.5 : 2
		Render.voxel(team, 'npcs', 'turret-base', { size, receiveShadow: true, parent: this.base, owner: this })
		Render.voxel(team, 'npcs', 'turret-top', { size, parent: this.top, owner: this })

		this.stats.healthMax += extraHealth
		this.healthRemaining = this.stats.healthMax

		this.isBlocking = true
		this.model.position.z = stats.z
		this.height = 50 + stats.z
	}

	// Aim

	getAttackTarget (units) {
		const minChange = 1000
		let closest = this.attackRangeCheck
		let target = this.attackTarget
		let updateTarget = true
		if (target) {
			if (this.attackableStatus(target)) {
				const dist = this.distanceTo(target)
				if (dist < closest) {
					closest = this.targetedAt - minChange
					updateTarget = false
				} else {
					target = null
				}
			} else {
				target = null
			}
		}
		for (let idx = units.length - 1; idx >= 0; idx -= 1) {
			const unit = units[idx]
			if (!unit.movable || (target && unit.id === target.id)) {
				continue
			}
			if (this.attackableStatus(unit)) {
				const dist = this.distanceTo(unit)
				if (dist < closest) {
					target = unit
					closest = dist - minChange
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

	die (renderTime, isRetro) {
		const killTeamIndex = 1 - this.team
		const oldTowers = store.state.game.stats.towers[killTeamIndex]
		store.state.game.stats.towers.splice(killTeamIndex, 1, oldTowers + 1)

		Render.remove(this.infoContainer)
		Render.remove(this.top)

		this.isBlocking = false
		const fallDuration = 1500
		this.queueAnimation('model', 'position', { //TODO ease
			axis: 'z',
			to: -43,
			start: renderTime,
			duration: fallDuration,
		})
		this.queueAnimation('base', 'opacity', {
			child: 0,
			from: 1,
			to: 0.5,
			start: renderTime,
			duration: fallDuration,
		})

		super.die(renderTime, isRetro)

		if (this.name === 'base') {
			Local.game.end(killTeamIndex)
		} else {
			Local.game.killTower(killTeamIndex, isRetro)
		}

		store.state.chatMessages.push({ tower: this.name, team: this.team })
	}

}

Tower.init = function (playerCount) {
	spawnCount = 0
	extraHealth = Math.min(1000, Math.pow(Math.floor(playerCount / 2), 2) * 50) * 100
}

export default Tower
