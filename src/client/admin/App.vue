<template>
<div id="app" class="">
	<h1>{{ players.length }} online</h1>
	<div>{{ players.join(', ') }}</div>
	<h1>{{ games.length }} games</h1>
	<div v-for="game in games" :key="game.id" class="mb-2">
		<div>Mode: {{ game.mode }}</div>
		<div>Status: {{ game.state }}</div>
		<div>Size: {{ game.size }}</div>
		<div>Update: {{ game.update }}</div>
		Players:
		<div v-for="player in game.players" :key="player.name">
			{{ player.team }} {{ player.name }} {{ player.shipName }}
		</div>
	</div>
</div>
</template>

<script>
import Bridge from '@/client/play/events/bridge'

export default {
	data () {
		return {
			games: [],
			players: [],
		}
	},

	mounted () {
		Bridge.init()
		Bridge.on('auth', () => {
			Bridge.emit('admin', 'get', (response) => {
				this.games = response.games
				p(response.games)
				this.players = response.names
			})
		})
	},
}
</script>

<style lang="postcss">
@import '../assets/styles/tailwind.postcss';

html, body {
	@apply wh-full;
}

body {
	background-color: #fffffe;
}

#app {
	@apply text-center antialiased;
	color: #111110;
}
</style>
