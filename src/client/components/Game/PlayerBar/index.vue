<template>
<div class="player-bar">
  <player-info class="bar-section"></player-info>
  <skills-bar class="bar-section"></skills-bar>
</div>
</template>

<script>
import PlayerInfo from '@/components/Game/PlayerBar/PlayerInfo'
import SkillsBar from '@/components/Game/PlayerBar/SkillsBar'

export default {
  components: {
    PlayerInfo,
    SkillsBar,
  },
}
</script>

<style lang="stylus" scoped>
.player-bar
  position absolute
  left 0
  right 0
  bottom 0
  width 100%
  display flex
  align-items bottom
  justify-content center

.bar-section
  background rgba(96,96,96,0.9)
  margin 0 8px
  padding 8px
</style>
