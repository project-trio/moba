<template>
<div class="lobby scrolls">
	<div class="content">
		<h1 class="m-header">Moba Lobby</h1>
		<h2 class="m-header">Hello {{ username }}!</h2>
		<h3 class="m-header">{{ playersOnline }} online</h3>
		<router-link :to="{ name: 'Queue' }" tag="button" class="big interactive  my-2">Enter queue</router-link>
		<router-link :to="{ name: 'Create' }" tag="button" class="big interactive outlined">{{ isAdmin ? 'Create game' : 'Training bots' }}</router-link>
		<div>
			<router-link v-for="game in games" :key="game.id" :to="{ name: 'Join', params: { gid: game.id } }" tag="div" class="list-game interactive  m-2 p-4">
				<div>{{ game.mode }} game - {{ game.state }}</div>
				<div>{{ game.players.length }} of {{ game.size * 2 }} players</div>
				<div>{{ game.map }} map</div>
			</router-link>
		</div>
	</div>
</div>
</template>

<script>
import store from '@/app/store'

import { pluralize } from '@/helpers/util'

import LobbyEvents from '@/play/events/lobby'

export default {
	computed: {
		username () {
			return store.state.signin.user && store.state.signin.user.name
		},

		isAdmin () {
			return store.state.signin.user && store.state.signin.user.admin
		},

		playersOnline () {
			return pluralize(store.state.lobby.onlineCount, 'player')
		},

		games () {
			return store.state.lobby.games
		},
	},

	mounted () {
		LobbyEvents.connect('enter', { gid: store.state.game.id }, (data) => {
			// p('joined lobby', data)
			store.state.game.id = null
			store.state.lobby.onlineCount = data.online
			store.state.lobby.games = data.games
		})
	},
}
</script>

<style lang="postcss" scoped>
.content {
	@apply mx-auto;
	max-width: 720px;
}

.list-game {
	@apply bg-gray-100;
	&:hover {
		@apply bg-gray-300;
		&:active {
			@apply bg-gray-200;
		}
	}
}
</style>
