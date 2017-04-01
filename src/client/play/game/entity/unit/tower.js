import store from '@/store'

import towersData from '@/play/data/towers'

import Local from '@/play/local'

import Render from '@/play/render/render'

import Unit from '@/play/game/entity/unit/unit'

//CLASS

let spawnCount = 0

class Tower extends Unit {

  constructor (team, towerType, x, y) {
    const stats = towersData[towerType]

    super(team, stats, towerType === 'base' ? 4 : 3, x, y, null, false, true)

    this.name = towerType
    this.id = `tower${spawnCount}`
    spawnCount += 1
    this.targetedAt = null

    Render.voxel(team, 'turret-base', { receiveShadow: true, parent: this.base, owner: this })
    Render.voxel(team, 'turret-top', { parent: this.top, owner: this })

    this.isBlocking = true

    this.container.position.z = stats.z
    this.floor.position.z = -stats.z
    this.height = 50 + stats.z
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
      if (!unit.movable || (target && unit.id === target.id)) {
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

  die (renderTime) {
    const killIndex = 1 - this.team
    const oldTowers = store.state.game.stats.towers[killIndex]
    store.state.game.stats.towers.splice(killIndex, 1, oldTowers + 1)

    Render.remove(this.infoContainer)
    Render.remove(this.top)

    this.isBlocking = false
    this.container.position.z = -44

    this.opacity(0.5)

    super.die(renderTime)

    if (this.name === 'base') {
      Local.game.end(this.team)
    }

    store.state.chatMessages.push({ tower: this.name, team: this.team })
  }

}

export default Tower
