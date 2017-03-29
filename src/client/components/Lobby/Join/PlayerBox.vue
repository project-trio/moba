<template>
<div class="player-box" :class="classList">
  <div v-if="player">
    <div class="player-info">
      {{ player.name }}
    </div>
    <transition-group name="bubbling" tag="div" class="player-bubbles">
      <div v-for="message in messages" class="bubble" :class="teamBackgroundClass" :key="message">{{ message.body }}</div>
    </transition-group>
  </div>
  <div v-else class="faint note">
    waiting
  </div>
</div>
</template>

<script>
import store from '@/store'

import Local from '@/play/local'

export default {
  props: {
    player: Object,
  },

  computed: {
    classList () {
      return [
        !this.player ? 'empty' : null,
        this.bottom ? 'bottom' : null,
        this.isLocal ? 'local' : null,
        this.isLocal ? `team-${this.player.team + 1}-border` : null
      ]
    },

    messages () {
      return store.state.chatMessages.filter(msg => msg.id === this.player.id).slice(0, 3)
    },

    isLocal () {
      return this.player && this.player.id === Local.playerId
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
  margin 8px
  flex-grow 1
  flex-shrink 0
  border-radius 1px

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
  top 64px
  width 100%
  height 96px
  overflow hidden
  display flex
  flex-direction column
  align-items center

.bottom .player-bubbles
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
  border-radius 4px
.bottom .bubble
  margin-top 0
  margin-bottom 4px

.bubbling-enter-active, .bubbling-leave-active, .bubbling-move
  transition all 1s
.bubbling-enter, .bubbling-leave-to
  opacity 0
  transform translateY(-24px)
.bottom .bubbling-enter, .bottom .bubbling-leave-to
  transform translateY(24px)

@media (max-width: 768px)
  .player-bubbles
    display none
</style>
