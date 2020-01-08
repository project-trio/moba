<template>
<div class="bar-section panel">
	<ScoreBar />
	<table class="player-scores">
		<tr><th>name</th><th>level</th><th>ship</th><th>{{ retro ? 'kills' : 'assists' }}</th><th>deaths</th><th>damage</th></tr>
		<tr v-for="result in playerResults" :key="result.name" :class="`team-${result.team + 1} ${result.active ? 'active' : 'inactive'}`">
			<td>{{ result.name }}</td><td>{{ result.level }}</td><td>{{ result.ship }}</td><td>{{ result.kills }}</td><td>{{ result.deaths }}</td><td>{{ Math.round(result.damage / 100) }}</td>
		</tr>
	</table>
</div>
</template>

<script>
import store from '@/store'

import ScoreBar from '@/components/Game/ScoreBar'

export default {
	components: {
		ScoreBar,
	},

	computed: {
		retro () {
			return store.state.game.retro
		},

		playerResults () {
			const players = store.state.game.players
			const ships = store.state.game.ships
			const results = []
			for (let idx = 0; idx < players.length; idx += 1) {
				const player = players[idx]
				const ship = ships[idx]
				results[idx] = {
					name: player.name,
					active: player.isActive,
					team: player.team,
					ship: player.shipName,
					level: ship.level,
					kills: ship.kills,
					deaths: ship.deaths,
					damage: ship.damage,
				}
			}
			return results
		},
	},
}
</script>

<style lang="postcss" scoped>
.player-scores {
	@apply w-full;
	text-shadow: none;
}

th, .active td {
	@apply bg-gray-900 font-semibold;
}

.active td {
	@apply bg-gray-800;
}
.inactive td {
	@apply bg-gray-700;
}
</style>
