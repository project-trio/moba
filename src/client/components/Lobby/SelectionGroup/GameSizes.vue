<template>
<selection-group>
  <button v-for="size in gameSizes" @click="onGameSize(size)" class="selection interactive" :class="{ selected: size === selectedSize }">{{ sizeLabel(size) }}</button>
</selection-group>
</template>

<script>
import SelectionGroup from '@/client/components/Lobby/SelectionGroup'

export default {
  components: {
    SelectionGroup,
  },

  props: {
    selectedSize: Number,
    gameSizes: Array,
  },

  methods: {
    onGameSize (size) {
      this.$emit('onGameSize', size)
    },

    sizeLabel (size) {
      if (size === 0) {
        return '1p'
      }
      if (size > 10) {
        return `${size * 2}p`
      }
      return `${size} v ${size}`
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>
