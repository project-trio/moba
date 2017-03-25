<template>
<div id="app" class="inherit">
  <h1>Players</h1>
  <div class="players">
    {{ players.length - 1 }} players
  </div>
  <h1>Games</h1>
  <div class="players">
    {{ games.length }} games
  </div>
  <div v-for="game in games" class="game">
    <div>Status: {{ game.state }}</div>
    <div>Size: {{ game.size }}</div>
    <div>Started: {{ game.started }}</div>
    <div>Update #: {{ game.serverUpdate }}</div>
  </div>
</div>
</template>

<script>
import Bridge from '@/play/events/bridge'

export default {
  data () {
    return {
      games: [],
      players: [],
    }
  },

  mounted () {
    Bridge.init()
    Bridge.on('auth', () => {
      Bridge.emit('admin', 'get', (response) => {
        this.games = response.games
        this.players = response.players
      })
    })
  },
}
</script>

<style lang="stylus">

</style>
