<template>
<div class="inherit">
  <canvas id="canvas" class="inherit"></canvas>

  <game-status></game-status>

  <unit-select v-if="!playing && winningTeam === null"></unit-select>

  <score-bar class="ui-bar"></score-bar>
  <player-bar class="ui-bar"></player-bar>
</div>
</template>

<script>
import store from '@/store'

import Local from '@/play/local'

import Loop from '@/play/render/loop'

import GameStatus from '@/components/Game/GameStatus'
import PlayerBar from '@/components/Game/PlayerBar'
import ScoreBar from '@/components/Game/ScoreBar'
import UnitSelect from '@/components/Game/UnitSelect'

export default {
  components: {
    GameStatus,
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

    winningTeam () {
      return store.state.game.winningTeam
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

.bar-section
  background rgba(80, 80, 80, 0.85)
  margin 0 8px
  padding 8px
  box-sizing border-box
  pointer-events auto
</style>
