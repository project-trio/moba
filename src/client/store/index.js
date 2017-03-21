export default {
  state: {
    skills: {
      leveled: 0,
      levels: [0, 0, 0],
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

  levelSkill () {
    this.state.skillsLeveled += 1
  },

  setShipName (name) {
    this.state.shipName = name
  },

  // Hotkeys

  setKeyDown (key) {
    const keyState = this.state.key
    if (keyState.lastPress != key) {
      keyState.lastPress = key
      keyState.count += 1
    }
  },
  setKeyUp (key) {
    const keyState = this.state.key
    keyState.count -= 1
    if (keyState.count <= 0) {
      keyState.count = 0
      keyState.pressed = { name: keyState.lastPress, at: performance.now() }
      keyState.lastPress = null
    } else if (key === keyState.lastPress) {
      keyState.lastPress = null
    }
  },
}
