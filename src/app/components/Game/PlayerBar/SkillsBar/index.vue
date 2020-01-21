<template>
<div class="relative p-1">
	<SkillItem v-for="(skill, index) in skills" :key="skill.name" :index="index" :skill="skill" />
</div>
</template>

<script>
import store from '@/app/store'

import skillsData from '@/play/data/skills'
import retroSkillsData from '@/play/data/skills-retro'

import SkillItem from '@/app/components/Game/PlayerBar/SkillsBar/SkillItem'

export default {
	components: {
		SkillItem,
	},

	computed: {
		localPlayer () {
			const user = store.state.signin.user
			return user && store.playerForId(user.id)
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
