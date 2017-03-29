<template>
<div class="lobby-create inherit scrolls">
  <h1>create game</h1>
  <div v-if="loading">
  </div>
  <div v-else>
    <h3>game size:</h3>
    <div class="selection-container">
      <button v-for="size in gameSizes" @click="onGameSize(size)" class="selection interactive" :class="{ selected: size === selectedSize }">{{ sizeLabel(size) }}</button>
    </div>
    <h3>map:</h3>
    <div class="selection-container">
      <button v-for="map in maps" @click="onMap(map.name)" class="selection interactive" :class="{ selected: map.name === selectedMap }">{{ map.name }}</button>
    </div>
    <button @click="onSubmit" class="big interactive">confirm</button>
  </div>
</div>
</template>

<script>
import router from '@/router'

import CommonConsts from 'common/constants'

import Local from '@/play/local'

import LobbyEvents from '@/play/events/lobby'

export default {
  data () {
    return {
      loading: false,
      selectedSize: 0,
      selectedMap: 'standard',
      maps: [
        { name: 'mini', min: 0, max: 3 },
        { name: 'standard', min: 2, max: 6 },
        { name: 'large', min: 5, max: 9001 },
      ],
    }
  },

  computed: {
    gameSizes () {
      return CommonConsts.GAME_SIZES
    },
  },

  methods: {
    sizeLabel (size) {
      if (size === 0) {
        return '1p'
      }
      if (size > 10) {
        return `${size * 2}p`
      }
      return `${size} v ${size}`
    },

    onGameSize (size) {
      this.selectedSize = size
    },

    onMap (name) {
      this.selectedMap = name
    },

    onSubmit () {
      LobbyEvents.connect('create', { size: this.selectedSize, map: this.selectedMap }, (data) => {
        console.log('create', data)
        if (data.error) {
          const errorMessage = `Unable to create game: ${data.error}`
          if (Local.TESTING) {
            console.log(errorMessage)
          } else {
            window.alert(errorMessage)
          }
          router.replace({ name: 'Lobby' })
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
</style>
