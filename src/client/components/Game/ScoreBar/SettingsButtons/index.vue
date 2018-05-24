<template>
<div class="settings-buttons">
	<button @click="onHelp" class="interactive">?</button>
	<button @click="onFullscreen" class="interactive">⤢</button>
	<button @click="onSettings" class="interactive">⚙</button>
</div>
</template>

<script>
import store from '@/client/store'

import fullscreen from '@/client/play/external/fullscreen.js'

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

<style lang="stylus" scoped>
.settings-buttons
	position absolute
	display flex
	right 0
	top 0
	margin 0
	border-radius 0 0 0 4px !important
	// height 80px
	padding 4px

button
	padding 0
	font-size 1.1em
	width 32px
	height 32px
	margin 4px
	border-radius 2px
</style>
