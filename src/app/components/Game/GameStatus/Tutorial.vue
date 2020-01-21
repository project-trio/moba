<template>
<div class="bar-section  pointer-events-none">
	<h1>{{ tutorial.title }}</h1>
	<p>{{ tutorial.body }}</p>
	<div class="relative">
		<button v-if="tutorial.continue" class="panel-button interactive" @click="onContinue">Continue</button>
		<button v-if="tutorial.skippable" class="interactive  absolute right-0 h-touch px-2 text-gray-100" @click="onSkip">Skip tutorial</button>
	</div>
</div>
</template>

<script>
import router from '@/app/router'

import Tutorial from '@/play/game/tutorial'

export default {
	props: {
		tutorial: Object,
	},

	methods: {
		onContinue () {
			Tutorial.advance()
		},

		onSkip () {
			Tutorial.finish()
			router.replace({ name: 'Lobby' })
		},
	},
}
</script>
