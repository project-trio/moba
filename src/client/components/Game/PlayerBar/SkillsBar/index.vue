<template>
<div class="skills-bar">
  <skill-item v-for="(skill, index) in skills" :index="index" :skill="skill" :key="skill.name"></skill-item>
</div>
</template>

<script>
import store from '@/store'

import skillsData from '@/play/data/skills'

import Local from '@/play/local'

import SkillItem from '@/components/Game/PlayerBar/SkillsBar/SkillItem'

export default {
  components: {
    SkillItem,
  },

  computed: {

    localPlayer () {
      return store.state.game.players[Local.playerId]
    },
    skills () {
      return Local.unit ? Local.unit.skills.data : (this.localPlayer && skillsData[this.localPlayer.shipName])
    },
  },
}
</script>

<style lang="stylus" scoped>
.skills-bar
  position relative
  padding 4px
</style>
