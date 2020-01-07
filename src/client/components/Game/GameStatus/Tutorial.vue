<template>
<div class="bar-section  pointer-events-none">
	<h1>{{ tutorial.title }}</h1>
	<p>{{ tutorial.body }}</p>
	<button v-if="tutorial.continue" class="panel-button interactive" @click="onContinue">Continue</button>
</div>
</template>

<script>
import store from '@/client/store'

import Tutorial from '@/client/play/game/tutorial'

export default {
	props: {
		tutorial: Object,
	},

	computed: {
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

	methods: {
		onContinue () {
			Tutorial.advance()
		},
	},
}
</script>
