<template>
<div class="inherit">
  <canvas id="canvas" class="inherit"></canvas>
  <player-bar></player-bar>
</div>
</template>

<script>
import PlayerBar from '@/components/Game/PlayerBar'

import Local from '@/play/local'

import Loop from '@/play/render/loop'

export default {
  components: {
    PlayerBar,
  },

  mounted () {
    Local.game.start()
    Loop.start()
  },
}
</script>

<style lang="stylus" scoped>

</style>
