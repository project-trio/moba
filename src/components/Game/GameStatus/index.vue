<template>
<div class="game-status scrollable">
	<TutorialPanel v-if="tutorial && tutorial.title" :tutorial="tutorial" class="panel" />
	<div v-else-if="gameOver">
		<div class="bar-section panel">
			<h1 :class="`team-${winningTeam + 1}`">{{ victory ? 'Victory!' : 'Defeat' }}</h1>
			<button class="panel-button interactive" @click="onReturnToLobby">Leave</button>
		</div>
		<PlayerScores />
	</div>
	<PlayerScores v-else-if="playing && pressingTab" />
	<HelpPanel v-else-if="showPanel === 'help'" />
	<SettingsPanel v-else-if="showPanel === 'settings'" />
	<div v-else-if="missingUpdate" class="bar-section panel">
		<h1>waiting for server connection</h1>
	</div>
	<div v-else-if="playing">
		<h1 v-if="reemergeIn !== null">respawn in {{ reemergeIn }}</h1>
	</div>
</div>
</template>

<script>
import router from '@/router'
import store from '@/store'

import HelpPanel from '@/components/Game/GameStatus/HelpPanel'
import PlayerScores from '@/components/Game/GameStatus/PlayerScores'
import SettingsPanel from '@/components/Game/GameStatus/SettingsPanel'
import TutorialPanel from '@/components/Game/GameStatus/Tutorial'

import Local from '@/play/local'

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

<style lang="postcss" scoped>
.game-status {
	@apply absolute top-0 left-0 right-0 mx-auto pointer-events-none  flex items-center justify-center;
	bottom: 64px;
	color: #fffffe;
	text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}

.panel {
	@apply p-4 w-128 max-w-full;
}

th, td {
	@apply bg-gray-800 font-semibold;
}
</style>
