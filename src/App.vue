<template>
<div id="app" class="wh-full text-center">
	<router-view />
</div>
</template>

<script>
import store from '@/store'
import util from '@/helpers/util'

const KEY_TAB = 9
const KEY_ESCAPE = 27

const validKeyEvent = (event) => {
	const keyCode = event.which || event.keyCode
	if (keyCode === KEY_TAB || keyCode === KEY_ESCAPE) { //TODO distinguish skills while typing
		event.preventDefault()
	}
	if (event.repeat) {
		return false
	}
	const keyDescription = { code: keyCode }
	if (keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91 || keyCode === 93) {
		keyDescription.ignore = true
		keyDescription.modifier = true
	} else {
		keyDescription.ignore = event.metaKey
		keyDescription.modifier = event.altKey || event.shiftKey || event.metaKey || event.ctrlKey
	}
	return keyDescription
}

export default {
	data () {
		return {
			countdownInterval: null,
		}
	},

	created () {
		util.addListener(window, 'keydown', this.keydown, true)
		util.addListener(window, 'keyup', this.keyup, true)
		util.addListener(window, 'contextmenu', this.onRightClick, true)

		this.countdownInterval = window.setInterval(() => {
			store.state.minuteTime = util.seconds()
		}, 60 * 1000)
	},

	destroyed () {
		util.removeListener(window, 'keydown', this.keydown, true)
		util.removeListener(window, 'keyup', this.keyup, true)
		util.removeListener(window, 'contextmenu', this.onRightClick, true)

		if (this.countdownInterval) {
			window.clearInterval(this.countdownInterval)
			this.countdownInterval = null
		}
	},

	methods: {
		keydown (event) {
			const keyDescription = validKeyEvent(event)
			if (keyDescription) {
				store.setKeyDown(keyDescription)
			}
		},

		keyup (event) {
			const keyDescription = validKeyEvent(event)
			if (keyDescription) {
				store.setKeyUp(keyDescription)
			}
		},

		onRightClick (event) {
			event.preventDefault()
		},
	},
}
</script>

<style lang="postcss">
@import 'assets/styles/tailwind.postcss';

body {
	@apply overflow-hidden;
	background-color: #fffffe;
	-webkit-touch-callout: none;
}

html, body {
	@apply wh-full;
}

#app, button {
	@apply antialiased;
	color: #111110;
}

h1 {
	@apply text-5xl;
}
h2 {
	@apply text-3xl;
}
h3 {
	@apply text-2xl;
}
h4 {
	@apply text-xl;
}

.scrolls {
	@apply relative scrolling-touch overflow-x-hidden overflow-y-auto;
}

.interactive, button {
	@apply cursor-pointer;
}

.panel-button {
	@apply h-touch px-2 bg-gray-500 rounded-lg font-semibold pointer-events-auto;
}

button {
	@apply outline-none !important;
	&.big {
		@apply block mx-auto px-2 w-64 text-xl max-w-full h-14 rounded  bg-gray-300;
	}
	&.outlined {
		@apply bg-transparent border;
		border-width: 2px;
	}
	&.interactive:hover {
		@apply opacity-75;
		&:active {
			@apply opacity-50;
		}
	}
}

.animated, .interactive {
	transition: 0.3s ease;
}

.team-1 {
	color: #5599cc;
	border-color: #5599cc;
}
.team-2 {
	color: #dd6677;
	border-color: #dd6677;
}
.team-1-bg {
	background-color: #5599cc;
}
.team-2-bg {
	background: #dd6677;
}
.team-1-border {
	border: 1px solid #5599cc;
}
.team-2-border {
	border: 1px solid #dd6677;
}

.text-secondary {
	@apply text-gray-500;
}
.text-note {
	@apply italic text-gray-500;
}

.bar-section {
	@apply pointer-events-auto;
	background: rgba(80, 80, 80, 0.85);
}
</style>
