<template>
<div class="scrolls  wh-full pb-16">
	<div v-if="size === null">
		<h1>Loading...</h1>
	</div>
	<div v-else>
		<h1 class="m-header">{{ size }} v {{ size }}</h1>
		<h2 class="m-header">{{ map }} map</h2>
		<div class="scrolls  w-full h-80 overflow-x-auto  md-max:flex-row md-max:h-auto  flex flex-col justify-between">
			<div class="team-players team-1">
				<h3 class="vertical">Team Blue</h3>
				<PlayerBox v-for="(player, index) in teamPlayers[0]" :key="player ? player.id : index" :player="player" />
			</div>
			<div class="team-players team-2">
				<h3 class="vertical">Team Pink</h3>
				<PlayerBox v-for="(player, index) in teamPlayers[1]" :key="player ? player.id : index" :player="player" />
			</div>
		</div>
		<div class="my-8 mx-2 text-note">
			Invite a friend: <a :href="url" onclick="return false">{{ url }}</a>
		</div>
		<button v-if="isHost" class="big interactive" @click="onStart">{{ startText }}</button>
		<LobbyChat />
	</div>
</div>
</template>

<script>
import store from '@/store'

import Bridge from '@/play/events/bridge'
import LobbyEvents from '@/play/events/lobby'

import LobbyChat from '@/components/Lobby/Chat'
import PlayerBox from '@/components/Lobby/Join/PlayerBox'

export default {
	components: {
		LobbyChat,
		PlayerBox,
	},

	props: {
		gid: String,
	},

	computed: {
		map () {
			return store.state.game.map
		},

		size () {
			return store.state.game.size
		},

		players () {
			return store.state.game.players
		},
		playerCount () {
			return this.players.length
		},
		teamPlayers () {
			const results = [ [], [] ]
			for (const player of this.players) {
				results[player.team].push(player)
			}
			return results
		},

		url () {
			return window.location.href
		},

		isHost () {
			return store.state.signin.user.id === store.state.game.hostID
		},
		startText () {
			return this.readyToStart ? 'start!' : 'waiting...'
		},
		readyToStart () {
			return store.state.game.ready
		},
	},

	created () {
		store.state.game.id = this.gid
		LobbyEvents.connect('join', { gid: this.gid })
	},

	methods: {
		onStart () {
			if (!this.readyToStart) {
				return
			}
			Bridge.emit('start game', {}, (data) => {
				if (data.error) {
					const errorMessage = `Start error: ${data.error}`
					window.alert(errorMessage)
				}
			})
		},
	},
}
</script>

<style lang="postcss" scoped>
.team-players {
	@apply p-2  flex flex-row;
}

@screen md {
	.vertical {
		@apply hidden;
	}
}

@screen md-max {
	.team-players {
		@apply flex-col;
		flex-basis: 50%;
	}
}
</style>
