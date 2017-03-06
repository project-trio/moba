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
  color #2c3e50

#app, button
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale

body, .inherit
  width inherit
  height inherit
</style>
