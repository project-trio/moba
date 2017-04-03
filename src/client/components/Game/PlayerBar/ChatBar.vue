<template>
<div class="chat-bar">
  <div class="chat-messages-container" :class="{ active: showingInput }">
    <div ref="chatScroll" class="chat-messages scrolls">
      <div v-for="msg in messages" class="msg">
        <div v-if="msg.kill"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.kill }}</span> killed by {{ msg.executed ? 'a' : null }} <span :class="`msg-from team-${1 - msg.team + 1}`">{{ msg.damagers.join(', ') }}</span></div>
        <div v-else-if="msg.tower"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.tower }}</span> destroyed!</div>
        <div v-else><span :class="`msg-from team-${msg.team + 1}`">{{ msg.from }}</span>: {{ msg.body }}</div>
      </div>
    </div>
  </div>
  <div class="chat-input-container">
    <input ref="chatInput" v-model.trim="draftMessage" @focus="onFocusChat" @blur="onBlurChat" class="chat-input" :class="{ active: showingInput }"></input>
    <div v-if="!showingInput" class="chat-placeholder">press enter to chat</div>
  </div>
</div>
</template>

<script>
import store from '@/store'

import Bridge from '@/play/events/bridge'

const KEY_ENTER = 13
const KEY_ESCAPE = 27

export default {
  data () {
    return {
      showingInput: false,
      draftMessage: '',
    }
  },

  computed: {
    messages () {
      this.scrollToBottom()
      return store.state.chatMessages
    },

    pressed () {
      return store.state.key.pressed
    },
  },

  watch: {
    pressed (key) {
      if (key.code === KEY_ESCAPE) {
        this.toggleChat(false)
      } else if (key.code === KEY_ENTER) {
        if (this.showingInput) {
          if (this.draftMessage) {
            Bridge.emit('chat', { team: true, body: this.draftMessage }, (response) => {
              if (response.error) {
                //TODO display throttle error
                console.log('chat err', response)
              } else {
                this.draftMessage = ''
              }
            }) //TODO or global
          }
          this.toggleChat(false)
        } else {
          this.toggleChat(true)
        }
      }
    },
  },

  methods: {
    scrollToBottom (showing) {
      this.$nextTick(() => {
        this.$refs.chatScroll.scrollTop = this.$refs.chatScroll.scrollHeight
      })
    },

    toggleChat (showing) {
      if (showing) {
        this.$refs.chatInput.focus()
      } else {
        this.$refs.chatInput.blur()
      }
      this.scrollToBottom()
    },

    onFocusChat () {
      this.showingInput = true
    },

    onBlurChat () {
      this.showingInput = false
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
  width 256px
  position relative
.chat-input
  height inherit
  width inherit
  pointer-events auto
  color white
  background rgba(64, 64, 64, 0.5)
  opacity 0
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

// Messages

.chat-messages-container
  margin 8px 0
  padding-left 4px
  width 300px
  max-height 200px
  overflow hidden
.chat-messages-container.active
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

.msg-from
  font-weight 500
</style>
