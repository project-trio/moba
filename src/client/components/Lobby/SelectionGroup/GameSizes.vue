<template>
<selection-group>
	<button v-for="size in gameSizes" @click="onGameSize(size)" class="selection interactive" :class="{ selected: size === selectedSize }" :key="size">{{ sizeLabel(size) }}</button>
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
		bots: Boolean,
	},

	methods: {
		onGameSize (size) {
			this.$emit('onGameSize', size)
		},

		sizeLabel (size) {
			if (this.bots) {
				if (size <= 10) {
					return `${size}p`
				}
				return 'horde'
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
