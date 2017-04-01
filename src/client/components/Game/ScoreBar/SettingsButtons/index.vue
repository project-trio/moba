<template>
<div class="settings-buttons">
  <button @click="onHelp" class="interactive">?</button>
  <button @click="onFullscreen" class="interactive">⤢</button>
  <button @click="onSettings" class="interactive">⚙</button>
</div>
</template>

<script>
import store from '@/store'

import fullscreen from '@/play/external/fullscreen.js'

export default {
  computed: {

  },

  methods: {
    onHelp () {
      store.state.game.showHelp = !store.state.game.showHelp
    },

    onFullscreen () {
      fullscreen.toggle()
    },

    onSettings () {
      store.toggleQualitySetting()
    },
  },
}
</script>

<style lang="stylus" scoped>
.settings-buttons
  position absolute
  display flex
  right 0
  top 0
  margin 0
  border-radius 0 0 0 4px !important
  // height 80px
  padding 4px

button
  padding 0
  font-size 1.1em
  width 32px
  height 32px
  margin 4px
  border-radius 2px
</style>
