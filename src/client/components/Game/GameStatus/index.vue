<template>
<div class="game-status scrollable">
  <div v-if="showHelp" class="bar-section panel">
    <h1>Help</h1>
    <p>Click the gear icon to toggle quality mode (disables shadows, antialiasing, etc.)</p>
    <h2>Hotkeys</h2>
    <p>Activate skills with <b>1</b>, <b>2</b>, <b>3</b></p>
    <p>Upgrade with <b>shift</b>, <b>control</b>, or <b>alt</b> + <b>1</b>, <b>2</b>, <b>3</b></p>
    <p>Press <b>enter</b> to chat with your team</p>
  </div>
  <div v-else-if="gameOver">
    <div class="bar-section panel">
      <h1>game over</h1>
      <h2 :class="`team-${winningTeam + 1}`">team {{ winningTeamColor }} won!</h2>
      <button @click="onReturnToLobby" class="panel-button interactive">leave</button>
    </div>
    <player-scores></player-scores>
  </div>
  <player-scores v-else-if="pressingTab"></player-scores>
  <div v-else-if="missingUpdate" class="bar-section panel">
    <h1>waiting for server connection</h1>
  </div>
  <div v-else-if="playing">
    <h1 v-if="reemergeIn !== null">respawn in {{ reemergeIn }}</h1>
  </div>
</div>
</template>

<script>
import router from '@/router'
import store from '@/store'

import PlayerScores from '@/components/Game/GameStatus/PlayerScores'

const KEY_TAB = 9

export default {
  components: {
    PlayerScores,
  },

  data () {
    return {
      pressingTab: false,
    }
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

    gameOver () {
      return this.winningTeam !== null
    },
    winningTeam () {
      return store.state.game.winningTeam
    },
    winningTeamColor () {
      return this.winningTeam === 0 ? 'blue' : 'pink'
    },

    currentPress () {
      const pressing = store.state.key.lastPress
      const code = pressing.code
      const released = pressing.released
      return code !== undefined && released !== undefined && pressing
    },

    renderTime () {
      return store.state.game.renderTime
    },

    reemergeIn () {
      if (store.state.local.reemergeAt) {
        const diff = store.state.local.reemergeAt - this.renderTime
        if (diff >= 0) {
          return Math.round(diff / 1000)
        }
      }
      return null
    },
  },

  watch: {
    currentPress (key) {
      this.pressingTab = key.code === KEY_TAB
    },
  },

  methods: {
    onReturnToLobby () {
      router.replace({ name: 'Lobby' })
    },
  },
}
</script>

<style lang="stylus" scoped>
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

button
  pointer-events auto
  height 44px
  width 256px

.panel
  padding 16px
  width 480px
  max-width 100%

.player-scores
  width 100%
  text-shadow none

th, td
  background #333
  font-weight 500
</style>
