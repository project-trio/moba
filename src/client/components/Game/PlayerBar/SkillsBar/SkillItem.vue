<template>
<div class="skill-item" @click="onSkill">
  <button class="skill-button">{{ index + 1 }}</button>
  <div>{{ name }}</div>
  <div class="description-tooltip bar-section" v-html="descriptionHtml"></div>
</div>
</template>

<script>
export default {
  props: {
    skill: Object,
    index: Number,
    level: Number,
    name: String,
    description: String,
  },

  computed: {
    descriptionHtml () {
      const rows = [`<div class="description-text">${this.description}</div>`]
      if (this.skill.duration) {
        rows.push(`<div>Duration: <span class="bold">${this.duration}</span> seconds</div>`)
      }
      if (this.skill.cooldown) {
        rows.push(`<div>Cooldown: <span class="bold">${this.cooldown}</span> seconds</div>`)
      }
      return rows.join('')
    },

    duration () {
      return this.skill.getDuration(this.level) / 10
    },
    cooldown () {
      return this.skill.getCooldown(this.level) / 10
    },
  },

  methods: {
    onSkill () {
      console.log(this.name)
    },
  },
}
</script>

<style lang="stylus">
.skill-item
  display inline-block
  margin 4px
  // box-sizing border-box

.description-tooltip
  display none
  position absolute
  height 88px
  top -88px
  left 0
  right 0
  margin 0
  text-align left

.description-text
  margin-bottom 2px

.skill-button
  padding 4px
  margin 4px
  width 80px
  height 80px
  background white
  cursor pointer
  transition transform 0.4s ease, opacity 0.4s ease
  border-radius 50%

.skill-item:hover button
  opacity 0.8
.skill-item:hover .description-tooltip
  display block

.skill-item:hover:active button
  opacity 0.5
  transform scale(0.9)
</style>
