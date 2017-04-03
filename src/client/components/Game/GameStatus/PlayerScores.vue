<template>
<div class="bar-section panel">
  <table class="player-scores">
    <tr><th>team</th><th>name</th><th>level</th><th>assists</th><th>deaths</th><th>damage</th></tr>
    <tr v-for="result in playerResults" :class="`team-${result.team + 1}`">
      <td>{{ result.team + 1 }}</td><td>{{ result.name }}</td><td>{{ result.level }}</td><td>{{ result.kills }}</td><td>{{ result.deaths }}</td><td>{{ result.damage / 100 }}</td>
    </tr>
  </table>
</div>
</template>

<script>
import store from '@/store'

export default {
  computed: {
    playerResults () {
      return store.state.game.ships
    },
  },
}
</script>

<style lang="stylus" scoped>
.player-scores
  width 100%
  text-shadow none

th, td
  background #333
  font-weight 500
</style>
