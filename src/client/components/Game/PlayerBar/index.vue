<template>
<div class="player-bar">
  <chat-bar></chat-bar>
  <player-info v-show="playing" class="bar-section"></player-info>
  <skills-bar v-show="playing" class="bar-section"></skills-bar>
  <minimap v-show="playing" class="bar-section"></minimap>
</div>
</template>

<script>
import store from '@/store'

import ChatBar from '@/components/Game/PlayerBar/ChatBar'
import Minimap from '@/components/Game/PlayerBar/Minimap'
import PlayerInfo from '@/components/Game/PlayerBar/PlayerInfo'
import SkillsBar from '@/components/Game/PlayerBar/SkillsBar'

export default {
  components: {
    ChatBar,
    Minimap,
    PlayerInfo,
    SkillsBar,
  },

  computed: {
    playing () {
      return store.state.game.playing
    },
  },
}
</script>

<style lang="stylus" scoped>
.player-bar
  bottom 0

.bar-section
  border-radius 4px 4px 0 0
</style>
