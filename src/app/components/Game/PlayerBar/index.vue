<template>
<div class="absolute left-0 right-0 bottom-0  select-none pointer-events-none  flex md-max:justify-end md:justify-center">
	<ChatBar />
	<PlayerInfo class="bar-section section-primary  lg-max:hidden" />
	<SkillsBar class="bar-section section-primary  lg-max:bg-transparent" />
	<Minimap v-show="playing" class="bar-section  md-max:hidden" />
</div>
</template>

<script>
import store from '@/app/store'
import { addListener, removeListener } from '@/helpers/util'

import ChatBar from '@/app/components/Game/PlayerBar/ChatBar'
import Minimap from '@/app/components/Game/PlayerBar/Minimap'
import PlayerInfo from '@/app/components/Game/PlayerBar/PlayerInfo'
import SkillsBar from '@/app/components/Game/PlayerBar/SkillsBar'

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
		addListener(window, 'keydown', this.keydown)
		addListener(window, 'keyup', this.keyup)
		addListener(window, 'wheel', this.scroll)
	},

	destroyed () {
		removeListener(window, 'keydown', this.keydown)
		removeListener(window, 'keyup', this.keyup)
		removeListener(window, 'wheel', this.scroll)
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
.section-primary {
	@apply mx-2 p-2 rounded-t;
}

@screen md-max {
	.section-primary {
		@apply mx-0 rounded-tl;
	}
}
</style>
