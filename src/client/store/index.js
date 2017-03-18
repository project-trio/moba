export default {
  state: {
    skillsLeveled: 0,
    selectedStats: {
      name: null,
      level: 0,
      levelProgress: 0,
      health: 0,
      healthMax: 0,
      dps: 0,
      range: 0,
      moveSpeed: 0,
    },
    level: 0,
    shipName: null,
    selectedUnit: null,
  },

  setSelectedUnit (unit) {
    this.state.selectedStats.name = unit.name
    unit.selected = true
    this.levelUpStats(unit)
  },
  levelUpStats (unit) {
    const stats = this.state.selectedStats
    stats.level = unit.level
    stats.healthMax = unit.stats.healthMax / 1000
    stats.dps = unit.stats.attackDamage / 1000 * (10 / unit.stats.attackCooldown)
    stats.range = unit.stats.attackRange / 100
    stats.moveSpeed = unit.stats.moveSpeed
    this.everyUpdateStats(unit)
  },
  everyUpdateStats (unit) {
    const stats = this.state.selectedStats
    stats.levelProgress = Math.round(unit.levelExp * 100 / unit.expPerLevel)
    stats.health = Math.ceil(unit.healthRemaining / 1000)
  },

  levelSkill () {
    this.state.skillsLeveled += 1
  },

  setShipName (name) {
    this.state.shipName = name
  },
}
