<template>
<div class="lobby-create">
  <h1>Create game</h1>
  <div v-if="loading">
  </div>
  <div v-else>
    <h3>Game size:</h3>
    <div class="game-size-container">
      <button v-for="index in 5" ref="gameSize" @click="onGameSize(index)" class="game-size interactive" :class="{ selected: index === selectedIndex }">{{ index }} v {{ index }}</button>
    </div>
    <button @click="onSubmit" class="big interactive">confirm</button>
  </div>
</div>
</template>

<script>
import router from '@/router'

import LobbyEvents from '@/play/events/lobby'

export default {
  data () {
    return {
      loading: false,
      selectedIndex: 1,
    }
  },

  methods: {
    onGameSize (index) {
      this.selectedIndex = index
    },

    onSubmit () {
      LobbyEvents.connect('create', { size: this.selectedIndex }, (data) => {
        console.log('create', data)
        if (data.error) {
          window.alert(`Unable to create game: ${data.error}`)
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
.lobby-create
  color #111

.game-size-container
  margin auto
  width 480px
  height 64px
  max-width 100%
  display flex
  // align-items center
  // align-content center

.game-size
  margin 4px
  flex-grow 1
.game-size.selected
  background #0a7
</style>
