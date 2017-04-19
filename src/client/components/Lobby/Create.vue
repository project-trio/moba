<template>
<div class="lobby-create inherit scrolls">
  <h1>create game</h1>
  <div v-if="loading">
  </div>
  <div v-else>
    <h3>game type:</h3>
    <div class="selection-container">
      <button v-for="mode in gameModes" @click="onGameMode(mode)" class="selection interactive" :class="{ selected: mode === selectedMode }">{{ mode.name }}</button>
      <div class="mode-description">
        {{ this.selectedMode.description }}
      </div>
    </div>
    <h3>game size:</h3>
    <div class="selection-container">
      <button v-for="size in gameSizes" @click="onGameSize(size)" class="selection interactive" :class="{ selected: size === selectedSize }">{{ sizeLabel(size) }}</button>
    </div>
    <h3>map:</h3>
    <div class="selection-container">
      <button v-for="map in mapsForSize" @click="onMap(map)" class="selection interactive" :class="{ selected: map === selectedMap }">{{ map }}</button>
    </div>
    <button @click="onSubmit" class="big interactive">confirm</button>
  </div>
</div>
</template>

<script>
import router from '@/router'

import CommonConsts from 'common/constants'
import commonMaps from 'common/maps'

import Local from '@/play/local'

import LobbyEvents from '@/play/events/lobby'

export default {
  data () {
    return {
      loading: false,
      selectedMode: CommonConsts.GAME_MODES[0],
      selectedSize: 0,
      selectedMap: null,
    }
  },

  computed: {
    gameModes () {
      return CommonConsts.GAME_MODES
    },

    pvpMode () {
      return this.selectedMode === CommonConsts.GAME_MODES[0]
    },

    gameSizes () {
      return this.pvpMode ? CommonConsts.GAME_SIZES : CommonConsts.GAME_SIZES.slice(0, 2)
    },

    mapsForSize () {
      const maps = []
      for (let name in commonMaps) {
        const map = commonMaps[name]
        if (this.selectedSize >= map.minSize && (!map.maxSize || this.selectedSize <= map.maxSize)) {
          maps.push(name)
        }
      }
      return maps
    },
  },

  methods: {
    onGameMode (mode) {
      this.selectedMode = mode
      if (!this.pvpMode) {
        this.onGameSize(1)
      }
    },
    onGameSize (size) {
      this.selectedSize = size
      if (this.mapsForSize.indexOf(this.selectedMap) === -1) {
        this.onMap(this.mapsForSize[0])
      }
    },
    onMap (name) {
      this.selectedMap = name
    },

    sizeLabel (size) {
      if (size === 0) {
        return '1p'
      }
      if (size > 10) {
        return `${size * 2}p`
      }
      return `${size} v ${size}`
    },

    onSubmit () {
      LobbyEvents.connect('create', { mode: this.selectedMode.name, size: this.selectedSize, map: this.selectedMap }, (data) => {
        p('create', data)
        if (data.error) {
          const errorMessage = `Unable to create game: ${data.error}`
          if (Local.TESTING) {
            console.warn(errorMessage)
          } else {
            window.alert(errorMessage)
          }
          if (data.backToLobby) {
            router.replace({ name: 'Lobby' })
          }
        } else {
          router.replace({ name: 'Join', params: { gid: data.gid } })
        }
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
.selection-container
  margin auto
  width 480px
  max-width 100%
  display flex
  flex-wrap wrap

.selection
  margin 4px
  height 56px
  flex-grow 1
  flex-basis 16%
  box-sizing border-box
  border-radius 1px

.selection
  background #ddd

.selection.selected
  background #dd6677

.mode-description
  text-align center
  margin auto
</style>
