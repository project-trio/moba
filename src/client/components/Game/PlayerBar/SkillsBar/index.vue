<template>
<div class="relative p-1">
	<SkillItem v-for="(skill, index) in skills" :key="skill.name" :index="index" :skill="skill" />
</div>
</template>

<script>
import store from '@/client/store'

import skillsData from '@/client/play/data/skills'
import retroSkillsData from '@/client/play/data/skills-retro'

import SkillItem from '@/client/components/Game/PlayerBar/SkillsBar/SkillItem'

export default {
	components: {
		SkillItem,
	},

	computed: {
		localPlayer () {
			return store.playerForId(store.state.playerId)
		},

		retro () {
			return store.state.game.retro
		},

		skills () {
			if (!this.localPlayer) {
				return []
			}
			const skills = this.retro ? retroSkillsData : skillsData
			return skills[this.localPlayer.shipName]
		},
	},
}
</script>
