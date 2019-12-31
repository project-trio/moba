<template>
<div id="app" class="inherit">
	<h1>{{ players.length }} online</h1>
	<div>{{ players.join(', ') }}</div>
	<h1>{{ games.length }} games</h1>
	<div v-for="game in games" :key="game.id" class="game">
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

<style lang="stylus">
html
	height 100%
	width 100%

body
	margin 0
	background-color #fffffe
	width inherit
	height inherit

#app
	text-align center

#app, button
	font-family 'Avenir', Helvetica, Arial, sans-serif
	-webkit-font-smoothing antialiased
	-moz-osx-font-smoothing grayscale
	font-weight 400
	color #111110

.game
	margin-bottom 8px
</style>
