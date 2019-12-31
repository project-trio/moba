<template>
<div class="lobby-join inherit scrolls">
	<div v-if="size === null">
		<h1>Loading...</h1>
	</div>
	<div v-else>
		<h1>{{ size }} v {{ size }}</h1>
		<h2>{{ map }} map</h2>
		<div class="player-teams scrolls">
			<div class="team-players team-1">
				<h3 class="vertical">Team Blue</h3>
				<PlayerBox v-for="(player, index) in teamPlayers[0]" :key="player ? player.id : index" :player="player" />
			</div>
			<div class="team-players team-2">
				<h3 class="vertical">Team Pink</h3>
				<PlayerBox v-for="(player, index) in teamPlayers[1]" :key="player ? player.id : index" :player="player" />
			</div>
		</div>
		<div class="invite-link faint note">
			Invite a friend: <a :href="url" onclick="return false">{{ url }}</a>
		</div>
		<button v-if="isHost" class="big interactive" @click="onStart">{{ startText }}</button>
		<LobbyChat />
	</div>
</div>
</template>

<script>
import router from '@/client/router'
import store from '@/client/store'

import Game from '@/client/play/game/entity/game/game'

import Bridge from '@/client/play/events/bridge'
import LobbyEvents from '@/client/play/events/lobby'

import Local from '@/client/play/local'

import LobbyChat from '@/client/components/Lobby/Chat'
import PlayerBox from '@/client/components/Lobby/Join/PlayerBox'

export default {
	components: {
		LobbyChat,
		PlayerBox,
	},

	props: {
		gid: String,
	},

	data () {
		return {
			map: null,
			size: null,
		}
	},

	computed: {
		gameSize () {
			return `${this.size} v ${this.size}`
		},

		playerCount () {
			return this.players.length
		},

		players () {
			return store.state.game.players
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
			return store.state.playerId === store.state.game.host
		},
		startText () {
			return this.readyToStart ? 'start!' : 'waiting...'
		},
		readyToStart () {
			return store.state.game.ready
		},
	},

	created () {
		Local.gid = this.gid
		LobbyEvents.connect('join', { gid: this.gid }, (data) => {
			if (data.error) {
				warn(`Join error: ${data.error}`)
				router.replace({ name: 'Lobby' })
			} else {
				this.size = data.size
				this.map = data.map
				// p('join', data)
				const newGame = new Game(data.gid, data.mode, data.size)
				newGame.updatePlayers(data)
				Local.game = newGame
			}
		})
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

<style lang="stylus" scoped>
.lobby-join
	padding-bottom 64px
	box-sizing border-box

.vertical
	display none

.player-teams
	display flex
	flex-direction column
	width 100%
	overflow-x auto
	height 360px
	justify-content space-between

.team-players
	padding 8px
	display flex
	flex-direction row

.invite-link
	margin 32px 8px

@media (max-width: 768px)
	.vertical
		display block

	.player-teams
		flex-direction row
		height auto
	.team-players
		flex-direction column
		flex-basis 50%
</style>
