<template>
<div class="skill-item" :class="{ selected: pressing, active: activated, cooldown: cooldownTime }">
  <div class="button-content">
    <div :class="`item-circle cooldown-ring cooldown-ring-${indexName}`"></div>
    <div :class="`item-circle level-ring-${indexName}`"></div>
    <button @click="onSkill" class="skill-button">{{ indexName }}</button>
    <div>{{ skill.name }}</div>
    <div v-if="levelupReady" @click="onLevelup" class="button-levelup interactive">
      ⬆︎+1
    </div>
  </div>
  <div class="description-tooltip bar-section" v-html="descriptionHtml"></div>
</div>
</template>

<script>
import store from '@/store'

import Sektor from '@/play/external/sektor'

import Bridge from '@/play/bridge'

export default {
  props: {
    skill: Object,
    index: Number,
    level: Number,
  },

  data () {
    return {
      cooldownRing: null,
      levelRing: null,
      submittedLevelup: true,
    }
  },

  computed: {
    indexName () {
      return `${this.index + 1}`
    },

    descriptionHtml () {
      const rows = [`<div class="description-text">${this.skill.description}</div>`]
      if (this.skill.duration) {
        rows.push(`<div>Duration: <span class="bold">${this.activeDuration / 1000}</span> seconds</div>`)
      }
      if (this.skill.cooldown) {
        rows.push(`<div>Cooldown: <span class="bold">${this.cooldownDuration / 1000}</span> seconds</div>`)
      }
      return rows.join('')
    },

    level () {
      this.submittedLevelup = false
      return store.state.skills.levels[this.index]
    },
    levelupProgress () {
      return this.level / 10
    },

    levelupReady () {
      return !this.submittedLevelup && this.levelupProgress < 1 && store.state.level > store.state.skills.leveled
    },

    activeDuration () {
      return this.skill.getDuration(this.level) * 100
    },
    cooldownDuration () {
      return this.skill.getCooldown(this.level) * 100
    },

    activated () {
      return store.state.skills.actives[this.index]
    },
    cooldownTime () {
      return this.activated ? 0 : store.state.skills.cooldowns[this.index]
    },
    cooldownRemaining () {
      const cooldownAt = this.cooldownTime
      if (cooldownAt > 0) {
        const diff = cooldownAt - store.state.renderTime
        if (diff >= 0) {
          return diff
        }
        store.state.skills.cooldowns.splice(this.index, 1, 0)
      }
      return 0
    },

    pressing () {
      const currentKey = store.state.key.lastPress
      return currentKey === this.indexName
    },
    pressed () {
      return store.state.key.pressed
    },
  },

  watch: {
    pressed (key) {
      if (key.name === this.indexName) {
        if (key.modifier) {
          this.onLevelup()
        } else {
          this.onSkill()
        }
      }
    },

    activated (active) {
      if (active) {
        this.cooldownRing.changeAngle(360)
      }
    },

    cooldownRemaining (remaining) {
      if (remaining >= 0) {
        const angle = 360 - Math.floor(remaining / this.cooldownDuration * 360)
        this.cooldownRing.changeAngle(angle >= 360 ? 0 : angle)
      }
    },

    levelupProgress (progress) {
      this.levelRing.animateTo(Math.floor(progress * 360))
    }
  },

  methods: {
    onSkill () {
      if (this.skill.target === 0) {
        return
      }
      if (this.skill.target === 1) {
        Bridge.emit('action', { skill: this.index, target: null })
      }
    },

    onLevelup () {
      if (this.levelupReady) {
        this.submittedLevelup = true
        Bridge.emit('action', { skill: this.index, level: true })
      }
    },
  },

  mounted () {
    this.cooldownRing = new Sektor(`.cooldown-ring-${this.indexName}`, {
      size: 80,
      stroke: 40,
      arc: true,
      angle: this.activated ? 360 : 0,
      // sectorColor: '#aaf',
      circleColor: '#aaa',
      fillCircle: true,
    })
    this.levelRing = new Sektor(`.level-ring-${this.indexName}`, {
      size: 82,
      stroke: 6,
      arc: true,
      angle: Math.floor(this.levelupProgress * 360),
      sectorColor: '#8e9',
      circleColor: 'transparent',
      fillCircle: true,
    })
  },
}
</script>

<style lang="stylus">
.skill-item
  display inline-block
  margin 4px

.skill-item .button-content
  position relative
  z-index 1

.skill-item .Sektor
  position absolute
  top 0
  left 0
  z-index 10

.skill-item .description-tooltip
  display none
  position absolute
  height 88px
  top -88px
  left 0
  right 0
  margin 0
  text-align left
  z-index 0

.skill-item .description-text
  margin-bottom 2px

.skill-item .skill-button
  padding 4px
  margin 4px
  width 80px
  height 80px
  background transparent
  z-index 100
  position relative
  cursor pointer
  border-radius 50%

.skill-item .button-levelup
  position absolute
  top -24px
  left 1px
  right 1px
  background #d55
  height 64px
  z-index 1

.skill-item .button-levelup:hover
  opacity 0.8

.skill-item.active .cooldown-ring .Sektor-sector
  stroke #666
.skill-item.cooldown .cooldown-ring .Sektor-sector
  stroke #66a

.skill-item .skill-button, .skill-item .cooldown-ring
  transition transform 0.4s ease, opacity 0.4s ease

.skill-item:hover .cooldown-ring, .skill-item.selected cooldown-ring
  background rgba(170, 170, 170, 0.8)
.skill-item:hover .description-tooltip, .skill-item.selected .description-tooltip
  display block

.skill-item:hover:active .cooldown-ring, .skill-item:hover:active .cooldown-ring
  background rgba(170, 170, 170, 0.5)
.skill-item:hover:active button
  transform scale(0.9)
</style>
