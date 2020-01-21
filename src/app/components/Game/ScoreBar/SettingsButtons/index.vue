<template>
<div class="absolute top-0 right-0 p-1 rounded-bl  flex ">
	<button class="interactive" @click="onHelp">?</button>
	<button class="interactive" @click="onSettings">⚙</button>
	<button class="interactive" @click="onFullscreen">⤢</button>
</div>
</template>

<script>
import store from '@/app/store'

import fullscreen from '@/play/external/fullscreen.js'

export default {
	methods: {
		togglePanel (name) {
			store.state.game.showPanel = store.state.game.showPanel !== name ? name : null
		},

		onHelp () {
			this.togglePanel('help')
		},

		onFullscreen () {
			this.togglePanel(null)
			fullscreen.toggle()
		},

		onSettings () {
			this.togglePanel('settings')
		},
	},
}
</script>

<style lang="postcss" scoped>
button {
	@apply wh-8 m-1 p-0 rounded-sm text-xl;
}
</style>
