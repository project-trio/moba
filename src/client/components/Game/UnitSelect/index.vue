<template>
<div class="unit-select">
<div class="content">
  {{ renderTime }}
  <div class="units-list">
    <button v-for="(unit, name) in units" @click="onUnit(name)" class="unit-box">{{ name }}</button>
  </div>
  <div class="chosen-box">
    <canvas id="unit"></canvas>
    {{ chosenUnit }}
  </div>

  <div class="player-teams scrolls">
    <div class="team-players team-1">
      <div v-for="player in teamPlayers[0]" :player="player" class="player-ship" :key="player.id">{{ player.shipName }}</div>
    </div>
    <div class="team-players team-2">
      <div v-for="player in teamPlayers[1]" :player="player" class="player-ship" :key="player.id">{{ player.shipName }}</div>
    </div>
  </div>
</div>
</div>
</template>

<script>
import store from '@/store'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'

import shipsData from '@/play/data/ships'

export default {
  mounted () {
  },

  destroyed () {
  },

  computed: {
    renderTime () {
      return Math.round(store.state.game.renderTime / 1000)
    },

    chosenUnit () {
      const localPlayer = store.state.game.players[Local.playerId]
      return localPlayer ? localPlayer.shipName : ''
    },
    units () {
      return shipsData
    },

    players () {
      return store.state.game.players
    },
    teamPlayers () {
      const result = this.size > 1 ? [Array(this.size), Array(this.size)] : [[], []]
      for (let pid in this.players) {
        const player = this.players[pid]
        player.id = pid
        result[player.team][player.teamIndex] = player
      }
      return result
    },
  },

  methods: {
    onUnit (name) {
      Bridge.emit('switch unit', { name }, (response) => {
        console.log('su', response)
        if (response.error) {
          alert(`Invalid unit: ${response.error}`)
        }
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
.unit-select
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  width 100%
  height 100%
  margin auto
  // padding 32px
  box-sizing border-box

.content
  background rgba(255, 255, 255, 0.75)
  width 100%
  height 100%

//LOCAL

.units-list
  display flex
  justify-content center

.unit-box
  margin 8px
  padding 8px
  width 80px
  height 80px
  flex-basis 80px
  background #fff
  border-radius 3px

.chosen-box
  margin auto
  width 300px
  height 300px
  background #fff
  border-radius 8px

//PLAYERS

.player-teams
  display flex
  flex-direction column
  width 100%
  overflow-x auto
  height 360px
  justify-content space-between
.team-players
  padding 8px
  display flex
  flex-direction row
  justify-content center

.player-ship
  width 80px
  height 80px
  flex-basis 80px
  border-radius 8px
  background #fff

@media (max-width: 768px)
  .player-teams
    flex-direction row
    height auto
  .team-players
    flex-direction column
    flex-basis 50%

</style>
