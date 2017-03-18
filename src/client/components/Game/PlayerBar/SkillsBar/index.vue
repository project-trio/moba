<template>
<div class="skills-bar">
  <skill-item v-for="skill in skills" :name="skill.name" :description="skill.description" :key="skill.name"></skill-item>
</div>
</template>

<script>
import SkillItem from '@/components/Game/PlayerBar/SkillsBar/SkillItem'

// import Local from '@/play/local'
import skillsData from '@/play/data/skills'

export default {
  components: {
    SkillItem,
  },

  computed: {
    skills () {
      return skillsData['pewpew']
    },
  },
}
</script>

<style lang="stylus" scoped>
// .skills-bar
</style>
