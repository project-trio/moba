<template>
<div class="lobby">
  <h1>moba lobby</h1>
  <h3>hello {{ username }}!</h3>
  <div>{{ playersOnline }} online</div>
  <router-link :to="{ name: 'Create' }" tag="button" class="big interactive">create game</router-link>
  <div>
    <router-link v-for="game in games" :to="{ name: 'Join', params: { gid: game.id } }" tag="div" class="list-game interactive" :key="game.id">
      <div>{{ game.state }} game</div>
      <div>{{ Object.keys(game.players).length }} of {{ game.size * 2 }} players</div>
    </router-link>
  </div>
</div>
</template>

<script>
import store from '@/store'

import util from '@/helpers/util'

import LobbyEvents from '@/play/events/lobby'

export default {
  created () {
    LobbyEvents.connect('enter', null, (data) => {
      store.state.game.playersOnline = data.online
      store.state.game.list = data.games
    })
  },

  destroyed () {
    LobbyEvents.connect('leave')
  },

  computed: {
    username () {
      return store.state.signin.username
    },

    playersOnline () {
      return util.pluralize(store.state.game.playersOnline, 'player')
    },

    games () {
      return store.state.game.list
    },
  },
}
</script>

<style lang="stylus" scoped>
.lobby
  max-width 720px
  margin auto

.list-game
  background #eee
  padding 16px
  margin 8px

.list-game:hover
  background #ddd

.list-game:hover:active
  background #ccc
</style>
