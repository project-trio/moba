<template>
<div class="start">
	<h1>welcome to moba!</h1>
	<div v-if="loading">
		...
	</div>
	<div v-else>
		<input v-model.trim="enteringName" placeholder="enter a username" class="text-center w-64 h-16 text-2xl font-light border" @keyup.enter="onEnterName">
		<p class="text-note">note: there is no account system yet, just choose a name of your liking.</p>
	</div>
</div>
</template>

<script>
import router from '@/client/router'
import store from '@/client/store'

import Events from '@/client/play/events'

export default {
	data () {
		return {
			enteringName: this.username,
		}
	},

	computed: {
		loading () {
			return store.state.signin.loading
		},

		username () {
			return store.state.signin.username
		},
	},

	methods: {
		onEnterName () {
			store.setName(this.enteringName)
			Events.init()
			router.replace({ name: 'Lobby' })
		},
	},
}
</script>
