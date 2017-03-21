<template>
  <div id="app" class="inherit">
    <router-view></router-view>
  </div>
</template>

<script>
import store from '@/store'

const validKeyEvent = (event) => {
  if (event.key == null || event.repeat || event.altKey || event.shiftKey || event.metaKey || event.ctrlKey) {
    return false
  }
  const name = event.key.toLowerCase()
  return name !== 'tab'
}

export default {

  created () {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
  },

  destroyed () {
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
  },

  methods: {
    keydown (event) {
      if (validKeyEvent(event)) {
        store.setKeyDown(event.key)
      }
    },

    keyup (event) {
      if (validKeyEvent(event)) {
        store.setKeyUp(event.key)
      }
    },
  },
}
</script>

<style lang="stylus">
body
  margin 0
  overflow hidden

.inherit
  width inherit
  height inherit

#app
  text-align center
  color #fffffe

#app, button
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  font-weight 400

body, .inherit
  width inherit
  height inherit

.interactive, button
  cursor pointer

.bold
  font-weight 600

button
  border 0
  padding 0
  outline none
  text-align center
  font-size 1.5em
  color #111110
</style>
