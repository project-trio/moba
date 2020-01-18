<template>
<div class="lobby-chat">
	<div ref="chatScroll" class="chat-log scrolls">
		<div v-for="(msg, index) in messages" :key="index" class="msg">
			<span :class="`msg-from team-${msg.team !== undefined ? msg.team + 1 : 0}`">{{ msg.from }}</span>
			<span class="italic text-xs"> ({{ timeSince(msg.at) }})</span>: {{ msg.body }}
		</div>
	</div>
	<div class="fixed left-0 right-0 bottom-0 w-full h-16">
		<input ref="chatInput" v-model.trim="draftMessage" class="wh-full text-2xl px-2" placeholder="press enter to chat" :disabled="disableChat">
	</div>
</div>
</template>

<script>
import store from '@/store'

import Bridge from '@/play/events/bridge'

const KEY_ENTER = 13

export default {
	data () {
		return {
			draftMessage: '',
		}
	},

	computed: {
		minuteTime () {
			return store.state.minuteTime
		},

		messages () {
			return store.state.chatMessages
		},

		disableChat () {
			return !this.pressed
		},

		pressed () {
			return store.state.key.pressed
		},
	},

	watch: {
		messages () {
			this.$nextTick(() => {
				if (this.$refs.chatScroll) {
					this.$refs.chatScroll.scrollTop = this.$refs.chatScroll.scrollHeight
				}
			})
		},

		pressed (key) {
			if (key.code === KEY_ENTER) {
				this.$nextTick(() => {
					this.$refs.chatInput.focus()
				})

				if (this.draftMessage) {
					Bridge.emit('chat', { all: true, body: this.draftMessage }, (response) => {
						if (response.error) {
							//TODO display throttle error
							p('chat err', response)
						} else {
							this.draftMessage = ''
						}
					})
				}
			}
		},
	},

	created () {
		store.state.chatMessages = []
	},

	methods: {
		timeSince (timestamp) {
			const diff = this.minuteTime - timestamp
			if (diff < 30) {
				return `just now`
			}
			let timeAmount = Math.round(diff / 60)
			let timeName
			if (timeAmount < 90) {
				timeName = 'm'
			} else {
				timeAmount = Math.round(diff / 60 / 60)
				timeName = 'h'
			}
			return `${timeAmount}${timeName} ago`
		},
	},
}
</script>

<style lang="postcss" scoped>
.chat-log {
	@apply fixed left-0 w-64 m-1 p-1 text-left z-0;
	bottom: 64px;
	max-height: 200px;
}

.msg {
	@apply my-1;
}

.msg-from {
	@apply font-semibold;
}
</style>
