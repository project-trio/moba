<template>
<div class="lobby-join">
  <div v-if="size === null">
    <h1>Loading...</h1>
  </div>
  <div v-else>
    <h1>{{ size }} v {{ size }}</h1>
    <h3>{{ playerCount }} of {{ size * 2 }} players</h3>
    <div class="player-teams">
      <div class="team-players team-1">
        <div v-for="teamIndex in size" class="player-box">{{ teamIndex }}<br>{{ getPlayer(0, teamIndex - 1) }}</div>
      </div>
      <div class="team-players team-2">
        <div v-for="teamIndex in size" class="player-box">{{ teamIndex }}<br>{{ getPlayer(1, teamIndex - 1) }}</div>
      </div>
    </div>
    Invite a friend: <a :href="url">{{ url }}</a>
  </div>
</div>
</template>

<script>
import router from '@/router'
import store from '@/store'

import Game from '@/play/game/entity/game/game'

import LobbyEvents from '@/play/events/lobby'

import Local from '@/play/local'

export default {
  props: {
    gid: String,
  },

  data () {
    return {
      size: null,
    }
  },

  created () {
    LobbyEvents.connect('join', { gid: this.gid }, (data) => {
      if (data.error) {
        const errorMessage = `Join error: ${data.error}`
        if (Local.TESTING) {
          console.log(errorMessage)
          setTimeout(() => {
            router.replace({ name: 'Game' })
          }, 500)
        } else {
          window.alert(errorMessage)
          router.replace({ name: 'Lobby' })
        }
      } else {
        this.size = data.size
        console.log('join', data)
        const newGame = new Game(data.gid, data.size)
        newGame.updatePlayers(data)
        Local.game = newGame
      }
    })
  },

  computed: {
    gameSize () {
      return `${this.size} v ${this.size}`
    },

    playerCount () {
      return Object.keys(this.players).length
    },

    players () {
      return store.state.game.players
    },

    url () {
      return window.location.href
    },
  },

  methods: {
    getPlayer (team, teamIndex) {
      for (let pid in this.players) {
        const player = this.players[pid]
        if (player.team === team && player.teamIndex === teamIndex) {
          return player
        }
      }
      return null
    }
  },
}
</script>

<style lang="stylus" scoped>
.player-teams
  display flex
  margin auto
  max-width 720px

.team-players
  display flex
  flex-direction column
  flex-basis 50%

.player-box
  background #ddd
  height 64px
  // width 256px
  margin 8px
  flex-grow 1
</style>
