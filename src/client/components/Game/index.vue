<template>
<div class="inherit">
  <canvas id="canvas" class="inherit"></canvas>

  <div class="game-status">
    <div v-if="showHelp" class="bar-section panel">
      <h1>Help</h1>
      <p>Click the gear icon to toggle quality mode (disables shadows, antialiasing, etc.)</p>
      <h2>Hotkeys</h2>
      <p>Activate skills with <b>1</b>, <b>2</b>, <b>3</b></p>
      <p>Upgrade with <b>shift</b>, <b>control</b>, or <b>alt</b> + <b>1</b>, <b>2</b>, <b>3</b></p>
      <p>Press <b>enter</b> to chat</p>
    </div>
    <div v-else-if="winningTeam !== null" class="bar-section panel">
      <h1>game over</h1>
      <h2 :class="`team-${winningTeam + 1}`">team {{ winningTeamColor }} won!</h2>
    </div>
    <div v-else-if="missingUpdate" class="bar-section panel">
      <h1>waiting for server connection</h1>
    </div>
    <div v-else-if="playing">
      <h1 v-if="reemergeIn !== null">respawn in {{ reemergeIn }}</h1>
    </div>
  </div>

  <unit-select v-if="!playing && winningTeam === null"></unit-select>

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
    showHelp () {
      return store.state.game.showHelp
    },
    missingUpdate () {
      return store.state.game.missingUpdate
    },
    playing () {
      return store.state.game.playing
    },
    winningTeam () {
      return store.state.game.winningTeam
    },
    winningTeamColor () {
      return this.winningTeam === 0 ? 'blue' : 'pink'
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
  align-items center
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

.panel
  padding 0 16px
  pointer-events none
  width 480px
  max-width 100%
</style>
