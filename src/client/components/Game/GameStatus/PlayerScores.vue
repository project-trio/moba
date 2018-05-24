<template>
<div class="bar-section panel">
	<score-bar />
	<table class="player-scores">
		<tr><th>name</th><th>level</th><th>ship</th><th>assists</th><th>deaths</th><th>damage</th></tr>
		<tr v-for="result in playerResults" :class="`team-${result.team + 1} ${result.active ? 'active' : 'inactive'}`" :key="result.name">
			<td>{{ result.name }}</td><td>{{ result.level }}</td><td>{{ result.ship }}</td><td>{{ result.kills }}</td><td>{{ result.deaths }}</td><td>{{ Math.round(result.damage / 100) }}</td>
		</tr>
	</table>
</div>
</template>

<script>
import store from '@/client/store'

import ScoreBar from '@/client/components/Game/ScoreBar'

export default {
	components: {
		ScoreBar,
	},

	computed: {
		playerResults () {
			return store.state.game.ships.map(ship => {
				const player = store.state.game.players[ship.pid]
				if (!player) {
					return ship
				}
				return {
					name: player.name,
					active: player.isActive,
					team: player.team,
					ship: player.shipName,
					level: ship.level,
					kills: ship.kills,
					deaths: ship.deaths,
					damage: ship.damage,
				}
			})
		},
	},
}
</script>

<style lang="stylus" scoped>
.player-scores
	width 100%
	text-shadow none

th, .active td
	background #222
	font-weight 500

.active td
	background #333
.inactive td
	background #555
</style>
