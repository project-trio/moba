<template>
<div class="lobby">
  <router-link :to="{ name: 'Create' }" tag="button" class="big interactive">create game</router-link>
  <div>
    <router-link v-for="game in games" :to="{ name: 'Join', params: { gid: game.id } }" tag="div" class="list-game interactive">
      <div>{{ game.state }} game</div>
      <div>{{ Object.keys(game.players).length }} of {{ game.size * 2 }} players</div>
    </router-link>
  </div>
</div>
</template>

<script>
import store from '@/store'

import LobbyEvents from '@/play/events/lobby'

export default {
  created () {
    LobbyEvents.connect('enter', null, (data) => {
      store.state.game.list = data.games
    })
  },

  destroyed () {
    LobbyEvents.connect('leave')
  },

  computed: {
    games () {
      console.log('gl', store.state.game.list)
      return store.state.game.list
    },
  },
}
</script>

<style lang="stylus" scoped>
.lobby
  color #111

.list-game
  background #eee
  padding 16px
</style>
