<template>
<div class="player-info">
  <div>{{ stats.name }}</div>
  <div>{{ stats.health }} / {{ stats.healthMax }} hp</div>
  <div>{{ stats.levelProgress }}% to level {{ stats.level + 1 }}</div>
  <div>
    <span>{{ stats.dps.toFixed(1) }} dps</span>
    <span>{{ stats.range }} range</span>
  </div>
  <div>
    <span>0 armor</span>
    <span>{{ stats.moveSpeed }} kph</span>
  </div>
</div>
</template>

<script>
export default {
  computed: {
    stats () {
      console.log('stat!', this.$root.$data.state.selectedStats)
      return this.$root.$data.state.selectedStats
    },
  },
}
</script>

<style lang="stylus" scoped>
// .player-info
</style>
