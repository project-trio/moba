<template>
<div class="lobby inherit scrolls">
<div class="content">
  <h1>moba lobby</h1>
  <h3>hello {{ username }}!</h3>
  <div>{{ playersOnline }} online</div>
  <router-link :to="{ name: 'Queue' }" tag="button" class="big interactive">enter queue</router-link>
  <router-link :to="{ name: 'Create' }" tag="button" class="big interactive">create game</router-link>
  <div>
    <router-link v-for="game in games" :to="{ name: 'Join', params: { gid: game.id } }" tag="div" class="list-game interactive" :key="game.id">
      <div>{{ game.mode }} game - {{ game.state }}</div>
      <div>{{ Object.keys(game.players).length }} of {{ game.size * 2 }} players</div>
      <div>{{ game.map }} map</div>
    </router-link>
  </div>
</div>
</div>
</template>

<script>
import router from '@/router'
import store from '@/store'

import util from '@/helpers/util'

import Local from '@/play/local'

import LobbyEvents from '@/play/events/lobby'

export default {
  mounted () {
    LobbyEvents.connect('enter', { leaving: Local.gid }, (data) => {
      if (data.gid) {
        p('redirecting to game', data.gid)
        router.replace({ name: 'Join', params: { gid: data.gid } })
      } else {
        // p('joined lobby', data)
        store.state.lobby.onlineCount = data.online
        store.state.lobby.games = data.games
        Local.gid = null
      }
    })
  },

  beforeDestroy () {
    LobbyEvents.connect('leave')
  },

  computed: {
    username () {
      return store.state.signin.username
    },

    playersOnline () {
      return util.pluralize(store.state.lobby.onlineCount, 'player')
    },

    games () {
      return store.state.lobby.games
    },
  },
}
</script>

<style lang="stylus" scoped>
.content
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
