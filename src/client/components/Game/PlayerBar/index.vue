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

<style lang="stylus">
.player-bar
  position absolute
  left 0
  right 0
  bottom 0
  width 100%
  display flex
  align-items bottom
  justify-content center
  user-select none

.bar-section
  background rgba(96,96,96,0.9)
  margin 0 8px
  padding 8px
  box-sizing border-box
  border-radius 4px 4px 0 0
</style>
