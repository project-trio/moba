<template>
<div class="player-bar">
	<chat-bar></chat-bar>
	<player-info class="bar-section"></player-info>
	<skills-bar class="bar-section"></skills-bar>
	<minimap v-show="playing" class="bar-section"></minimap>
</div>
</template>

<script>
import store from '@/client/store'
import util from '@/client/helpers/util'

import ChatBar from '@/client/components/Game/PlayerBar/ChatBar'
import Minimap from '@/client/components/Game/PlayerBar/Minimap'
import PlayerInfo from '@/client/components/Game/PlayerBar/PlayerInfo'
import SkillsBar from '@/client/components/Game/PlayerBar/SkillsBar'

import Local from '@/client/play/local'

const KEY_SPACE = 32
const KEY_LEFT = 37
const KEY_UP = 38
const KEY_RIGHT = 39
const KEY_DOWN = 40

export default {
	components: {
		ChatBar,
		Minimap,
		PlayerInfo,
		SkillsBar,
	},

	created () {
		util.addListener(window, 'keydown', this.keydown)
		util.addListener(window, 'keyup', this.keyup)
		util.addListener(window, 'wheel', this.scroll)
	},

	destroyed () {
		util.removeListener(window, 'keydown', this.keydown)
		util.removeListener(window, 'keyup', this.keyup)
		util.removeListener(window, 'wheel', this.scroll)
	},

	computed: {
		playing () {
			return store.state.game.playing
		},
	},

	methods: {
		pressing (code, enabled) {
			if (code === KEY_SPACE) {
				store.state.trackCamera = enabled
			} else if (code === KEY_LEFT) {
				store.state.trackX = enabled ? -1 : 0
			} else if (code === KEY_RIGHT) {
				store.state.trackX = enabled ? 1 : 0
			} else if (code === KEY_UP) {
				store.state.trackY = enabled ? -1 : 0
			} else if (code === KEY_DOWN) {
				store.state.trackY = enabled ? 1 : 0
			}
		},
		keydown (event) {
			const keyCode = event.which || event.keyCode
			this.pressing(keyCode, true)
		},
		keyup (event) {
			const keyCode = event.which || event.keyCode
			this.pressing(keyCode, false)
		},

		scroll (event) {
			if (!store.state.trackCamera) {
				const game = Local.game
				if (game) {
					store.state.manualCamera = true
					const multiplier = event.deltaMode === WheelEvent.DOM_DELTA_PIXEL ? 0.75 : event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 25 : 100
					game.map.trackDelta(event.deltaX, event.deltaY, multiplier)
				}
			}
		},
	},
}
</script>

<style lang="stylus" scoped>
.player-bar
	bottom 0

.bar-section
	border-radius 4px 4px 0 0

@media (max-width: 767px)
	.minimap
		display none
@media (max-width: 1023px)
	.skills-bar
		background none
	.player-info
		display none
</style>
