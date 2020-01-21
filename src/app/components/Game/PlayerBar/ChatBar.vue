<template>
<div class="absolute left-0 bottom-0 w-80" :class="{ active: showingInput }">
	<div ref="chatScroll" class="chat-messages scrolls italic">
			<div v-for="(msg, index) in messages" :key="index" class="w-80 my-1">
				<div v-if="msg.active !== undefined"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.name }}</span> {{ msg.active ? 'rejoined' : 'left' }} the game</div>
				<div v-else-if="msg.kill"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.kill }}</span> {{ msg.executed ? 'died to ' + (msg.damagers.indexOf('base') !== -1 ? 'the' : 'a') : 'killed by' }} <span :class="`msg-from team-${1 - msg.team + 1}`">{{ msg.damagers.join(', ') }}</span></div>
				<div v-else-if="msg.tower"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.tower }}</span> destroyed!</div>
				<div v-else class="not-italic"><span v-if="canToggleChatMode && msg.all" class="team-0">[ALL] </span><span :class="`msg-from team-${msg.team + 1}`">{{ msg.from }}</span>: {{ msg.body }}</div>
			</div>
	</div>
	<div class="relative h-8 pl-1">
		<button v-show="showingInput" :class="chatVisibilityClass" class="interactive absolute left-0 w-12 h-full z-1 pointer-events-auto" @click="toggleChatMode">
			{{ allChat ? 'ALL' : 'team' }}
		</button>
		<input ref="chatInput" v-model.trim="draftMessage" class="chat-input  wh-full pl-12 text-white pointer-events-auto opacity-0" :class="{ active: showingInput }" @focus="onFocusChat" @blur="onBlurChat">
		<div v-if="!showingInput" class="chat-placeholder  absolute left-0 bottom-0 wh-full ml-1 text-xl text-left">{{ chatPlaceholder }}</div>
	</div>
</div>
</template>

<script>
import store from '@/app/store'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'

const KEY_ENTER = 13
const KEY_ESCAPE = 27

export default {
	data () {
		return {
			showingInput: false,
			draftMessage: '',
			allChat: false,
			canToggleChatMode: false,
		}
	},

	computed: {
		messages () {
			this.scrollToBottom()
			return store.state.chatMessages
		},

		chatPlaceholder () {
			return store.state.windowWidth > 767 ? 'press enter to chat' : '💬'
		},

		pressed () {
			return store.state.key.pressed
		},

		localId () {
			return store.state.signin.user && store.state.signin.user.id
		},
		localPlayer () {
			return store.playerForId(this.localId)
		},
		localTeam () {
			return this.localPlayer ? this.localPlayer.team : 0
		},
		chatVisibilityClass () {
			return `team-${this.allChat ? 0 : this.localTeam + 1}-bg`
		},
	},

	watch: {
		pressed (key) {
			if (key.code === KEY_ESCAPE) {
				this.toggleChatFocus(false)
			} else if (key.code === KEY_ENTER) {
				if (this.showingInput) {
					if (this.draftMessage) {
						Bridge.emit('chat', { all: this.allChat, body: this.draftMessage }, (response) => {
							if (response.error) {
								//TODO display throttle error
								p('chat err', response)
							} else {
								this.draftMessage = ''
							}
						}) //TODO or global
					}
					this.toggleChatFocus(false)
				} else {
					this.setChatMode(!!key.modifier)
					this.toggleChatFocus(true)
				}
			}
		},
	},

	mounted () {
		this.canToggleChatMode = Local.game && !Local.game.botsMode && Local.game.size > 1
		if (!this.canToggleChatMode) {
			this.allChat = Local.game && !Local.game.botsMode
		}
	},

	methods: {
		scrollToBottom () {
			this.$nextTick(() => {
				if (this.$refs.chatScroll) {
					this.$refs.chatScroll.scrollTop = this.$refs.chatScroll.scrollHeight
				}
			})
		},

		toggleChatFocus (showing) {
			if (showing) {
				this.$refs.chatInput.focus()
			} else {
				this.$refs.chatInput.blur()
			}
		},

		onFocusChat () {
			this.showingInput = true
		},

		onBlurChat (event) {
			if (event.relatedTarget) {
				event.target.focus()
				return false
			}
			this.showingInput = false
			this.scrollToBottom()
		},

		setChatMode (requestedAll) {
			if (this.canToggleChatMode) {
				this.allChat = requestedAll
			}
		},
		toggleChatMode () {
			return this.setChatMode(!this.allChat)
		},

		onTeamVisibility () {
			if (this.showingInput) {
				this.setChatMode(!this.allChat)
			} else {
				this.toggleChatFocus(true)
			}
		},
	},
}
</script>

<style lang="postcss" scoped>
.chat-input {
	background: rgba(64, 64, 64, 0.5);
	&.active {
		@apply opacity-100;
	}
}

.chat-placeholder {
	color: rgba(255, 255, 255, 0.5);
}

.chat-messages {
	max-height: 200px;
}
.active .chat-messages {
	background: rgba(96, 96, 96, 0.5);
	max-height: 500px;
}

.chat-messages {
	@apply wh-full pl-1 text-lg text-left text-white;
	text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
	padding-right: 100px;
}
.active .chat-messages {
	@apply pr-0 pointer-events-auto;
}

.msg-from {
	@apply font-semibold;
}

@screen md-max {
	.chat-messages {
		@apply mb-32;
	}
}
</style>
