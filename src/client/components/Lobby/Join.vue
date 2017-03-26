<template>
<div class="lobby-join">
  <div v-if="size === null">
    <h1>Loading...</h1>
  </div>
  <div v-else>
    <h1>New game</h1>
    <h2>{{ size }} v {{ size }}</h2>
    <h3>{{ playerCount }} of {{ size * 2 }} players</h3>
    <div>

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
        } else {
          window.alert(errorMessage)
        }
        router.replace({ name: 'Lobby' })
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

  },
}
</script>

<style lang="stylus" scoped>
.lobby-join
  color #111
</style>
