<template>
<div class="player-info">
  <div class="bold">{{ stats.name }}</div>
  <div>{{ stats.health }} / {{ stats.healthMax }} hp</div>
  <div v-if="this.stats.level">{{ levelProgress }}</div>
  <div>
    <span>{{ stats.dps }} dps</span>
    <span>{{ stats.range }} range</span>
  </div>
  <div>
    <span>{{ stats.armor }} armor</span>
    <span>{{ stats.moveSpeed }} kph</span>
  </div>
</div>
</template>

<script>
export default {
  computed: {
    levelProgress () {
      if (this.stats.levelProgress === null) {
        return `Level ${this.stats.level}`
      }
      return `${this.stats.levelProgress}% to level ${this.stats.level + 1}`
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
