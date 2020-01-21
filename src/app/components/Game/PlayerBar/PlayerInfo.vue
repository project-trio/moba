<template>
<div class="player-info">
	<div class="font-bold capitalize">{{ stats.name }}</div>
	<div>{{ healthDescription }}</div>
	<div v-if="stats.level">{{ levelProgress }}</div>
	<div>
		<span>{{ stats.dps }} dps</span>
		<span class="second">{{ stats.range }} range</span>
	</div>
	<div>
		<span>{{ stats.armor }}% armor</span>
		<span class="second">{{ stats.moveSpeed }} kph</span>
	</div>
</div>
</template>

<script>
import store from '@/app/store'

export default {
	computed: {
		levelProgress () {
			if (this.stats.levelProgress === null) {
				return `Level ${this.stats.level}`
			}
			return `${this.stats.levelProgress}% to level ${this.stats.level + 1}`
		},

		stats () {
			return store.state.selectedStats
		},

		healthDescription () {
			return this.stats.health ? `${this.stats.health} / ${this.stats.healthMax} hp` : `${this.stats.healthMax} hp`
		},
	},
}
</script>

<style lang="postcss" scoped>
.player-info {
	@apply text-sm leading-relaxed;
}

.second {
	@apply ml-1;
}
</style>
