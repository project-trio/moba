export default {
  state: {
    skillsLeveled: 0,
    level: 0,
    shipName: null,
  },

  setLevel (level) {
    this.state.level = level
  },
  levelSkill () {
    this.state.skillsLeveled += 1
  },

  setShipName (name) {
    this.state.shipName = name
  },
}
