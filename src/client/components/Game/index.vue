<template>
<div class="inherit">
  <canvas id="canvas" class="inherit"></canvas>

  <div class="game-status">
    <div v-if="playing">
      <h1 v-if="reemergeIn !== null">respawn in {{ reemergeIn }}</h1>
    </div>
    <div v-else>
      Game over
    </div>
  </div>

  <unit-select v-if="!playing"></unit-select>
  <score-bar class="ui-bar"></score-bar>
  <player-bar class="ui-bar"></player-bar>
</div>
</template>

<script>
import store from '@/store'

import Local from '@/play/local'

import Loop from '@/play/render/loop'

import PlayerBar from '@/components/Game/PlayerBar'
import ScoreBar from '@/components/Game/ScoreBar'
import UnitSelect from '@/components/Game/UnitSelect'

export default {
  components: {
    PlayerBar,
    ScoreBar,
    UnitSelect,
  },

  mounted () {
    if (!Local.game) {
      return
    }
    Local.game.start()
    Loop.start()
  },

  destroyed () {
    Loop.stop()
  },

  computed: {
    playing () {
      return store.state.game.playing
    },

    renderTime () {
      return store.state.game.renderTime
    },

    reemergeIn () {
      if (store.state.reemergeAt) {
        const diff = store.state.reemergeAt - this.renderTime
        if (diff >= 0) {
          return Math.round(diff / 1000)
        }
      }
      return null
    },
  },
}
</script>

<style lang="stylus">
.ui-bar
  position absolute
  left 0
  right 0
  display flex
  justify-content center
  user-select none
  color #fffffe
  pointer-events none

.game-status
  display flex
  align-content center
  justify-content center
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  margin auto
  padding-top 34px
  color #fffffe
  text-shadow -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000
  pointer-events none

.bar-section
  background rgba(80, 80, 80, 0.85)
  margin 0 8px
  padding 8px
  box-sizing border-box
  pointer-events auto
</style>
