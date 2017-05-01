<template>
<div class="lobby-create inherit scrolls">
  <h1>create game</h1>
  <div v-if="loading">
  </div>
  <div v-else>
    <h3>game type:</h3>
    <selection-group>
      <button v-for="mode in gameModes" @click="onGameMode(mode)" class="selection interactive" :class="{ selected: mode === selectedMode }">{{ mode.name }}</button>
      <div class="mode-description">
        {{ this.selectedMode.description }}
      </div>
    </selection-group>
    <h3>game size:</h3>
    <game-sizes @onGameSize="onGameSize" :gameSizes="gameSizes" :selectedSize="selectedSize"></game-sizes>
    <h3>map:</h3>
    <selection-group>
      <button v-for="map in mapsForSize" @click="onMap(map)" class="selection interactive" :class="{ selected: map === selectedMap }">{{ map }}</button>
    </selection-group>
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

import SelectionGroup from '@/components/Lobby/SelectionGroup'
import GameSizes from '@/components/Lobby/SelectionGroup/GameSizes'

export default {
  components: {
    GameSizes,
    SelectionGroup,
  },

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

    onSubmit () {
      LobbyEvents.connect('create', { mode: this.selectedMode.name, size: this.selectedSize, map: this.selectedMap }, (data) => {
        if (data.error) {
          const errorMessage = `Unable to create game: ${data.error}`
          if (Local.TESTING) {
            warn(errorMessage)
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
.mode-description
  text-align center
  margin auto
</style>
