import storage from '@/helpers/storage'

import render from '@/play/render/render'

let selectedUnit = null

export default {
  state: {
    signin: {
      username: storage.get('username'),
      loading: false,
    },

    settings: {
      quality: storage.getInt('quality', 1),
    },

    game: {
      list: [],
      playersOnline: 0,
      players: null,
      running: false,
      stats: {
        kills: [0, 0],
        towers: [0, 0],
      },
      renderTime: 0,
      ships: {},
    },

    chatMessages: [],

    skills: {
      leveled: 0,
      levels: [0, 0, 0],
      cooldowns: [0, 0, 0],
      actives: [0, 0, 0],

      activeSkill: null,
      getGroundTarget: false,
      groundTarget: null,
      activateGround: null,
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
    dead: false,
    level: 1,
    selectedUnit: null,

    key: {
      lastPress: null,
      count: 0,
      modifier: false,
      pressed: {},
    },
  },

  // Signin

  setName (name) {
    this.state.signin.username = name
    storage.set('username', name)
  },

  // Settings

  toggleQualitySetting () {
    const newQuality = 1 - this.state.settings.quality
    this.state.settings.quality = newQuality
    render.createRenderer()
    storage.set('quality', newQuality)
  },

  // Game

  setSelectedUnit (unit) {
    if (unit === selectedUnit) {
      return
    }
    if (selectedUnit) {
      selectedUnit.selected = false
      if (selectedUnit.allyNotLocal()) {
        selectedUnit.setSelection(null)
      }
    }
    selectedUnit = unit
    if (unit.allyNotLocal()) {
      unit.setSelection(0xffffff)
    }
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
    stats.pierce = unit.stats.attackPierce
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

  // Hotkeys

  setKeyDown (key, code, modified) {
    const keyState = this.state.key
    if (!keyState.lastPress || keyState.lastPress.code !== code) {
      keyState.lastPress = { name: key, code: code, modified: modified }
      keyState.count += 1
    }
    keyState.modifier = modified
  },
  setKeyUp (key, code, modified) {
    const keyState = this.state.key
    keyState.count -= 1
    if (keyState.count <= 0) {
      keyState.count = 0
      keyState.pressed = {
        name: keyState.lastPress,
        at: performance.now(),
        modifier: modified,
        code: code,
      }
      keyState.lastPress = null
    } else if (key === keyState.lastPress) {
      keyState.lastPress = null
    }
  },
}
