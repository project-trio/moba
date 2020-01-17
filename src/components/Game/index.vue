<template>
<div class="wh-full select-none">
	<canvas id="canvas" class="wh-full" />

	<UnitSelect v-if="!playing && winningTeam === null" />

	<GameStatus />

	<SettingsButtons class="bar-section" />

	<PlayerBar class="ui-bar" />
</div>
</template>

<script>
import store from '@/store'
import util from '@/helpers/util'

import { TESTING } from '@/play/data/constants'

import Local from '@/play/local'
import Loop from '@/play/render/loop'

import GameStatus from '@/components/Game/GameStatus'
import PlayerBar from '@/components/Game/PlayerBar'
import UnitSelect from '@/components/Game/UnitSelect'
import SettingsButtons from '@/components/Game/ScoreBar/SettingsButtons'

export default {
	components: {
		GameStatus,
		PlayerBar,
		SettingsButtons,
		UnitSelect,
	},

	props: {
		gid: String,
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
