<template>
<div class="skill-item" @click="onSkill">
  <button class="skill-button">{{ index + 1 }}</button>
  <div>{{ name }}</div>
  <div>{{ description }}</div>
</div>
</template>

<script>
export default {
  props: {
    index: Number,
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
  display inline-block
  margin 4px
  // box-sizing border-box

.skill-button
  padding 4px
  margin 4px
  width 80px
  height 80px
  background white
  cursor pointer
  transition transform 0.4s ease, opacity 0.4s ease
  border-radius 50%

.skill-item:hover
  opacity 0.8

.skill-item:hover:active
  opacity 0.5
  transform scale(0.9)
</style>
