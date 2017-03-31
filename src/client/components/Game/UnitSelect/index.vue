<template>
<div class="unit-select">
<div class="content">
  {{ renderTime }}
</div>
</div>
</template>

<script>
import store from '@/store'

// import Local from '@/play/local'

export default {
  mounted () {
  },

  destroyed () {
  },

  computed: {
    renderTime () {
      return Math.round(store.state.game.renderTime / 1000)
    },
  },
}
</script>

<style lang="stylus" scoped>
.unit-select
  position absolute
  top 0
  left 0
  right 0
  bottom 0
  width 100%
  height 100%
  margin auto
  // padding 32px
  box-sizing border-box

.content
  background rgba(255, 255, 255, 0.75)
  width 100%
  height 100%
</style>
