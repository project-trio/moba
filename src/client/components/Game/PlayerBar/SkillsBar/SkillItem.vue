<template>
<div class="skill-item" :class="{ selected: !disabled && isActiveSkill, disabled: disabled, cooldown: cooldownTime, hasLevelup: showingLevelupIndicator }">
  <div class="button-content">
    <div :class="`item-circle cooldown-ring cooldown-ring-${indexName}`"></div>
    <div :class="`item-circle level-ring-${indexName}`"></div>
    <button @click="onSkill(false)" @mouseenter="overButton(true)" @mouseleave="overButton(false)" class="skill-button">{{ indexName }}</button>
    <div>{{ skill.name }}</div>
    <div v-if="levelupReady" @click="onLevelup" @mouseenter="overLevelup(true)" @mouseleave="overLevelup(false)" class="button-levelup interactive">
      ⬆︎+1
    </div>
  </div>
  <div class="description-tooltip bar-section" v-html="descriptionHtml"></div>
</div>
</template>

<script>
import store from '@/store'

import Sektor from '@/play/external/sektor'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'

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
      disabledByOtherSkill: false,
      isOverLevelup: false,
    }
  },

  computed: {
    keyCode () {
      return this.index + 49
    },

    disabled () {
      return this.level === 0 || this.activated || this.cooldownRemaining > 0 || this.disabledByOtherSkill || store.state.dead
    },

    isActiveSkill () {
      return this.index === store.state.skills.activeSkill
    },

    indexName () {
      return `${this.index + 1}`
    },

    descriptionHtml () {
      const rows = [`<div class="description-text">${this.skill.description}</div>`]
      if (this.skill.duration) {
        let durationText = `${this.activeDuration / 1000}`
        if (this.isOverLevelup) {
          const diff = this.skill.getDuration(this.level + 1) * 100 - this.activeDuration
          durationText += ` <span class="levelup">(${diff >= 0 ? '+' : ''}${diff / 1000})</span>`
        }
        rows.push(`<div>Duration: <span class="bold">${durationText}</span> seconds</div>`)
      }
      if (this.skill.cooldown) {
        let cooldownText = `${this.cooldownDuration / 1000}`
        if (this.isOverLevelup) {
          const diff = this.skill.getCooldown(this.level + 1) * 100 - this.cooldownDuration
          cooldownText += ` <span class="levelup">(${diff >= 0 ? '+' : ''}${diff / 1000})</span>`
        }
        rows.push(`<div>Cooldown: <span class="bold">${cooldownText}</span> seconds</div>`)
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

    showingLevelupIndicator () {
      return store.state.level > store.state.skills.leveled
    },

    levelupReady () {
      return !this.submittedLevelup && this.levelupProgress < 1 && this.showingLevelupIndicator
    },

    activeDuration () {
      return this.skill.getDuration(this.level) * 100
    },
    cooldownDuration () {
      return this.skill.getCooldown(this.level) * 100
    },

    allActives () {
      return store.state.skills.actives
    },

    activated () {
      return this.allActives[this.index]
    },
    cooldownTime () {
      return this.activated ? 0 : store.state.skills.cooldowns[this.index]
    },
    cooldownRemaining () {
      const cooldownAt = this.cooldownTime
      if (cooldownAt > 0) {
        const diff = cooldownAt - store.state.game.renderTime
        if (diff >= 0) {
          return diff
        }
        store.state.skills.cooldowns.splice(this.index, 1, 0)
      }
      return 0
    },

    currentPress () {
      const code = store.state.key.lastPress.code
      const modifier = store.state.key.lastPress.modifier
      return code !== undefined && modifier !== undefined && store.state.key.lastPress
    },
  },

  watch: {
    currentPress (currentKey) {
      if (currentKey.code === this.keyCode) {
        store.cancelActiveSkill()
        store.state.skills.activeSkill = this.index
        if (!this.disabled && !currentKey.modifier) {
          if (this.skill.getRange) {
            Local.player.unit.createIndicator(this.skill.getRange(this.level))
          }
          if (this.skill.target === 2) {
            store.state.skills.getGroundTarget = true
          }
        }
      } else {
        if (this.isActiveSkill) {
          if (currentKey.released) {
            if (currentKey.modifier) {
              this.onLevelup()
            } else {
              this.onSkill(true)
            }
          } else {
            console.log('Cancel skill', this.indexName, currentKey)
          }
          store.cancelActiveSkill()
        }
      }
    },

    allActives (newActives) {
      if (this.skill.isDisabledBy) {
        this.disabledByOtherSkill = this.skill.isDisabledBy(newActives)
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
    createRangeIndicator () {
      if (this.skill.getRange) {
        Local.player.unit.createIndicator(this.skill.getRange(this.level))
      }
    },
    removeRangeIndicator () {
      if (this.skill.getRange) {
        Local.player.unit.removeIndicator()
      }
    },

    onSkill (pressed) {
      if (this.skill.target === 0) {
        return
      }
      if (this.disabled || this.cooldownRemaining > 200) {
        return
      }
      if (this.skill.target === 1) {
        store.cancelActiveSkill()
        Bridge.emit('action', { skill: this.index, target: null })
      } else if (this.skill.target === 2) {
        const activate = () => {
          Bridge.emit('action', { skill: this.index, target: store.state.skills.groundTarget })
          store.cancelActiveSkill()
        }
        if (pressed) {
          if (store.state.skills.groundTarget) {
            activate()
          } else {
            store.cancelActiveSkill()
          }
        } else {
          store.state.skills.activeSkill = this.index
          store.state.skills.getGroundTarget = true
          store.state.skills.activateGround = activate
        }
      }
    },

    onLevelup () {
      if (this.levelupReady) {
        this.submittedLevelup = true
        Bridge.emit('action', { skill: this.index, level: true })
      }
    },

    overButton (hovering) {
      if (hovering) {
        this.createRangeIndicator()
      } else {
        if (!this.isActiveSkill) {
          this.removeRangeIndicator()
        }
      }
    },

    overLevelup (hovering) {
      this.isOverLevelup = hovering
    },
  },

  mounted () {
    this.cooldownRing = new Sektor(`.cooldown-ring-${this.indexName}`, {
      size: 80,
      stroke: 40,
      arc: true,
      angle: this.activated ? 360 : 0,
      sectorColor: '#68f',
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

.skill-item.selected .skill-button
  box-shadow inset 0 0 32px #f0d

.skill-item .Sektor
  position absolute
  top 0
  left 0
  z-index 10

.skill-item .description-tooltip
  display none
  position absolute
  height 92px
  top -92px
  left 0
  right 0
  margin 0
  text-align left
  z-index 0
  pointer-events none
.skill-item.hasLevelup .description-tooltip
  height 116px
  top -116px

.skill-item .description-text
  margin-bottom 2px

.skill-item .skill-button
  padding 4px
  margin 6px
  width 76px
  height 76px
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

.skill-item .levelup
  color #d55

.skill-item .button-levelup:hover
  opacity 0.8

.skill-item.disabled .cooldown-ring .Sektor-circle
  stroke #666

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
