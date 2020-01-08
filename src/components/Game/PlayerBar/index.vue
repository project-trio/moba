<template>
<div class="bottom-0">
	<ChatBar />
	<PlayerInfo class="bar-section section-centered  lg-max:hidden" />
	<SkillsBar class="bar-section section-centered  lg-max:bg-transparent" />
	<Minimap v-show="playing" class="bar-section  md-max:hidden" />
</div>
</template>

<script>
import store from '@/store'
import util from '@/helpers/util'

import ChatBar from '@/components/Game/PlayerBar/ChatBar'
import Minimap from '@/components/Game/PlayerBar/Minimap'
import PlayerInfo from '@/components/Game/PlayerBar/PlayerInfo'
import SkillsBar from '@/components/Game/PlayerBar/SkillsBar'

import Local from '@/play/local'

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

	computed: {
		playing () {
			return store.state.game.playing
		},
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

<style lang="postcss" scoped>
.section-centered {
	@apply mx-2 p-2 rounded-t;
}
</style>
