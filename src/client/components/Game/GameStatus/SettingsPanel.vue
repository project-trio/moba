<template>
<div class="settings-panel bar-section panel">
	<h1>Settings</h1>
	<div class="settings">
		<div class="setting">
			<button class="interactive" @click="onFps">{{ fpsDescription }}</button>
			<div class="label">FPS Cap</div>
		</div>
		<div class="setting">
			<button class="interactive" @click="onResolution">{{ fullResolution ? 'Full' : 'Low' }}</button>
			<div class="label">Resolution</div>
		</div>
		<div class="setting">
			<button class="interactive" @click="onShadows">{{ shadows === 0 ? 'Off' : shadows === 1 ? 'Low' : 'High' }}</button>
			<div class="label">Shadows</div>
		</div>
		<!-- <div class="setting">
			<button @click="onAntialias" class="interactive">{{ antialias ? 'on' : 'off' }}</button>
			<div class="label">Antialias</div>
		</div> -->
		<div class="setting">
			<button class="interactive" @click="onPerspective">{{ perspective ? '3D' : '2D' }}</button>
			<div class="label">Perspective</div>
		</div>
		<div class="setting">
			<button class="interactive" @click="onOutline">{{ outline ? 'On' : 'Off' }}</button>
			<div class="label">Outline effect</div>
		</div>
		<div class="setting">
			<button class="interactive" @click="onSoundVolume">{{ soundVolume ? `${soundVolume}%` : 'Off ' }}</button>
			<div class="label">Sound</div>
		</div>
	</div>
</div>
</template>

<script>
import { TICK_DURATION } from '@/common/constants'

import store from '@/client/store'

export default {
	computed: {
		fpsDescription () {
			return this.fpsCap ? 1000 / TICK_DURATION : 60
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

		outline () {
			return store.state.settings.outline
		},

		soundVolume () {
			return store.state.settings.soundVolume
		},
	},

	methods: {
		onFps () {
			store.applySetting('fpsCap', !this.fpsCap, null)
		},

		onResolution () {
			store.applySetting('fullResolution', !this.fullResolution, false)
		},

		onShadows () {
			store.applySetting('shadows', (this.shadows + 1) % 3, true)
		},

		// onAntialias () {
		// 	store.applySetting('antialias', !this.antialias, true)
		// },

		onPerspective () {
			store.applySetting('perspective', !this.perspective, false)
		},

		onOutline () {
			store.applySetting('outline', !this.outline, false)
		},

		onSoundVolume () {
			store.applySetting('soundVolume', (this.soundVolume + 50) % 150, false)
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
	width 96px
	height 44px
	margin-bottom 2px
	border-radius 6px
	pointer-events auto
</style>
