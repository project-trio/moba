<template>
<div class="inherit">
  <canvas id="canvas" class="inherit"></canvas>
  <player-bar></player-bar>
</div>
</template>

<script>
import PlayerBar from '@/components/Game/PlayerBar'

import start from '@/play/start'

export default {
  components: {
    PlayerBar,
  },

  mounted () {
    start.init()
  },
}
</script>

<style lang="stylus" scoped>

</style>
