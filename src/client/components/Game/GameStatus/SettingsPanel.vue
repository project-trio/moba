<template>
<div class="settings-panel bar-section panel">
  <h1>Settings</h1>
  <div class="row">
    <label>Resolution: <button @click="onResolution" class="interactive">{{ pixelResolution }}x</button></label>
  </div>
  <div class="row">
    <label>Shadows: <button @click="onShadows" class="interactive">{{ shadows === 0 ? 'off' : shadows === 1 ? 'low' : 'high' }}</button></label>
  </div>
  <div class="row">
    <label>Antialias: <button @click="onAntialias" class="interactive">{{ antialias ? 'on' : 'off' }}</button></label>
  </div>
  <div class="note">Antialias on takes effect on next page load. If using scaled resolution, only turn this off if your framerate is still unplayable.</div>
</div>
</template>

<script>
import store from '@/store'

export default {
  computed: {
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

button
  width 88px
  height 44px
  border-radius 6px
  margin 8px
  pointer-events auto
</style>
