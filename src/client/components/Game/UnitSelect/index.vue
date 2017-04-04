<template>
<div class="unit-select">
<div class="content">
  <div class="start-countdown">
    <h2>starting in {{ countdownTime }}s</h2>
  </div>
  <h1>choose your unit</h1>
  <div class="unit-selection">
    <div class="chosen-box selection-half">
      <canvas id="preview"></canvas>
    </div>
    <div class="units-list selection-half" :class="`team-${localTeam + 1}`">
      <button v-for="name in shipNames" @click="onUnit(name)" class="unit-box interactive" :class="{ selected: chosenUnit === name }">{{ name }}</button>
    </div>
  </div>

  <div class="player-teams scrolls">
    <h1>teams</h1>
    <div class="team-players team-1">
      <div v-for="player in teamPlayers[0]" :player="player" class="player-ship animated" :class="{ selected: player.id === localId }" :key="player.id">{{ player.shipName }}</div>
    </div>
    <div class="team-players team-2">
      <div v-for="player in teamPlayers[1]" :player="player" class="player-ship animated" :class="{ selected: player.id === localId }" :key="player.id">{{ player.shipName }}</div>
    </div>
  </div>
</div>
</div>
</template>

<script>
import CommonConsts from 'common/constants'

import store from '@/store'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'

import RenderPreview from '@/play/render/preview'

export default {
  mounted () {
    RenderPreview.create()
    if (this.chosenUnit) {
      RenderPreview.load(this.chosenUnit, this.localTeam)
    }
  },

  destroyed () {
    RenderPreview.destroy()
  },

  computed: {
    countdownTime () {
      return Math.round(-store.state.game.renderTime / 1000)
    },

    localId () {
      return Local.playerId
    },
    localPlayer () {
      return store.state.game.players[this.localId]
    },
    localTeam () {
      return this.localPlayer ? this.localPlayer.team : 0
    },
    chosenUnit () {
      return this.localPlayer ? this.localPlayer.shipName : ''
    },
    shipNames () {
      return CommonConsts.SHIP_NAMES
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

  watch: {
    chosenUnit (name) {
      RenderPreview.load(name, this.localTeam)
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
h1
  color #aaa

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
  background rgba(0, 0, 0, 0.67)
  -webkit-backdrop-filter blur(10px)
  width 100%
  height 100%
  box-sizing border-box
  padding 16px
  color #fffffe

//LOCAL

.unit-selection
  display flex
  justify-content center
  flex-wrap wrap

.selection-half
  width 300px
  height 300px

#preview
  width 100%
  height 100%

.units-list
  display flex
  justify-content center
  flex-wrap wrap
.unit-box
  margin 8px
  width 80px
  height 80px
  background #eee
  border-radius 3px
.unit-box.selected
  border-width 5px
  border-style solid
  border-color inherit
  box-sizing border-box

.chosen-box
  background #e7e7e7
  border-radius 8px
  margin-bottom 32px

//PLAYERS

.player-teams
  display flex
  flex-direction column
  width 100%
  overflow-x auto
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
  background #eee
  display flex
  align-items center
  justify-content center
  font-weight 500
  font-size 1.5em
.player-ship.selected
  border-width 5px
  border-style solid
  border-color inherit
  box-sizing border-box

@media (max-width: 768px)
  .player-teams
    flex-direction row
    height auto
  .team-players
    flex-direction column
    flex-basis 50%

</style>
