<template>
<div class="player-box" :class="{ empty: !player, bottom: bottom }">
  <div v-if="player">
    {{ player.name }}
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

export default {
  props: {
    player: Object,
  },

  computed: {
    messages () {
      console.log(store.state.chatMessages)
      return store.state.chatMessages.filter(msg => msg.id === this.player.id).slice(0, 3)
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

.bottom .player-bubbles
  top -96px
  flex-direction column-reverse

.bubble
  color #fffffe
  font-size 16px
  word-wrap break-word
  margin-top 4px
  display inline-block

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
</style>
