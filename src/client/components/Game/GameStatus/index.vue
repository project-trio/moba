<template>
<div class="game-status scrollable">
	<tutorial-panel v-if="tutorial && tutorial.title" :tutorial="tutorial" />
	<div v-else-if="gameOver">
		<div class="bar-section panel">
			<h1 :class="`team-${winningTeam + 1}`">{{ victory ? 'Victory!' : 'Defeat' }}</h1>
			<button @click="onReturnToLobby" class="panel-button interactive">leave</button>
		</div>
		<player-scores />
	</div>
	<player-scores v-else-if="playing && pressingTab" />
	<help-panel v-else-if="showPanel === 'help'" />
	<settings-panel v-else-if="showPanel === 'settings'" />
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
import TutorialPanel from '@/client/components/Game/GameStatus/Tutorial'

import Local from '@/client/play/local'

const KEY_TAB = 9
const KEY_ESCAPE = 27

export default {
	components: {
		HelpPanel,
		PlayerScores,
		SettingsPanel,
		TutorialPanel,
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
		tutorial () {
			return store.state.game.tutorial
		},

		winningTeam () {
			return store.state.game.winningTeam
		},
		gameOver () {
			return this.winningTeam !== null
		},
		victory () {
			return this.winningTeam === Local.player.team
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
	bottom 64px
	margin auto
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
