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

    this.tower = true
    this.name = towerType
    this.id = `tower${spawnCount}`
    spawnCount += 1
    this.targetedAt = null

    Render.voxel(team, 'npcs', 'turret-base', { receiveShadow: true, parent: this.base, owner: this })
    Render.voxel(team, 'npcs', 'turret-top', { parent: this.top, owner: this })

    this.isBlocking = true

    this.container.position.z = stats.z
    this.floor.position.z = -stats.z
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

  die (renderTime) {
    const killTeamIndex = 1 - this.team
    const oldTowers = store.state.game.stats.towers[killTeamIndex]
    store.state.game.stats.towers.splice(killTeamIndex, 1, oldTowers + 1)

    Render.remove(this.infoContainer)
    Render.remove(this.top)

    this.isBlocking = false
    const fallDuration = 1000
    this.queueAnimation('container', 'position', {
      axis: 'z',
      from: 0,
      to: -45,
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

    super.die(renderTime)

    if (this.name === 'base') {
      Local.game.end(killTeamIndex)
    } else {
      Local.game.killTower(killTeamIndex)
    }

    store.state.chatMessages.push({ tower: this.name, team: this.team })
  }

}

export default Tower
