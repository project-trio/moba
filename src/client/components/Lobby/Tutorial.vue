<template>
<h1>
	Loading...
</h1>
</template>

<script>
import router from '@/client/router'

import LobbyEvents from '@/client/play/events/lobby'

export default {
	mounted () {
		LobbyEvents.connect('quick', { mode: 'tutorial', size: 0, map: 'tutorial' }, (response) => { //SAMPLE
			if (response.error) {
				console.error('quick', response)
			} else {
				router.push({ name: 'Join', params: { gid: response.gid } })
			}
		})
	},
}
</script>

<style lang="stylus" scoped>
</style>
