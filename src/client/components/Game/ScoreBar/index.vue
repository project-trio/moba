<template>
<div class="score-bar">
  <div class="bar-section">
    ⚔️
  </div>
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

<style lang="stylus">
.score-bar
  top 0
</style>
