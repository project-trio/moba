<template>
<div class="player-box" :class="{ empty: !player }">
  <div v-if="player">
    {{ player.name }}
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

  },
}
</script>

<style lang="stylus" scoped>
.player-box
  font-size 1.5em
  background #ddd
  height 64px
  // width 256px
  flex-basis 144px
  margin 8px
  flex-grow 1
  flex-shrink 0

  display flex
  align-items center
  justify-content center

.player-box.empty
  background #eee
  font-size 1.1em
</style>
