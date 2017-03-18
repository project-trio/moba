<template>
<div class="player-info">
  <div class="bold">{{ stats.name }}</div>
  <div>{{ stats.health }} / {{ stats.healthMax }} hp</div>
  <div>{{ levelProgress }}</div>
  <div>
    <span>{{ stats.dps }} dps</span>
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
    levelProgress () {
      if (this.stats.levelProgress) {
        return `${this.stats.levelProgress}% to level ${this.stats.level + 1}`
      }
      return `Level ${this.stats.level + 1}`
    },

    stats () {
      return this.$root.$data.state.selectedStats
    },
  },
}
</script>

<style lang="stylus" scoped>
// .player-info
</style>
