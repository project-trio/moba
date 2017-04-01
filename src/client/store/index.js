import storage from '@/helpers/storage'

import Local from '@/play/local'

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

      players: [],
      host: null,
      ready: null,
      winningTeam: null,
      running: false,
      playing: false,
      missingUpdate: false,
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

      active: null,
      groundTarget: null,
      unitTarget: null,
      activation: null,

      getGroundTarget: false,
      getUnitTarget: false,
      withAlliance: false,
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
    reemergeAt: 0,
    level: 1,
    selectedUnit: null,

    key: {
      lastPress: {
        name: null,
        code: null,
        modifier: null,
        released: false,
      },
      count: 0,
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

  cancelActiveSkill () {
    this.state.skills.getGroundTarget = false
    this.state.skills.getUnitTarget = false
    this.state.skills.activation = null
    this.state.skills.unitTarget = null
    this.state.skills.groundTarget = null
    this.state.skills.active = null
    Local.player.unit.removeIndicator()
  },

  setKeyDown (ignore, code, modified, event) {
    const keyState = this.state.key
    if (!ignore && !event.metaKey && (keyState.lastPress.released || keyState.lastPress.code !== code)) {
      keyState.lastPress.code = code
      keyState.lastPress.released = false
      keyState.count += 1
    }
    if (!keyState.lastPress.released) {
      keyState.lastPress.modifier = modified
    }
  },
  setKeyUp (ignore, code, modified, event) {
    if (ignore) {
      return
    }
    const keyState = this.state.key
    keyState.count -= 1
    if (keyState.count <= 0) {
      keyState.count = 0
      keyState.pressed = {
        at: performance.now(),
        modifier: modified,
        code: code,
      }
      keyState.lastPress.code = null
      keyState.lastPress.released = true
    } else if (code === keyState.lastPress.code) {
      keyState.lastPress.code = null
      keyState.lastPress.released = true
    }
  },
}
