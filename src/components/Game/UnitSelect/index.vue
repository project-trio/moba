<template>
<div class="absolute inset-0 wh-full mx-auto">
	<div class="contents  wh-full p-4">
		<div class="start-countdown">
			<h1>starting in {{ countdownTime }}s</h1>
		</div>
		<h1 v-if="tall">choose your unit</h1>
		<div class="flex justify-center flex-wrap">
			<div class="selection-half  mb-8 rounded-lg bg-gray-100">
				<canvas id="preview" class="wh-full" />
			</div>
			<div class="selection-half  flex justify-center flex-wrap" :class="`team-${localTeam + 1}`">
				<button
					v-for="name in shipNames" :key="name"
					class="unit-box interactive  wh-20 m-2 bg-gray-100 rounded" :class="{ selected: chosenUnit === name }"
					@click="onUnit(name)"
				>
					{{ name }}
				</button>
			</div>
		</div>

		<div class="player-teams scrolls  w-full overflow-x-auto  flex flex-col justify-between">
			<h1>teams</h1>
			<div class="team-players team-1">
				<div v-for="player in teamPlayers[0]" :key="player.id" :player="player" class="player-ship animated" :class="{ selected: player && player.id === localId }">{{ player && player.shipName }}</div>
			</div>
			<div class="team-players team-2">
				<div v-for="player in teamPlayers[1]" :key="player.id" :player="player" class="player-ship animated" :class="{ selected: player && player.id === localId }">{{ player && player.shipName }}</div>
			</div>
		</div>
	</div>
</div>
</template>

<script>
import store from '@/store'

import { SHIP_NAMES, RETRO_SHIP_NAMES } from '@/play/data/constants'

import Bridge from '@/play/events/bridge'
import RenderPreview from '@/play/render/preview'

export default {
	computed: {
		countdownTime () {
			return Math.round(-store.state.game.renderTime / 1000)
		},

		tall () {
			return window.innerHeight > 640
		},

		players () {
			return store.state.game.players
		},
		localId () {
			return store.state.signin.user && store.state.signin.user.id
		},
		localPlayer () {
			return store.playerForId(this.localId)
		},
		localTeam () {
			return this.localPlayer ? this.localPlayer.team : 0
		},
		chosenUnit () {
			return this.localPlayer ? this.localPlayer.shipName : ''
		},
		retro () {
			return store.state.game.retro
		},
		shipNames () {
			return this.retro ? RETRO_SHIP_NAMES : SHIP_NAMES
		},

		teamPlayers () {
			const results = [ [], [] ]
			for (const player of this.players) {
				results[player.team].push(player)
			}
			return results
		},
	},

	watch: {
		chosenUnit (name) {
			if (name) {
				RenderPreview.load(name, this.localTeam, this.retro)
			}
		},
	},

	mounted () {
		RenderPreview.create()
		if (this.chosenUnit) {
			RenderPreview.load(this.chosenUnit, this.localTeam, this.retro)
		}
	},

	destroyed () {
		RenderPreview.destroy()
	},

	methods: {
		onUnit (name) {
			Bridge.emit('switch unit', { name })
		},
	},
}
</script>

<style lang="postcss" scoped>
h1 {
	@apply text-gray-400;
}

.contents {
	background: rgba(0, 0, 0, 0.67);
	-webkit-backdrop-filter: blur(10px);
	color: #fffffe;
}

.selection-half {
	width: 300px;
	height: 300px;
}

.unit-box.selected, .player-ship.selected {
	border-width: 5px;
	border-style: solid;
	border-color: inherit;
}

.team-players {
	@apply p-2  flex flex-row justify-center;
}

.player-ship {
	@apply wh-20 text-2xl font-semibold bg-gray-100 rounded-lg  flex items-center justify-center;
	flex-basis: 80px;
}

@screen md-max {
	.player-teams {
		@apply flex-row h-auto;
	}
	.team-players {
		@apply flex-col;
		flex-basis: 50%;
	}
}
</style>
