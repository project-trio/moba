import storage from '@/client/helpers/storage'

import Local from '@/client/play/local'

import render from '@/client/play/render/render'
import RenderSound from '@/client/play/render/sound'

import Unit from '@/client/play/game/entity/unit/unit'

let selectedUnit = null

const defaultGameState = () => {
	return {
		players: [],
		host: null,
		ready: null,
		winningTeam: null,
		active: false,
		playing: false,
		missingUpdate: false,
		showPanel: null,
		retro: false,
		stats: {
			kills: [0, 0],
			towers: [0, 0],
		},
		renderTime: 0,
		ships: [],
		tutorial: null,
	}
}

const defaultLocalState = () => {
	return {
		skills: {
			leveled: 0,
			levels: [0, 0, 0],
			cooldowns: [0, 0, 0],
			internal: [0, 0, 0],
			actives: [0, 0, 0],

			active: null,
			groundTarget: null,
			unitTarget: null,
			hitsTowers: false,
			activation: null,
			toggle: null,

			getGroundTarget: false,
			getUnitTarget: false,
			withAlliance: false,
		},

		dead: false,
		reemergeAt: 0,
		level: 1,
	}
}

export default {
	state: {
		minuteTime: 0,
		playerId: null,

		windowWidth: window.innerWidth,

		signin: {
			username: storage.get('username'),
			loading: false,
		},

		manualCamera: storage.getBool('manualCamera', true),
		trackCamera: false,
		trackX: 0,
		trackY: 0,

		settings: {
			perspective: storage.getBool('perspective', true),
			fpsCap: storage.getBool('fpsCap', false),
			// antialias: storage.getBool('antialias', true),
			fullResolution: storage.getBool('fullResolution', false),
			shadows: storage.getInt('shadows', 2),
			outline: storage.getBool('outline', false),
			soundVolume: storage.getInt('soundVolume', 0),
		},

		lobby: {
			games: [],
			onlineCount: 0,
			queue: {},
		},

		chatMessages: [],

		game: defaultGameState(),

		local: defaultLocalState(),

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

	resizeWindow () {
		this.state.windowWidth = window.innerWidth
	},

	// Reset

	resetGameState () {
		selectedUnit = null
		this.cancelActiveSkill(false)
		this.state.game = defaultGameState()
		this.state.local = defaultLocalState()
	},

	// Signin

	setName (name) {
		this.state.signin.username = name
		storage.set('username', name)
	},

	// Settings

	applySetting (name, value, toggle) {
		this.state.settings[name] = value
		storage.set(name, value)
		if (toggle !== null) {
			if (name === 'outline') {
				render.toggleOutline(value)
			} else if (name === 'soundVolume') {
				RenderSound.setVolume(value)
			} else if (!toggle) {
				render.resize()
			} else {
				render.createRenderer()
			}
		}
	},

	// Game

	playerForId (id) {
		for (const player of this.state.game.players) {
			if (player.id === id) {
				return player
			}
		}
		return null
	},

	setSelectedUnit (unit) {
		if (unit === selectedUnit) {
			return
		}
		if (selectedUnit && !selectedUnit.sample) {
			selectedUnit.selected = false
			if (!selectedUnit.isLocal) {
				selectedUnit.setSelection(null)
			}
		}
		selectedUnit = unit
		if (!unit.sample && !unit.isLocal) {
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
		stats.pierce = unit.stats.attackPierce + unit.attackPierceBonus
		stats.range = unit.stats.attackRange / 100
		if (unit.maxLevel) {
			stats.levelProgress = null
		}
		this.modifierStats(unit)
	},
	everyUpdateStats (unit) {
		const stats = this.state.selectedStats
		if (!unit.maxLevel) {
			stats.levelProgress = Math.round(unit.levelExp * 100 / unit.expPerLevel)
		}
		stats.health = Math.ceil(unit.healthRemaining / 100)
	},
	modifierStats (unit) {
		const stats = this.state.selectedStats
		stats.armor = Math.round((1 - 100 / (100 + Math.max(0, unit.current.armor) / 2)) * 100)
		stats.dps = Math.round(unit.stats.attackDamage * (10 / unit.current.attackCooldown))
		stats.moveSpeed = unit.cacheMoveSpeed ? Math.round(unit.cacheMoveSpeed * 2000) + 22 : 0
	},

	// Hotkeys

	cancelActiveSkill (cancelHighlight) {
		this.state.local.skills.activation = null
		this.state.local.skills.getGroundTarget = false
		this.state.local.skills.getUnitTarget = false
		this.state.local.skills.groundTarget = null
		this.state.local.skills.active = null
		if (Local.unit) {
			Local.unit.removeIndicator()
		}
		if (cancelHighlight && this.state.local.skills.unitTarget) {
			const unitTarget = Unit.get(this.state.local.skills.unitTarget)
			if (unitTarget) {
				unitTarget.setSelection(null)
			}
		}
	},

	setKeyDown ({ ignore, code, modifier }) {
		const keyState = this.state.key
		if (!ignore && (keyState.lastPress.released || keyState.lastPress.code !== code)) {
			keyState.lastPress.code = code
			keyState.lastPress.released = false
			keyState.count += 1
		}
		if (!keyState.lastPress.released) {
			keyState.lastPress.modifier = modifier
		}
	},
	setKeyUp ({ ignore, code, modifier }) {
		if (ignore) {
			return
		}
		const keyState = this.state.key
		keyState.count -= 1
		if (keyState.count <= 0) {
			keyState.count = 0
			keyState.pressed = {
				at: performance.now(),
				modifier: modifier,
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
