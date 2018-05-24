<template>
  <div id="app" class="inherit">
    <router-view></router-view>
  </div>
</template>

<script>
import store from '@/client/store'
import util from '@/client/helpers/util'

const KEY_TAB = 9
const KEY_ESCAPE = 27

const validKeyEvent = (event) => {
  const keyCode = event.which || event.keyCode
  if (keyCode === KEY_TAB || keyCode === KEY_ESCAPE) { //TODO distinguish skills while typing
    event.preventDefault()
  }
  if (event.repeat) {
    return false
  }
  const keyDescription = { code: keyCode }
  if (keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91 || keyCode === 93) {
    keyDescription.ignore = true
    keyDescription.modifier = true
  } else {
    keyDescription.name = name
    keyDescription.modifier = event.altKey || event.shiftKey || event.metaKey || event.ctrlKey
  }
  return keyDescription
}

export default {
  data () {
    return {
      countdownInterval: null,
    }
  },

  created () {
    util.addListener(window, 'keydown', this.keydown, true)
    util.addListener(window, 'keyup', this.keyup, true)
    util.addListener(window, 'contextmenu', this.onRightClick, true)

    this.countdownInterval = window.setInterval(() => {
      store.state.minuteTime = util.seconds()
    }, 60 * 1000)
  },

  destroyed () {
    util.removeListener(window, 'keydown', this.keydown, true)
    util.removeListener(window, 'keyup', this.keyup, true)
    util.removeListener(window, 'contextmenu', this.onRightClick, true)

    if (this.countdownInterval) {
      window.clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  },

  methods: {
    keydown (event) {
      const keyDescription = validKeyEvent(event)
      if (keyDescription) {
        store.setKeyDown(keyDescription.ignore, keyDescription.code, keyDescription.modifier, event)
      }
    },

    keyup (event) {
      const keyDescription = validKeyEvent(event)
      if (keyDescription) {
        store.setKeyUp(keyDescription.ignore, keyDescription.code, keyDescription.modifier, event)
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
  -webkit-touch-callout none

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
  border-color #5599cc
.team-2
  color #dd6677
  border-color #dd6677
.team-1-bg
  background #5599cc
.team-2-bg
  background #dd6677
.team-1-border
  border 1px solid #5599cc
.team-2-border
  border 1px solid #dd6677

.faint
  color #aaa
.note
  font-style italic
</style>
