export default {
  state: {
    renderTime: 0,

    skills: {
      leveled: 0,
      levels: [0, 0, 0],
      cooldowns: [0, 0, 0],
      actives: [0, 0, 0],
    },

    selectedStats: {
      name: null,
      level: 0,
      levelProgress: 0,
      health: 0,
      healthMax: 0,
      armor: 0,
      dps: 0,
      range: 0,
      moveSpeed: 0,
    },
    level: 0,
    shipName: null,
    selectedUnit: null,

    key: {
      lastPress: null,
      count: 0,
      modifier: false,
      pressed: {},
    },
  },

  setSelectedUnit (unit) {
    this.state.selectedStats.name = unit.name
    unit.selected = true
    this.levelUpStats(unit)
    this.everyUpdateStats(unit)
  },
  levelUpStats (unit) {
    const stats = this.state.selectedStats
    stats.level = unit.level
    stats.healthMax = unit.stats.healthMax / 100
    stats.armor = unit.stats.armor
    stats.dps = Math.round(unit.stats.attackDamage / 100 * (10 / unit.stats.attackCooldown))
    stats.range = unit.stats.attackRange / 100
    stats.moveSpeed = unit.stats.moveSpeed
    if (unit.maxLevel) {
      stats.levelProgress = null
    }
  },
  everyUpdateStats (unit) {
    const stats = this.state.selectedStats
    if (!unit.maxLevel) {
      stats.levelProgress = Math.round(unit.levelExp * 100 / unit.expPerLevel)
    }
    stats.health = Math.ceil(unit.healthRemaining / 100)
  },

  setShipName (name) {
    this.state.shipName = name
  },

  // Hotkeys

  setKeyDown (key, modified) {
    const keyState = this.state.key
    if (keyState.lastPress !== key) {
      keyState.lastPress = key
      keyState.count += 1
    }
    keyState.modifier = modified
  },
  setKeyUp (key, modified) {
    const keyState = this.state.key
    keyState.count -= 1
    if (keyState.count <= 0) {
      keyState.count = 0
      console.log(modified, keyState.modifier)
      keyState.pressed = {
        name: keyState.lastPress,
        at: performance.now(),
        modifier: modified,
      }
      keyState.lastPress = null
    } else if (key === keyState.lastPress) {
      keyState.lastPress = null
    }
  },
}
