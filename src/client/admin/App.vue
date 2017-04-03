<template>
<div id="app" class="inherit">
  <h1>{{ players.length }} online</h1>
  <div>{{ players.join(', ') }}</div>
  <h1>{{ games.length }} games</h1>
  <div v-for="game in games" class="game">
    <div>Status: {{ game.state }}</div>
    <div>Size: {{ game.size }}</div>
    <div>Update: {{ game.update }}</div>
    Players:
    <div v-for="player in game.players">
      {{ player.team }} {{ player.name }} {{ player.shipName }}
    </div>
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
        console.log(response.games)
        this.players = response.names
      })
    })
  },
}
</script>

<style lang="stylus">

</style>
