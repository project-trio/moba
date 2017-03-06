<template>
<canvas id="canvas" class="inherit">
</canvas>
</template>

<script>
import start from '@/play/start'

export default {
  mounted () {
    start.init()
  },
}
</script>

<style lang="stylus" scoped>

</style>
