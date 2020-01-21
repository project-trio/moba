<template>
<div class="score-bar  top-0 text-lg font-semibold">
	<div v-show="showScores" class="px-5">
		<span class="towers team-1">{{ towers[0] }}</span>&nbsp;<span class="tower-symbol">♜</span>
		<span class="mx-4 text-5xl leading-normal">
			<span class="kills team-1">{{ kills[0] }}</span>
			⚔️
			<span class="kills team-2">{{ kills[1] }}</span>
		</span>
		<span class="tower-symbol">♜</span><span class="towers team-2"> {{ towers[1] }}</span>
		<div>
			{{ displayTime }}
		</div>
	</div>
</div>
</template>

<script>
import store from '@/app/store'

export default {
	computed: {
		showScores () {
			return store.state.game.playing || store.state.game.winningTeam !== null
		},

		kills () {
			return store.state.game.stats.kills
		},

		towers () {
			return store.state.game.stats.towers
		},

		secondsElapsed () {
			return Math.round(store.state.game.renderTime / 1000)
		},

		displayTime () {
			let seconds = this.secondsElapsed
			let minutes
			if (seconds >= 60) {
				minutes = Math.floor(seconds / 60)
				seconds %= 60
				if (minutes < 10) {
					minutes = `0${minutes}`
				}
			} else {
				minutes = '00'
			}
			if (seconds < 10) {
				seconds = `0${seconds}`
			}
			return `${minutes}:${seconds}`
		},
	},
}
</script>

<style lang="postcss" scoped>
.score-bar {
	text-shadow: 0 1px 1px #444;
}

.towers {
	@apply text-2xl;
}

.tower-symbol {
	@apply text-gray-200 text-3xl;
}
</style>
