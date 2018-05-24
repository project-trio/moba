<template>
<div class="player-box" :class="classList">
	<div v-if="player">
		<div class="player-info">
			{{ player.name }}
		</div>
		<transition-group name="bubbling" tag="div" class="player-bubbles">
			<div v-for="message in messages" class="bubble" :class="teamBackgroundClass" :key="`${message.id}${message.at}`">{{ message.body }}</div>
		</transition-group>
	</div>
	<div v-else class="faint note">
		waiting
	</div>
</div>
</template>

<script>
import store from '@/client/store'

import Util from '@/client/helpers/util'

export default {
	props: {
		player: Object,
	},

	data () {
		return {
			cachedMessages: [],
			cachedKeys: [],
		}
	},

	computed: {
		classList () {
			return [
				!this.player ? 'empty' : null,
				this.bottom ? 'bottom' : 'top',
				this.isLocal ? 'local' : null,
				this.isLocal ? `team-${this.player.team + 1}-border` : null,
			]
		},

		playerMessages () {
			let newMessage = false
			const messages = store.state.chatMessages
			for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
				const message = messages[idx]
				if (message.id === this.player.id) {
					const key = `${message.id}${message.at}`
					if (this.cachedKeys.indexOf(key) === -1) {
						this.cachedKeys.push(key)
						this.cachedMessages.unshift(message)
						newMessage = true
					}
				}
			}
			return newMessage
		},
		messages () {
			if (!this.playerMessages) {
				return this.cachedMessages
			}
			const now = Util.seconds()
			for (let idx = this.cachedMessages.length - 1; idx >= 0; idx -= 1) {
				const message = this.cachedMessages[idx]
				if (now - message.at > 15) {
					this.cachedMessages.splice(idx, 1)
				}
			}
			return this.cachedMessages
		},

		isLocal () {
			return this.player && this.player.id === store.state.playerId
		},

		bottom () {
			return this.player && this.player.team === 1
		},

		teamBackgroundClass () {
			return `team-${this.player.team + 1}-bg`
		},
	},
}
</script>

<style lang="stylus" scoped>
.player-box
	position relative
	font-size 1.5em
	background #ddd
	height 64px
	flex-basis 144px
	margin 0 8px
	flex-grow 1
	flex-shrink 0
	border-radius 1px
	box-sizing border box

	display flex
	align-items center
	justify-content center

.local
	border-width 2px
	box-sizing border-box
.local .player-info
	font-weight 500

.player-box.empty
	background #eee
	font-size 1.1em

.player-bubbles
	position absolute
	left 0
	right 0
	bottom -96px
	width 100%
	height 96px
	overflow hidden
	display flex
	flex-direction column
	align-items center

.bottom .player-bubbles
	bottom 0
	top -96px
	flex-direction column-reverse

.bubble
	color #fffffe
	font-size 16px
	word-wrap break-word
	margin-top 4px
	display inline-block
	padding 0 8px
	padding-bottom 1px
	min-width 8px
	max-width 100%
	border-radius 2px
	transition-timing-function ease
	position relative

.bottom .bubble
	margin-top 0
	margin-bottom 4px
.top .bubble::before, .bottom .bubble::after
	width 10px
	background inherit
	content ''
	height 5px
	position absolute
	left 0
	right 0
	margin auto
	z-index -10
.top .bubble::before
	top -5px
.bottom .bubble::after
	bottom -5px

.bubbling-enter-active, .bubbling-leave-active, .bubbling-move
	transition all 1s
.bubbling-enter, .bubbling-leave-to
	opacity 0
	transform translateY(-24px)
.bubbling-leave-to
	transform translateY(24px)
	position absolute
.bottom .bubbling-enter, .bottom .bubbling-leave-to
	transform translateY(24px)
.bottom .bubbling-leave-to
	transform translateY(-24px)

.bottom .bubble-bar
	top 0
	bottom -16px

@media (max-width: 768px)
	.player-bubbles
		display none
</style>
