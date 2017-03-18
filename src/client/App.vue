<template>
  <div id="app" class="inherit">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'app'
}
</script>

<style lang="stylus">
html
  width 100%
  height 100%
body
  margin 0

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

button
  border 0
  padding 0
  outline none
  text-align center
  font-size 1.5em
  color #111110
</style>
