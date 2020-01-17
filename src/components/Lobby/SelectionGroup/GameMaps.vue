<template>
<SelectionGroup>
	<button v-for="map in mapsForSize" :key="map" class="big interactive" :class="{ selected: map === selectedMap }" @click="onMap(map)">{{ map }}</button>
</SelectionGroup>
</template>

<script>
import mapsData from '@/play/data/maps'

import SelectionGroup from '@/components/Lobby/SelectionGroup'

export default {
	components: {
		SelectionGroup,
	},

	props: {
		selectedSize: Number,
		selectedMap: String,
	},

	computed: {
		mapsForSize () {
			const maps = []
			for (const name in mapsData) {
				const map = mapsData[name]
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
