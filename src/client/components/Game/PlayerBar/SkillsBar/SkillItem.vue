<template>
<div class="skill-item" :class="{ selected: pressing, active: activated, cooldown: cooldownTime }">
  <div class="button-content">
    <div :class="`item-circle item-circle-${indexName}`"></div>
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
      sektor: null,
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

    levelupReady () {
      return store.state.level > store.state.skills.leveled
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
        // console.log(cooldownAt, store.state.renderTime, diff)
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
        this.sektor.changeAngle(360)
      }
    },

    cooldownRemaining (remaining) {
      if (remaining >= 0) {
        const angle = 360 - Math.floor(remaining / this.cooldownDuration * 360)
        this.sektor.changeAngle(angle >= 360 ? 0 : angle)
      }
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
        store.state.skills.leveled += 1
        store.state.skills.levels.splice(this.index, 1, store.state.skills.levels[this.index] + 1)
      }
    },
  },

  mounted () {
    this.sektor = new Sektor(`.item-circle-${this.indexName}`, {
      size: 80,
      stroke: 24,
      arc: true,
      angle: this.activated ? 360 : 0,
      // sectorColor: '#aaf',
      circleColor: '#aaa',
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

.skill-item.active .Sektor-sector
  stroke #aea
.skill-item.cooldown .Sektor-sector
  stroke #88f

.skill-item .skill-button, .skill-item .item-circle
  transition transform 0.4s ease, opacity 0.4s ease

.skill-item:hover .item-circle, .skill-item.selected item-circle
  background rgba(170, 170, 170, 0.8)
.skill-item:hover .description-tooltip, .skill-item.selected .description-tooltip
  display block

.skill-item:hover:active .item-circle, .skill-item:hover:active .item-circle
  background rgba(170, 170, 170, 0.5)
.skill-item:hover:active button
  transform scale(0.9)
</style>
