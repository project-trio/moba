<template>
<h1>
	Loading tutorial...
</h1>
</template>

<script>
import LobbyEvents from '@/play/events/lobby'

export default {
	mounted () {
		LobbyEvents.connect('quick', { mode: 'tutorial', size: 0, map: 'tutorial' })
	},
}
</script>
