<template>
<div class="skills-bar">
  <skill-item v-for="(skill, index) in skills" :index="index" :name="skill.name" :description="skill.description" :key="skill.name"></skill-item>
</div>
</template>

<script>
import SkillItem from '@/components/Game/PlayerBar/SkillsBar/SkillItem'

import skillsData from '@/play/data/skills'

export default {
  components: {
    SkillItem,
  },

  computed: {
    shipName () {
      return this.$root.$data.state.shipName
    },

    skills () {
      return this.shipName ? skillsData[this.shipName] : null
    },
  },
}
</script>

<style lang="stylus" scoped>
.skills-bar
  padding 4px
</style>
