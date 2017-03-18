<template>
<div class="skill-item" @click="onSkill">
  <div>{{ name }}</div>
  <div>{{ description }}</div>
</div>
</template>

<script>
export default {
  props: {
    name: String,
    description: String,
  },

  methods: {
    onSkill () {
      console.log(this.name)
    },
  },
}
</script>

<style lang="stylus" scoped>
.skill-item
  box-sizing border-box
  padding 4px
  margin 8px
  width 80px
  height 80px
  display inline-block
  background white
  cursor pointer
  transition transform 0.4s ease, opacity 0.4s ease

.skill-item:hover
  opacity 0.8

.skill-item:hover:active
  opacity 0.5
  transform scale(0.9)
</style>
