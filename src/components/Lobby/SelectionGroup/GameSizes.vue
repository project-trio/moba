<template>
<SelectionGroup>
	<button v-for="size in gameSizes" :key="size" class="big interactive" :class="{ selected: size === selectedSize }" @click="$emit('select', size)">{{ sizeLabel(size) }}</button>
</SelectionGroup>
</template>

<script>
import SelectionGroup from '@/components/Lobby/SelectionGroup'

export default {
	components: {
		SelectionGroup,
	},

	props: {
		gameSizes: Array,
		selectedSize: Number,
		pvpMode: Boolean,
	},

	methods: {
		sizeLabel (size) {
			if (!this.pvpMode) {
				if (size <= 12) {
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
