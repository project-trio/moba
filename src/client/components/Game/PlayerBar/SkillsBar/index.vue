<template>
<div class="skills-bar">
  <skill-item v-for="(skill, index) in skills" :index="index" :skill="skill" :level="skillLevels[index]" :key="skill.name"></skill-item>
</div>
</template>

<script>
import CommonSkills from 'common/skills'

import SkillItem from '@/components/Game/PlayerBar/SkillsBar/SkillItem'

export default {
  components: {
    SkillItem,
  },

  computed: {
    shipName () {
      return this.$root.$data.state.shipName
    },

    skillLevels () {
      return this.$root.$data.state.skills.levels
    },

    skills () {
      return this.shipName ? CommonSkills[this.shipName] : null
    },
  },
}
</script>

<style lang="stylus" scoped>
.skills-bar
  position relative
  padding 4px
</style>
