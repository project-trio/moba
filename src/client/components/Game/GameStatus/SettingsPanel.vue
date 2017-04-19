<template>
<div class="settings-panel bar-section panel">
  <h1>Settings</h1>
  <div class="settings">
    <div class="setting">
      <button @click="onFps" class="interactive">{{ fpsDescription }}</button>
      <div class="label">FPS Cap</div>
    </div>
    <div class="setting">
      <button @click="onResolution" class="interactive">{{ pixelResolution }}x</button>
      <div class="label">Resolution</div>
    </div>
    <div class="setting">
      <button @click="onShadows" class="interactive">{{ shadows === 0 ? 'off' : shadows === 1 ? 'low' : 'high' }}</button>
      <div class="label">Shadows</div>
    </div>
    <div class="setting">
      <button @click="onAntialias" class="interactive">{{ antialias ? 'on' : 'off' }}</button>
      <div class="label">Antialias</div>
    </div>
  </div>
  <div class="note">Antialias on takes effect on next page load. If using scaled resolution, only turn this off if your framerate is still unplayable.</div>
</div>
</template>

<script>
import store from '@/store'

import Local from '@/play/local'

export default {
  computed: {
    fpsDescription () {
      return this.fpsCap ? 1000 / (Local.tickDuration || 50) : 60
    },

    fpsCap () {
      return store.state.settings.fpsCap
    },

    pixelResolution () {
      return window.devicePixelRatio / (this.resolution === 0 ? 4 : this.resolution === 1 ? 2 : 1)
    },

    resolution () {
      return store.state.settings.resolution
    },

    shadows () {
      return store.state.settings.shadows
    },

    antialias () {
      return store.state.settings.antialias
    },
  },

  methods: {
    onFps () {
      store.applySetting('fpsCap', !this.fpsCap, true)
    },

    onResolution () {
      store.applySetting('resolution', (this.resolution + 1) % 3, true)
    },

    onShadows () {
      store.applySetting('shadows', (this.shadows + 1) % 3, true)
    },

    onAntialias () {
      store.applySetting('antialias', !this.antialias, true)
    },
  },
}
</script>

<style lang="stylus" scoped>
.settings-panel
  pointer-events none

.settings
  display flex
  flex-wrap wrap
  justify-content center
.setting
  margin 12px
  // width 50%

button
  width 88px
  height 44px
  margin-bottom 2px
  border-radius 6px
  pointer-events auto
</style>
