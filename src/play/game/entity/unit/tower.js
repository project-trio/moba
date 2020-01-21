import * as THREE from 'three'

import store from '@/app/store'

import { AXIS_Z } from '@/play/data/constants'
import towersData from '@/play/data/towers'
import retroTowersData from '@/play/data/towers-retro'

import Local from '@/play/local'

import Render from '@/play/render/render'
import RenderSound from '@/play/render/sound'

import Unit from '@/play/game/entity/unit/unit'

//AUDIO

const audioLoader = new THREE.AudioLoader()
let attackAllyBuffer, attackEnemyBuffer
audioLoader.load(require('@/play/assets/sounds/switch1.wav'), (buffer) => {
	attackAllyBuffer = buffer
})
audioLoader.load(require('@/play/assets/sounds/switch2.wav'), (buffer) => {
	attackEnemyBuffer = buffer
})

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

		this.audio = RenderSound.positional(this.floor)
	}

	// Aim

	getAttackTarget (units) {
		const minChange = 1000
		let closest = this.attackRangeCheck
		let target = this.attackTarget
		let updateTarget = true
		if (target) {
			if (target.targetable() && this.distanceTo(target) < closest) {
				closest = this.targetedAt - minChange
				updateTarget = false
			} else {
				target = null
			}
		}
		const team = this.team, px = this.px, py = this.py
		for (const unit of units) {
			if (unit !== target && unit.movable && team !== unit.team && unit.targetable()) {
				const dist = unit.distanceToPoint(px, py)
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

	attack (enemy, renderTime) {
		super.attack(enemy, renderTime, this.localAlly ? attackAllyBuffer : attackEnemyBuffer)
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
			axis: AXIS_Z,
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
