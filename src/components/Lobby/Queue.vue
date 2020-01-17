<template>
<div class="lobby-queue wh-full scrolls">
	<h1 class="m-header">{{ queuedPlayers }} in queue</h1>
	<h2 class="m-header">Minimum game size:</h2>
	<GameSizes :gameSizes="gameSizes" :selectedSize="selectedSize" :pvpMode="true" @select="selectedSize = $event" />
	<h2 class="m-header">Vote for a map:</h2>
	<GameMaps :selectedSize="selectedSize" :selectedMap="selectedMap" @select="selectedMap = $event" />

	<div class="my-6">
		<div v-if="enoughPlayersForGame">
			<button class="ready-button big interactive" :class="{ selected: didSayReady }" @click="onReady">
				Ready{{ didSayReady ? '!' : `? (${queuePendingForSize === selectedSize ? queueSecondsRemaining : '…'})` }}
			</button>
		</div>
		<div v-else>
			<h2 class="m-header">Waiting for {{ pluralize(waitingForSize, 'player') }}...</h2>
			<p v-if="enoughWithOneMore">Reduce size to <span class="bg-gray-300 font-semibold">{{ enoughWithOneMore }} v {{ enoughWithOneMore }}</span> to start now!</p>
		</div>
	</div>
	<div v-if="notificationPermission !== 'granted'" class="queue-notification">
		<p v-if="notificationPermission === 'unavailable'">
			(Notifications are unavailable in your browser.)
		</p>
		<p v-else-if="notificationPermission === 'denied'">
			To be notified when a game becomes available while this page is in the background, please enable notifications for this site in your browser settings.
		</p>
		<div v-else>
			<button class="big interactive  bg-info-500" :class="{ selected: didSayReady }" @click="onNotifications">Enable notifications!</button>
			<p>Lets you know when a game is available while the page is in the background.</p>
		</div>
	</div>
	<LobbyChat />
</div>
</template>

<script>
import store from '@/store'
import router from '@/router'

import util from '@/helpers/util'

// import { GAME_SIZES } from '@/play/data/constants'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'
import LobbyEvents from '@/play/events/lobby'

import LobbyChat from '@/components/Lobby/Chat'
import GameMaps from '@/components/Lobby/SelectionGroup/GameMaps'
import GameSizes from '@/components/Lobby/SelectionGroup/GameSizes'

let queueCountdownInterval = null

export default {
	components: {
		GameMaps,
		GameSizes,
		LobbyChat,
	},

	data () {
		return {
			baseUrl: process.env.BASE_URL,
			queueSecondsRemaining: 0,
			selectedSize: 2,
			selectedMap: null,
			didSayReady: false,
			notificationTimer: null,
			notificationPermission: null,
			hasFocusedWindow: false,
		}
	},

	computed: {
		waitingForSize () {
			return this.availableSizes[this.selectedSize - 1] || this.selectedSize * 2 - 1
		},

		enoughWithOneMore () {
			for (let size = this.selectedSize - 1; size >= 0; size -= 1) {
				if (this.availableSizes[size - 1] <= 1) {
					return size
				}
			}
			return false
		},

		enoughPlayersForGame () {
			for (let idx = this.selectedSize - 1; idx < this.availableSizes.length; idx += 1) {
				if (this.availableSizes[idx] <= 0) {
					return true
				}
			}
			return false
		},

		availableSizes () {
			return store.state.lobby.queue.available || []
		},
		queuedPlayers () {
			return store.state.lobby.queue.players || 0
		},
		queuePendingForSize () {
			return store.state.lobby.queue.popSize
		},
		queuePopAt () {
			return store.state.lobby.queue.popAt
		},

		gameSizes () {
			return [1, 2, 3, 4] //TODO GAME_SIZES
		},
	},

	watch: {
		enoughPlayersForGame (enough) {
			this.setNotificationTimer(enough)
		},

		availableSizes () {
			if (!this.enoughPlayersForGame) {
				this.didSayReady = false
			}
		},

		didSayReady () {
			this.sendQueue()
		},
		selectedSize () {
			this.sendQueue()
		},

		queuePopAt (queuePopAt) {
			this.queueSecondsRemaining = queuePopAt - util.seconds()
		},
	},

	created () {
		Bridge.on('queue expired', (data) => {
			this.cancelTimer()
			window.alert(data.error)
			if (data.backToLobby) {
				router.replace({ name: 'Lobby' })
			}
		})
	},

	mounted () {
		Local.game = null
		this.notificationPermission = window.Notification ? Notification.permission : 'unavailable'
		LobbyEvents.connect('queue', { size: this.selectedSize, ready: false })
		queueCountdownInterval = window.setInterval(() => {
			if (this.queueSecondsRemaining > 0) {
				this.queueSecondsRemaining -= 1
			}
		}, 1000)
	},

	beforeDestroy () {
		Bridge.off('queue expired')
		this.cancelTimer()
		window.clearInterval(queueCountdownInterval)
		queueCountdownInterval = null
	},

	beforeRouteLeave (to, from, next) {
		LobbyEvents.connect('leave', { gid: store.state.game.id })
		next()
	},

	methods: {
		pluralize: util.pluralize,

		cancelTimer () {
			if (this.notification) {
				this.notification.close()
				this.notification = null
			}
			if (this.notificationTimer) {
				window.clearInterval(this.notificationTimer)
				this.notificationTimer = null
			}
			this.hasFocusedWindow = false
		},

		setNotificationTimer (enabled) {
			this.cancelTimer()
			if (enabled) {
				this.notificationTimer = window.setTimeout(() => {
					if (!this.didSayReady && this.notificationPermission === 'granted' && !document.hasFocus()) {
						this.notification = new Notification('moba queue ready!', {
							icon: `${this.baseUrl}icon.png`,
						})
						this.notification.onclick = () => {
							if (window.parent) {
								parent.focus()
							}
							window.focus()
							this.notification.close()
						}
					}
				}, 3000)
			}
		},

		onReady () {
			this.didSayReady = !this.didSayReady
		},

		sendQueue () {
			this.setNotificationTimer(this.enoughPlayersForGame)
			Bridge.emit('queue', { size: this.selectedSize, map: this.selectedMap, ready: this.didSayReady })
		},

		onNotifications () {
			Notification.requestPermission((permission) => {
				this.notificationPermission = permission
			})
		},
	},
}
</script>

<style lang="postcss" scoped>
.ready-button.selected {
	background-color: #1ea;
}
</style>
