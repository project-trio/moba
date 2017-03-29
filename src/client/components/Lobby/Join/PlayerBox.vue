<template>
<div class="player-box" :class="{ empty: !player, bottom: bottom }">
  <div v-if="player">
    {{ player.name }}
    <div class="player-bubbles"></div>
  </div>
  <div v-else class="faint note">
    waiting
  </div>
</div>
</template>

<script>
export default {
  props: {
    player: Object,
  },

  computed: {
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
  height 104px

.player-bubbles.bottom
  bottom 64px
</style>
