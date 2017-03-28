<template>
<div class="player-bar">
  <player-info class="bar-section"></player-info>
  <skills-bar class="bar-section"></skills-bar>
  <chat-bar></chat-bar>
  <settings-buttons class="bar-section"></settings-buttons>
</div>
</template>

<script>
import ChatBar from '@/components/Game/PlayerBar/ChatBar'
import PlayerInfo from '@/components/Game/PlayerBar/PlayerInfo'
import SettingsButtons from '@/components/Game/PlayerBar/SettingsButtons'
import SkillsBar from '@/components/Game/PlayerBar/SkillsBar'

export default {
  components: {
    ChatBar,
    PlayerInfo,
    SettingsButtons,
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
