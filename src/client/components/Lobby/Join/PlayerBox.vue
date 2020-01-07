<template>
<div class="player-box" :class="classList">
	<div v-if="player">
		<div class="player-info">
			{{ player.name }}
		</div>
		<transition-group
			name="bubbling" tag="div"
			class="player-bubbles  absolute left-0 right-0 w-full h-32 overflow-hidden  flex flex-column items-center  max-md:hidden"
		>
			<div v-for="message in cachedMessages" :key="`${message.id}${message.at}`" class="bubble" :class="teamBackgroundClass">{{ message.body }}</div>
		</transition-group>
	</div>
	<div v-else class="text-note">
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
			return store.state.chatMessages
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

	watch: {
		playerMessages (playerMessages) {
			const now = Util.seconds()
			for (let idx = this.cachedMessages.length - 1; idx >= 0; idx -= 1) {
				const message = this.cachedMessages[idx]
				if (now - message.at > 15) {
					this.cachedMessages.splice(idx, 1)
				}
			}
			for (let idx = playerMessages.length - 1; idx >= 0; idx -= 1) {
				const message = playerMessages[idx]
				if (message.id === this.player.id) {
					const key = `${message.id}${message.at}`
					if (this.cachedKeys.indexOf(key) === -1) {
						this.cachedKeys.push(key)
						this.cachedMessages.unshift(message)
					}
				}
			}
		},
	},
}
</script>

<style lang="postcss" scoped>
.player-box {
	@apply flex-grow flex-shrink-0  relative h-16 mx-2 text-gray-200 text-2xl rounded-sm  flex items-center justify-center;
	flex-basis: 144px;
	&.empty {
		@apply text-gray-100 text-lg;
	}
}

.local {
	border-width: 2px;
	& .player-info {
		@apply font-semibold;
	}
}

.top .player-bubbles {
	@apply top-0  flex-col;
	bottom: -96px;
}
.bottom .player-bubbles {
	@apply bottom-0  flex-col-reverse;
	top: -96px;
}

.bubble {
	@apply relative inline-block max-w-full mt-1 px-2 pb-px text-sm rounded-sm;
	color: #fffffe;
	word-wrap: break-word;
	min-width: 8px;
	transition-timing-function: ease;
}
.bottom .bubble {
	@apply mt-0 mb-1;
}
.top .bubble::before, .bottom .bubble::after {
	@apply absolute left-0 right-0 m-auto;
	width: 10px;
	background: inherit;
	content: '';
	height: 5px;
	z-index: -10;
}
.top .bubble::before {
	top: -5px;
}
.bottom .bubble::after {
	bottom: -5px;
}

.bubbling-enter-active, .bubbling-leave-active, .bubbling-move {
	transition: all 1s;
}
.bubbling-enter, .bubbling-leave-to {
	@apply opacity-0;
	transform: translateY(-24px);
}
.bubbling-leave-to {
	@apply absolute;
	transform: translateY(24px);
}
.bottom .bubbling-enter, .bottom .bubbling-leave-to {
	transform: translateY(24px);
}
.bottom .bubbling-leave-to {
	transform: translateY(-24px);
}
.bottom .bubble-bar {
	@apply top-0;
	bottom: -16px;
}
</style>
