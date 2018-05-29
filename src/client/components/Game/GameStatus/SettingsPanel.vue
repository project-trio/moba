<template>
<div class="settings-panel bar-section panel">
	<h1>Settings</h1>
	<div class="settings">
		<div class="setting">
			<button @click="onFps" class="interactive">{{ fpsDescription }}</button>
			<div class="label">FPS Cap</div>
		</div>
		<div class="setting">
			<button @click="onResolution" class="interactive">{{ fullResolution ? 'full' : 'low' }}</button>
			<div class="label">Resolution</div>
		</div>
		<div class="setting">
			<button @click="onShadows" class="interactive">{{ shadows === 0 ? 'off' : shadows === 1 ? 'low' : 'high' }}</button>
			<div class="label">Shadows</div>
		</div>
		<!-- <div class="setting">
			<button @click="onAntialias" class="interactive">{{ antialias ? 'on' : 'off' }}</button>
			<div class="label">Antialias</div>
		</div> -->
		<div class="setting">
			<button @click="onPerspective" class="interactive">{{ perspective ? '3D' : '2D' }}</button>
			<div class="label">Perspective</div>
		</div>
	</div>
</div>
</template>

<script>
import store from '@/client/store'

import Local from '@/client/play/local'

export default {
	computed: {
		fpsDescription () {
			return this.fpsCap ? 1000 / (Local.tickDuration || 50) : 60
		},

		fpsCap () {
			return store.state.settings.fpsCap
		},

		fullResolution () {
			return store.state.settings.fullResolution
		},

		shadows () {
			return store.state.settings.shadows
		},

		antialias () {
			return store.state.settings.antialias
		},

		perspective () {
			return store.state.settings.perspective
		},
	},

	methods: {
		onFps () {
			store.applySetting('fpsCap', !this.fpsCap, true)
		},

		onResolution () {
			store.applySetting('fullResolution', !this.fullResolution, true)
		},

		onShadows () {
			store.applySetting('shadows', (this.shadows + 1) % 3, true)
		},

		// onAntialias () {
		// 	store.applySetting('antialias', !this.antialias, true)
		// },

		onPerspective () {
			store.applySetting('perspective', !this.perspective, true)
		},
	},
}
</script>

<style lang="stylus" scoped>
.settings-panel
	pointer-events none

.settings
	display flex
	flex-wrap wrap
	justify-content center
.setting
	margin 12px
	// width 50%

button
	width 88px
	height 44px
	margin-bottom 2px
	border-radius 6px
	pointer-events auto
</style>
