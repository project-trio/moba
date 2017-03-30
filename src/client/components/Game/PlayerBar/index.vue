<template>
<div class="player-bar">
  <player-info class="bar-section"></player-info>
  <skills-bar class="bar-section"></skills-bar>
  <chat-bar></chat-bar>
</div>
</template>

<script>
import ChatBar from '@/components/Game/PlayerBar/ChatBar'
import PlayerInfo from '@/components/Game/PlayerBar/PlayerInfo'
import SkillsBar from '@/components/Game/PlayerBar/SkillsBar'

export default {
  components: {
    ChatBar,
    PlayerInfo,
    SkillsBar,
  },
}
</script>

<style lang="stylus" scoped>
.player-bar
  bottom 0

.bar-section
  border-radius 4px 4px 0 0
</style>
