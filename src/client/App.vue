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
