<template>
<div class="chat-bar">
  <div class="chat-messages">
    <div v-for="msg in messages">
      <span :class="`msg-from team-${msg.team + 1}`">{{ msg.from }}</span>: {{ msg.body }}
    </div>
  </div>
  <div class="chat-input-container">
    <input v-if="showingInput" ref="chatInput" v-model.trim="draftMessage" class="chat-input"></input>
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
          this.$nextTick(() => {
            this.$refs.chatInput.focus()
          })
        } else {
          this.$refs.chatInput.blur()

          if (this.draftMessage) {
            Bridge.emit('team msg', { body: this.draftMessage }) //TODO or global
            this.draftMessage = ''
          }
        }
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

.chat-input-container
  height 32px
  width 256px
.chat-input
  height inherit
  width inherit

.chat-messages
  margin 8px 0
  padding-left 4px
  text-align left
  color white
  text-shadow -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000
  font-size 1.1em

.msg-from
  font-weight 500
.team-1
  color #5599cc
.team-2
  color #dd6677
</style>
