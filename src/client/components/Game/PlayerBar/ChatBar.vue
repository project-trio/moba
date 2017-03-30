<template>
<div class="chat-bar">
  <div class="chat-messages">
    <div v-for="msg in messages">
      <div v-if="msg.kill"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.kill }}</span> killed by <span :class="`msg-from team-${1 - msg.team + 1}`">{{ msg.damagers.join(', ') }}</span></div>
      <div v-else-if="msg.tower"><span :class="`msg-from team-${msg.team + 1}`">{{ msg.tower }}</span> destroyed!</div>
      <div v-else><span :class="`msg-from team-${msg.team + 1}`">{{ msg.from }}</span>: {{ msg.body }}</div>
    </div>
  </div>
  <div class="chat-input-container">
    <input v-if="showingInput" ref="chatInput" v-model.trim="draftMessage" class="chat-input"></input>
    <div v-else class="chat-placeholder">press enter to chat...</div>
  </div>
</div>
</template>

<script>
import store from '@/store'

import Bridge from '@/play/events/bridge'

export default {
  data () {
    return {
      showingInput: false,
      draftMessage: '',
    }
  },

  computed: {
    messages () {
      return store.state.chatMessages
    },

    pressed () {
      return store.state.key.pressed
    },
  },

  watch: {
    pressed (key) {
      if (key.name === 'escape') {
        this.showingInput = false
      } else if (key.name === 'enter') {
        this.showingInput = !this.showingInput
        if (this.showingInput) {
          this.onShowChat()
        } else {
          this.$refs.chatInput.blur()

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
        }
      }
    },
  },

  methods: {
    onShowChat () {
      this.$nextTick(() => {
        this.$refs.chatInput.focus()
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
.chat-bar
  position absolute
  left 0
  bottom 0

.chat-input-container
  height 32px
  width 256px
.chat-input
  height inherit
  width inherit
.chat-placeholder
  text-align left
  width 100%
  height 100%
  color rgba(255, 255, 255, 0.5)
  font-size 1.2em
  margin-left 4px
  line-height 1.5em

.chat-messages
  margin 8px 0
  padding-left 4px
  text-align left
  color white
  text-shadow -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000
  font-size 1.1em

.msg-from
  font-weight 500
</style>
