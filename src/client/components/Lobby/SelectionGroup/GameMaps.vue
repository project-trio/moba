<template>
<selection-group>
	<button v-for="map in mapsForSize" @click="onMap(map)" class="selection interactive" :class="{ selected: map === selectedMap }" :key="map">{{ map }}</button>
</selection-group>
</template>

<script>
import commonMaps from '@/common/maps'

import SelectionGroup from '@/client/components/Lobby/SelectionGroup'

export default {
	components: {
		SelectionGroup,
	},

	props: {
		selectedSize: Number,
		selectedMap: String,
		bots: Boolean,
	},

	computed: {
		mapsForSize () {
			const maps = []
			for (const name in commonMaps) {
				const map = commonMaps[name]
				if (this.selectedSize >= map.minSize && this.selectedSize <= map.maxSize) {
					maps.push(name)
				}
			}
			return maps
		},
	},

	watch: {
		selectedSize: {
			immediate: true,
			handler () {
				if (this.mapsForSize.indexOf(this.selectedMap) === -1) {
					this.onMap(this.mapsForSize[0])
				}
			},
		},
	},

	methods: {
		onMap (map) {
			this.$emit('select', map)
		},
	},
}
</script>

<style lang="stylus" scoped>

</style>
