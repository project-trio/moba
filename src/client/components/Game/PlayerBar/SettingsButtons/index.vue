<template>
<div class="settings-buttons">
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
  right 0
  bottom 0
  margin 0
  border-radius 4px 0 0 0

button
  width 44px
  height 44px
  border-radius 2px
</style>
