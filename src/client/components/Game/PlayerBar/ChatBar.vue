<template>
<div class="chat-bar" :class="{ active: showingInput }">
  <div class="chat-messages-container">
    <div ref="chatScroll" class="chat-messages scrolls">
      <div v-for="msg in messages" class="msg">
        <div v-if="msg.active !== undefined"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.name }}</span> {{ msg.active ? 'rejoined' : 'left' }} the game</div>
        <div v-else-if="msg.kill"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.kill }}</span> {{ msg.executed ? 'died to ' + (msg.damagers.indexOf('base') !== -1 ? 'the' : 'a') : 'killed by' }} <span :class="`msg-from team-${1 - msg.team + 1}`">{{ msg.damagers.join(', ') }}</span></div>
        <div v-else-if="msg.tower"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.tower }}</span> destroyed!</div>
        <div v-else><span class="chat-all">{{ msg.all ? '[ALL] ' : null }}</span><span :class="`msg-from team-${msg.team + 1}`">{{ msg.from }}</span>: {{ msg.body }}</div>
      </div>
    </div>
  </div>
  <div class="chat-input-container">
    <button v-show="showingInput" @click="onTeamVisibility" :class="chatVisibilityClass" class="chat-visibility-button interactive">{{ allChat ? 'ALL' : 'team' }}</button>
    <input ref="chatInput" v-model.trim="draftMessage" @focus="onFocusChat" @blur="onBlurChat" class="chat-input" :class="{ active: showingInput }"></input>
    <div v-if="!showingInput" class="chat-placeholder">{{ chatPlaceholder }}</div>
  </div>
</div>
</template>

<script>
import store from '@/client/store'

import Local from '@/client/play/local'

import Bridge from '@/client/play/events/bridge'

const KEY_ENTER = 13
const KEY_ESCAPE = 27

export default {
  data () {
    return {
      showingInput: false,
      draftMessage: '',
      allChat: false,
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
      return store.state.playerId
    },
    localPlayer () {
      return store.state.game.players[this.localId]
    },
    localTeam () {
      return this.localPlayer ? this.localPlayer.team : 0
    },
    chatVisibilityClass () {
      return this.allChat ? 'team-all' : `team-${this.localTeam + 1}-bg`
    },
  },

  watch: {
    pressed (key) {
      if (key.code === KEY_ESCAPE) {
        this.toggleChat(false)
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
          this.toggleChat(false)
        } else {
          this.setChatVisiblity(key.modifier)
          this.toggleChat(true)
        }
      }
    },
  },

  methods: {
    scrollToBottom (showing) {
      this.$nextTick(() => {
        if (this.$refs.chatScroll) {
          this.$refs.chatScroll.scrollTop = this.$refs.chatScroll.scrollHeight
        }
      })
    },

    toggleChat (showing) {
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

    setChatVisiblity (enabled) {
      if (Local.game && Local.game.size > 1) {
        this.allChat = enabled
      } else {
        this.allChat = true
      }
    },

    onTeamVisibility () {
      if (this.showingInput) {
        this.setChatVisiblity(!this.allChat)
      } else {
        this.toggleChat(true)
      }
    },
  },
}
</script>

<style lang="stylus" scoped>
.chat-bar
  position absolute
  left 0
  bottom 0

// Input

.chat-input-container
  height 32px
  width 300px
  position relative
.chat-input
  width inherit
  height inherit
  padding-left 56px
  pointer-events auto
  color white
  background rgba(64, 64, 64, 0.5)
  opacity 0
  // position absolute
  // left 0
.chat-input.active
  opacity 1

.chat-placeholder
  position absolute
  left 0
  bottom 0
  text-align left
  width 100%
  height 100%
  font-size 1.2em
  margin-left 4px
  line-height 1.5em
  color rgba(255, 255, 255, 0.5)

.chat-visibility-button
  position absolute
  left 0
  width 52px
  height inherit
  font-size 18px
  z-index 1
  pointer-events auto

// Messages

.chat-messages-container
  margin 8px 0
  padding-left 4px
  width 300px
  max-height 200px
  overflow hidden
.active .chat-messages-container
  background rgba(96, 96, 96, 0.5)
  max-height 500px

.chat-messages
  text-align left
  color white
  text-shadow -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000
  font-size 1.1em
  width 100%
  max-height inherit
  padding-right 100px
.active .chat-messages
  pointer-events auto
  padding-right 0

.msg
  margin 4px 0

.chat-all
  color #999

.msg-from
  font-weight 500

@media (max-width: 767px)
  .chat-messages-container
    margin-bottom 64px
</style>
