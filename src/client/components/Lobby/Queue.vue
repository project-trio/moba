<template>
<div class="lobby-queue inherit scrolls">
	<div class="header">
		<h1>{{ queuedPlayers }} in queue</h1>
	</div>
	<h3>minimum game size:</h3>
	<GameSizes :gameSizes="gameSizes" :selectedSize="selectedSize" :pvpMode="true" @select="selectedSize = $event" />
	<h3>vote for a map:</h3>
	<GameMaps :selectedSize="selectedSize" :selectedMap="selectedMap" @select="selectedMap = $event" />

	<div class="queue-action">
		<div v-if="enoughPlayersForGame">
			<button class="ready-button big interactive" :class="{ selected: readyRequested }" @click="onReady">{{ readyRequested ? 'ready!' : `ready? (${queueTimer - readyAt})` }}</button>
		</div>
		<div v-else>
			<h2>waiting for {{ pluralize(waitingForSize, 'player') }}...</h2>
			<p v-if="enoughWithOneMore">Reduce size to <span class="highlight">{{ enoughWithOneMore }} v {{ enoughWithOneMore }}</span> to start now!</p>
		</div>
	</div>
	<div v-if="notificationPermission !== 'granted'" class="queue-notification">
		<div v-if="notificationPermission === 'unavailable'">
			(Notifications are unavailable in your browser.)
		</div>
		<div v-else-if="notificationPermission === 'denied'">
			To be notified when a game becomes available while this page is in the background, please enable notifications for this site in your browser settings.
		</div>
		<div v-else>
			<button class="big interactive" :class="{ selected: readyRequested }" @click="onNotifications">Enable notifications!</button>
			Lets you know when a game is available while the page is in the background.
		</div>
	</div>
	<LobbyChat />
</div>
</template>

<script>
// import CommonConsts from '@/common/constants'

import store from '@/client/store'
import router from '@/client/router'

import util from '@/client/helpers/util'

import Local from '@/client/play/local'

import Bridge from '@/client/play/events/bridge'
import LobbyEvents from '@/client/play/events/lobby'

import LobbyChat from '@/client/components/Lobby/Chat'
import GameMaps from '@/client/components/Lobby/SelectionGroup/GameMaps'
import GameSizes from '@/client/components/Lobby/SelectionGroup/GameSizes'

export default {
	components: {
		GameMaps,
		GameSizes,
		LobbyChat,
	},

	data () {
		return {
			baseUrl: process.env.BASE_URL,
			queueTimer: 20,
			selectedSize: 2,
			selectedMap: null,
			readyRequested: false,
			readyAt: 0,
			readyTimer: null,
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

		gameSizes () {
			return [1, 2, 3, 4] //CommonConsts.GAME_SIZES
		},
	},

	watch: {
		enoughPlayersForGame (enough) {
			if (!enough && this.readyRequested) {
				window.alert('Another player did not respond, and has been removed from the queue.')
			}
			this.setReadyTimer(enough)
		},

		availableSizes () {
			if (!this.enoughPlayersForGame) {
				this.readyRequested = false
			}
		},

		readyRequested () {
			this.sendQueue()
		},
		selectedSize () {
			this.sendQueue()
		},
	},

	mounted () {
		Local.game = null
		this.notificationPermission = window.Notification ? Notification.permission : 'unavailable'
		LobbyEvents.connect('queue', { size: this.selectedSize, ready: false })
	},

	beforeDestroy () {
		this.setReadyTimer(false)
		LobbyEvents.connect('leave') //TODO queue
	},

	methods: {
		pluralize: util.pluralize,

		cancelTimer () {
			if (this.notification) {
				this.notification.close()
				this.notification = null
			}
			if (this.readyTimer) {
				window.clearInterval(this.readyTimer)
				this.readyTimer = null
			}
			this.hasFocusedWindow = false
		},

		checkFocus () {
			if (!this.hasFocusedWindow && document.hasFocus()) {
				this.hasFocusedWindow = true
			}
		},

		setReadyTimer (enabled) {
			this.cancelTimer()

			if (enabled) {
				this.readyAt = 0
				this.readyTimer = window.setInterval(() => {
					if (this.readyAt >= this.queueTimer) {
						this.cancelTimer()
						if (!this.readyRequested) {
							router.replace({ name: 'Lobby' })
							window.alert('Removed from the queue due to inactivity')
						}
					} else {
						this.readyAt += 1
						this.checkFocus()
						if (this.readyAt === 3 && !this.readyRequested && !this.hasFocusedWindow && this.notificationPermission === 'granted') {
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
					}
				}, 1000)
			}
		},

		onReady () {
			this.readyRequested = !this.readyRequested
		},

		sendQueue () {
			this.setReadyTimer(this.enoughPlayersForGame)
			Bridge.emit('queue', { size: this.selectedSize, map: this.selectedMap, ready: this.readyRequested })
		},

		onNotifications () {
			Notification.requestPermission((permission) => {
				this.notificationPermission = permission
			})
		},
	},
}
</script>

<style lang="stylus" scoped>
.ready-button.selected
	background-color #1ea

.header, .queue-action
	margin 48px auto

.highlight
	padding 2px 4px
	background-color #ddd
	font-weight 500
</style>
