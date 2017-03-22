<template>
  <div id="app" class="inherit">
    <router-view></router-view>
  </div>
</template>

<script>
import store from '@/store'

const validKeyEvent = (event) => {
  const name = event.key.toLowerCase()
  if (event.repeat || name === 'control' || name === 'alt' || name === 'shift' || name === 'meta' || name === 'tab') {
    return false
  }
  return name
}

export default {

  created () {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
    window.addEventListener('contextmenu', this.onRightClick)
  },

  destroyed () {
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
    window.removeEventListener('contextmenu', this.onRightClick)
  },

  methods: {
    keydown (event) {
      const name = validKeyEvent(event)
      if (name) {
        store.setKeyDown(name, event.altKey || event.shiftKey || event.metaKey || event.ctrlKey)
      }
    },

    keyup (event) {
      const name = validKeyEvent(event)
      if (name) {
        store.setKeyUp(name, event.altKey || event.shiftKey || event.metaKey || event.ctrlKey)
      }
    },

    onRightClick (event) {
      event.preventDefault()
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
  color #111110
  font-size 1.5em

input
  padding 0 6px
  margin 0
  border 0
  box-sizing border-box
  font-size 1.25em
  font-weight 400
</style>
