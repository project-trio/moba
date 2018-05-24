<template>
<div class="game-status scrollable">
	<help-panel v-if="showPanel === 'help'"></help-panel>
	<settings-panel v-else-if="showPanel === 'settings'"></settings-panel>
	<div v-else-if="gameOver">
		<div class="bar-section panel">
			<h1>game over</h1>
			<h2 :class="`team-${winningTeam + 1}`">team {{ winningTeamColor }} won!</h2>
			<button @click="onReturnToLobby" class="panel-button interactive">leave</button>
		</div>
		<player-scores></player-scores>
	</div>
	<player-scores v-else-if="pressingTab"></player-scores>
	<div v-else-if="missingUpdate" class="bar-section panel">
		<h1>waiting for server connection</h1>
	</div>
	<div v-else-if="playing">
		<h1 v-if="reemergeIn !== null">respawn in {{ reemergeIn }}</h1>
	</div>
</div>
</template>

<script>
import router from '@/client/router'
import store from '@/client/store'

import HelpPanel from '@/client/components/Game/GameStatus/HelpPanel'
import PlayerScores from '@/client/components/Game/GameStatus/PlayerScores'
import SettingsPanel from '@/client/components/Game/GameStatus/SettingsPanel'

const KEY_TAB = 9
const KEY_ESCAPE = 27

export default {
	components: {
		HelpPanel,
		PlayerScores,
		SettingsPanel,
	},

	data () {
		return {
			pressingTab: false,
		}
	},

	computed: {
		showPanel () {
			return store.state.game.showPanel
		},
		missingUpdate () {
			return store.state.game.missingUpdate
		},
		playing () {
			return store.state.game.playing
		},

		gameOver () {
			return this.winningTeam !== null
		},
		winningTeam () {
			return store.state.game.winningTeam
		},
		winningTeamColor () {
			return this.winningTeam === 0 ? 'blue' : 'pink'
		},

		currentPress () {
			const pressing = store.state.key.lastPress
			const code = pressing.code
			const released = pressing.released
			return code !== undefined && released !== undefined && pressing
		},
		pressed () {
			return store.state.key.pressed
		},

		renderTime () {
			return store.state.game.renderTime
		},

		reemergeIn () {
			if (store.state.local.reemergeAt) {
				const diff = store.state.local.reemergeAt - this.renderTime
				if (diff >= 0) {
					return Math.round(diff / 1000)
				}
			}
			return null
		},
	},

	watch: {
		currentPress (key) {
			this.pressingTab = key.code === KEY_TAB
		},

		pressed (key) {
			if (key.code === KEY_ESCAPE) {
				store.state.game.showPanel = null
			}
		},
	},

	methods: {
		onReturnToLobby () {
			router.replace({ name: 'Lobby' })
		},
	},
}
</script>

<style lang="stylus" scoped>
.game-status
	display flex
	align-items center
	justify-content center
	position absolute
	top 0
	left 0
	right 0
	bottom 0
	margin auto
	padding-top 34px
	color #fffffe
	text-shadow -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000
	pointer-events none

button
	pointer-events auto
	height 44px
	width 256px

.panel
	padding 16px
	width 480px
	max-width 100%

.player-scores
	width 100%
	text-shadow none

th, td
	background #333
	font-weight 500
</style>
