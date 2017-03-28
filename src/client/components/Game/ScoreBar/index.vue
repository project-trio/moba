<template>
<div class="score-bar">
  <div class="bar-section">
    <span class="towers team-1">{{ towers[0] }}</span> <span class="tower-symbol">〒</span>
    <span class="kills-container">
      <span class="kills team-1">{{ kills[0] }}</span>
      ⚔️
      <span class="kills team-2">{{ kills[1] }}</span> <span class="tower-symbol">〒</span>
    </span>
    <span class="towers team-2"> {{ towers[1] }}</span>
  </div>
</div>
</template>

<script>
import store from '@/store'

export default {
  computed: {
    kills () {
      return store.state.game.stats.kills
    },

    towers () {
      return store.state.game.stats.towers
    },
  },
}
</script>

<style lang="stylus" scoped>
.bar-section
  border-radius 0 0 4px 4px

.score-bar
  top 0
  font-size 1.2em
  font-weight 600
  text-shadow 0 1px 1px #444

.bar-section
  padding-left 20px
  padding-right 20px

.kills-container
  margin 0 8px

.kills
  font-size 2em
  line-height 1em
  padding 0 6px

.towers
  font-size 1.2em
  line-height 1em

.tower-symbol
  color #bbb
  font-weight 500
</style>
