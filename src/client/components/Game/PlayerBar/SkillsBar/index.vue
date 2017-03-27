<template>
<div class="skills-bar">
  <skill-item v-for="(skill, index) in skills" :index="index" :skill="skill" :level="skillLevels[index]" :key="skill.name"></skill-item>
</div>
</template>

<script>
import store from '@/store'

import Local from '@/play/local'

import SkillItem from '@/components/Game/PlayerBar/SkillsBar/SkillItem'

export default {
  components: {
    SkillItem,
  },

  computed: {
    skillLevels () {
      return this.$root.$data.state.skills.levels
    },

    skills () {
      return store.state.game.running ? Local.player.unit.skills.data : null
    },
  },
}
</script>

<style lang="stylus" scoped>
.skills-bar
  position relative
  padding 4px
</style>
