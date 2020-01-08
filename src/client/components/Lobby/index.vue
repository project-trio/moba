<template>
<div class="lobby scrolls">
<div class="content">
	<h1>moba lobby</h1>
	<h2>hello {{ username }}!</h2>
	<h3>{{ playersOnline }} online</h3>
	<router-link :to="{ name: 'Queue' }" tag="button" class="big interactive  my-2">enter queue</router-link>
	<router-link :to="{ name: 'Create' }" tag="button" class="big interactive outlined">{{ isAdmin ? 'create game' : 'training bots' }}</router-link>
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
import store from '@/client/store'

import util from '@/client/helpers/util'

import Local from '@/client/play/local'

import LobbyEvents from '@/client/play/events/lobby'

export default {
	computed: {
		username () {
			return store.state.signin.user && store.state.signin.user.name
		},

		isAdmin () {
			return store.state.signin.user && store.state.signin.user.admin
		},

		playersOnline () {
			return util.pluralize(store.state.lobby.onlineCount, 'player')
		},

		games () {
			return store.state.lobby.games
		},
	},

	mounted () {
		LobbyEvents.connect('enter', { gid: Local.gid }, (data) => {
			// p('joined lobby', data)
			store.state.lobby.onlineCount = data.online
			store.state.lobby.games = data.games
			Local.gid = null
		})
	},

	beforeDestroy () {
		LobbyEvents.connect('leave')
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
