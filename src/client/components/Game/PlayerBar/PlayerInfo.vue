<template>
<div class="player-info">
	<div class="bold capitalize">{{ stats.name }}</div>
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
import store from '@/client/store'

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

<style lang="stylus" scoped>
.player-info
	font-size 14px
	line-height 22px

.second
	margin-left 4px
</style>
