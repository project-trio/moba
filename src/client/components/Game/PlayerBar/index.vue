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

import Local from '@/play/local'

const KEY_SPACE = 32
const KEY_LEFT = 37
const KEY_UP = 38
const KEY_RIGHT = 39
const KEY_DOWN = 40

export default {
  components: {
    ChatBar,
    Minimap,
    PlayerInfo,
    SkillsBar,
  },

  created () {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('mousewheel', this.scroll, true)
  },

  destroyed () {
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
    window.removeEventListener('mousewheel', this.scroll, true)
  },

  computed: {
    playing () {
      return store.state.game.playing
    },
  },

  methods: {
    pressing (code, enabled) {
      if (code === KEY_SPACE) {
        store.state.trackCamera = enabled
      } else if (code === KEY_LEFT) {
        store.state.trackX = enabled ? -1 : 0
      } else if (code === KEY_RIGHT) {
        store.state.trackX = enabled ? 1 : 0
      } else if (code === KEY_UP) {
        store.state.trackY = enabled ? -1 : 0
      } else if (code === KEY_DOWN) {
        store.state.trackY = enabled ? 1 : 0
      }
    },
    keydown (event) {
      const keyCode = event.which || event.keyCode
      this.pressing(keyCode, true)
    },
    keyup (event) {
      const keyCode = event.which || event.keyCode
      this.pressing(keyCode, false)
    },

    scroll (event) {
      if (!store.state.trackCamera) {
        const game = Local.game
        if (game) {
          store.state.manualCamera = true
          game.map.trackDelta(event.deltaX, event.deltaY, 0.75)
        }
      }
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
