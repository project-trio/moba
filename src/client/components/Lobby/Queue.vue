<template>
<div class="lobby-queue inherit scrolls">
  <div class="header">
    <h1>{{ queuedPlayers }} in queue</h1>
  </div>
  <h3>minimum game size:</h3>
  <game-sizes @onGameSize="onGameSize" :gameSizes="gameSizes" :selectedSize="selectedSize"></game-sizes>
  <div class="queue-action">
    <div v-if="enoughPlayersForGame">
      <button @click="onReady" class="ready-button big interactive" :class="{ selected: readyRequested }">{{ readyRequested ? 'ready!' : `ready? (${15 - readyAt})` }}</button>
    </div>
    <div v-else>
      <h2>waiting for {{ waitingForSize }} players...</h2>
      <p v-if="enoughWithOneMore">Reduce size to <span class="highlight">{{ enoughWithOneMore }} v {{ enoughWithOneMore }}</span> to start now!</p>
    </div>
  </div>
</div>
</template>

<script>
// import CommonConsts from 'common/constants'

import store from '@/store'
import router from '@/router'

import Bridge from '@/play/events/bridge'
import LobbyEvents from '@/play/events/lobby'

import GameSizes from '@/components/Lobby/SelectionGroup/GameSizes'

export default {
  components: {
    GameSizes,
  },

  data () {
    return {
      selectedSize: 1,
      readyRequested: false,
      readyAt: 0,
      readyInterval: null,
    }
  },

  computed: {
    waitingForSize () {
      return this.availableSizes[this.selectedSize - 1] || this.selectedSize * 2 - 1
    },

    enoughWithOneMore () {
      for (let size = this.selectedSize - 1; size >= 0; size -= 1) {
        if (this.availableSizes[size - 1] <= 1) {
          return size
        }
      }
      return false
    },

    enoughPlayersForGame () {
      for (let idx = this.selectedSize - 1; idx < this.availableSizes.length; idx += 1) {
        if (this.availableSizes[idx] <= 0) {
          return true
        }
      }
      return false
    },

    availableSizes () {
      return store.state.lobby.queue.available || []
    },

    queuedPlayers () {
      return store.state.lobby.queue.players || 0
    },

    gameSizes () {
      return [1, 2, 3, 4] //CommonConsts.GAME_SIZES
    },
  },

  watch: {
    enoughPlayersForGame (enough) {
      if (!enough && this.readyRequested) {
        window.alert('Another player did not respond, and has been removed from the queue.')
      }
      this.setReadyTimer(enough)
    },

    availableSizes (sizes) {
      p(sizes)
      if (!this.enoughPlayersForGame) {
        this.readyRequested = false
      }
    },

    readyRequested () {
      this.sendQueue()
    },
    selectedSize () {
      this.sendQueue()
    },
  },

  methods: {
    setReadyTimer (enabled) {
      if (this.readyTimer) {
        window.clearInterval(this.readyTimer)
      }
      if (enabled) {
        this.readyAt = 0
        this.readyTimer = window.setInterval(() => {
          if (this.readyAt >= 15) {
            window.clearInterval(this.readyTimer)
            if (!this.readyRequested) {
              router.replace({ name: 'Lobby' })
              window.alert('Removed from the queue due to inactivity')
            }
          } else {
            this.readyAt += 1
          }
        }, 1000)
      }
    },

    onGameSize (size) {
      this.selectedSize = size
    },
    onReady () {
      this.readyRequested = !this.readyRequested
    },

    sendQueue () {
      this.setReadyTimer(this.enoughPlayersForGame)
      Bridge.emit('queue', { size: this.selectedSize, ready: this.readyRequested })
    },
  },

  mounted () {
    LobbyEvents.connect('queue', { size: this.selectedSize, ready: false })
  },

  beforeDestroy () {
    this.setReadyTimer(false)
    LobbyEvents.connect('leave') //TODO queue
  },
}
</script>

<style lang="stylus" scoped>
.ready-button.selected
  background-color #1ea

.header, .queue-action
  margin 64px auto

.highlight
  padding 2px 4px
  background-color #ddd
  font-weight 500
</style>
