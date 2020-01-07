<template>
<div class="wh-full select-none">
	<canvas id="canvas" class="wh-full" />

	<UnitSelect v-if="!playing && winningTeam === null" />

	<GameStatus />

	<SettingsButtons class="bar-section" />

	<PlayerBar class="ui-bar  absolute left-0 right-0 flex justify-center select-none pointer-events-none" />
</div>
</template>

<script>
import { TESTING } from '@/common/constants'

import store from '@/client/store'
import util from '@/client/helpers/util'

import Local from '@/client/play/local'

import Loop from '@/client/play/render/loop'

import GameStatus from '@/client/components/Game/GameStatus'
import PlayerBar from '@/client/components/Game/PlayerBar'
import UnitSelect from '@/client/components/Game/UnitSelect'
import SettingsButtons from '@/client/components/Game/ScoreBar/SettingsButtons'

export default {
	components: {
		GameStatus,
		PlayerBar,
		SettingsButtons,
		UnitSelect,
	},

	computed: {
		playing () {
			return store.state.game.playing
		},

		winningTeam () {
			return store.state.game.winningTeam
		},
	},

	mounted () {
		if (!Local.game) {
			return
		}
		Local.game.start()
		Loop.start()

		window.onbeforeunload = this.confirmExit
		util.addListener(window, 'touchmove', this.cancelZoom, true)
	},

	beforeDestroy () {
		if (Local.game) {
			Local.game.destroy()
		}
		Loop.stop()

		window.onbeforeunload = null
		util.removeListener(window, 'touchmove', this.cancelZoom, true)
	},

	methods: {
		confirmExit (event) {
			if (store.state.game.active) {
				if (TESTING) {
					return
				}
				const message = 'Game in progress. You will be left afk in the game and may be unable to join a new game due to leaving. Are you sure?'
				event.returnValue = message
				return message
			}
		},

		cancelZoom (event) {
			if (event.originalEvent) {
				event = event.originalEvent
			}
			if (event.scale) {
				event.preventDefault()
			}
		},
	},
}
</script>

<style lang="postcss" scoped>
.ui-bar {
	color: #fffffe;
}
</style>
