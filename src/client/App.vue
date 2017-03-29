<template>
  <div id="app" class="inherit">
    <router-view></router-view>
  </div>
</template>

<script>
import store from '@/store'

const validKeyEvent = (event) => {
  if (event.repeat) {
    return false
  }
  const keyDescription = { code: event.which || event.keyCode }
  const name = event.key.toLowerCase()
  if (name === 'control' || name === 'alt' || name === 'shift' || name === 'meta') {
    keyDescription.name = null
    keyDescription.modifier = true
  } else {
    keyDescription.name = name
    keyDescription.modifier = event.altKey || event.shiftKey || event.metaKey || event.ctrlKey
  }
  return keyDescription
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
      const keyDescription = validKeyEvent(event)
      if (keyDescription) {
        store.setKeyDown(keyDescription.name, keyDescription.code, keyDescription.modifier)
      }
    },

    keyup (event) {
      const keyDescription = validKeyEvent(event)
      if (keyDescription) {
        store.setKeyUp(keyDescription.name, keyDescription.code, keyDescription.modifier)
      }
    },

    onRightClick (event) {
      event.preventDefault()
    },
  },
}
</script>

<style lang="stylus">
html
  height 100%
  width 100%

body
  margin 0
  overflow hidden
  background-color #fffffe

body, .inherit
  width inherit
  height inherit

#app
  text-align center

#app, button
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  font-weight 400
  color #111110

.scrolls
  -webkit-overflow-scrolling touch
  overflow-x hidden
  overflow-y auto
  position relative

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

button.big
  width 300px
  height 64px
  font-size 28px
  font-weight 500
  color #333
  display block
  margin 32px auto
  border-radius 4px

button.interactive:hover
  opacity 0.8
button.interactive:hover:active
  opacity 0.5

.animated, .interactive
  transition 0.3s ease

input
  padding 0 6px
  margin 0
  border 0
  box-sizing border-box
  font-size 1.25em
  font-weight 400

.team-1
  color #5599cc
.team-2
  color #dd6677

.faint
  color #aaa
.note
  font-style italic
</style>
