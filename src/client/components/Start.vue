<template>
<div class="start">
  <router-link :to="{ name: 'Game' }" tag="button" class="big">play now</router-link>
  <router-link :to="{ name: 'Lobby' }" tag="button" class="big">enter lobby</router-link>
</div>
</template>

<script>
export default {

}
</script>

<style lang="stylus" scoped>
button
  width 256px
  height 64px
  font-size 28px
  font-weight 500
  color #333
  display block
  margin 32px auto
</style>
