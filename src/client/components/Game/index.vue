<template>
<div class="game-container inherit">
  <canvas id="canvas" class="inherit"></canvas>

  <unit-select v-if="!playing && winningTeam === null"></unit-select>

  <game-status></game-status>

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

    window.onbeforeunload = this.confirmExit
    window.addEventListener('touchmove', this.cancelZoom, false)
  },

  beforeDestroy () {
    if (Local.game) {
      Local.game.close()
    }
    Loop.stop()

    window.onbeforeunload = null
    window.removeEventListener('touchmove', this.cancelZoom, false)
  },

  computed: {
    playing () {
      return store.state.game.playing
    },

    winningTeam () {
      return store.state.game.winningTeam
    },
  },

  methods: {
    confirmExit (event) {
      if (store.state.game.active) {
        if (Local.TESTING) {
          return
        }
        const message = 'Game in progress. You will be left afk in the game and may be unable to join a new game due to leaving. Are you sure?'
        event.returnValue = message
        return message
      }
    },

    cancelZoom (event) {
      if (event.originalEvent) {
        event = event.originalEvent
      }
      if (event.scale) {
        event.preventDefault()
      }
    }
  },
}
</script>

<style lang="stylus">
.game-container
  user-select none

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
