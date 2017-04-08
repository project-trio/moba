<template>
<div class="skill-item" :class="{ selected: !disabled && isActiveSkill, disabled: disabled, cooldown: cooldownTime, showsLevelup: showingLevelupIndicator }">
  <div class="skill-content">
    <div class="button-content">
      <div :class="`item-circle cooldown-ring cooldown-ring-${indexName}`"></div>
      <div :class="`item-circle level-ring-${indexName}`"></div>
      <button @click="onSkill(false)" @mouseenter="overButton(true)" @mouseleave="overButton(false)" class="skill-button">{{ indexName }}</button>
      <div v-if="showingLevelupIndicator" @click="onLevelup" @mouseenter="overLevelup(true)" @mouseleave="overLevelup(false)" class="button-levelup interactive">
        ⬆︎
      </div>
    </div>
    <div class="skill-label">
      {{ skill.name }}
    </div>
  </div>
  <div v-if="isActiveSkill && hintText" class="description-tooltip tooltip-small">{{ hintText }}</div>
  <div v-if="!isAnySkillActive" class="description-tooltip tooltip-large bar-section" v-html="descriptionHtml"></div>
</div>
</template>

<script>
import store from '@/store'

import Sektor from '@/play/external/sektor'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'

import Unit from '@/play/game/entity/unit/unit'

const getUnitTarget = function (targetType) {
  store.state.local.skills.getUnitTarget = true
  store.state.local.skills.withAlliance = targetType === 3 ? false : targetType === 4 ? true : null
  if (store.state.local.skills.unitTarget) {
    const unitTarget = Unit.get(store.state.local.skills.unitTarget)
    if (!unitTarget || store.state.local.skills.withAlliance !== unitTarget.localAlly) {
      console.log('target not for alliance', unitTarget)
    } else {
      unitTarget.setSelection(0xff0000)
    }
  }
}

const MATCH_BRACKET_FORMATTING = /\[\[([^\]]+)\]\]/g

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
      activationCooldown: null,
    }
  },

  computed: {
    keyCode () {
      return this.index + 49
    },

    preventsActivation () {
      return this.level === 0 || this.activated || this.cooldownRemaining > 200
    },
    disabled () {
      return this.preventsActivation || this.cooldownRemaining > 0 || this.disabledByOtherSkill || store.state.local.dead
    },

    isAnySkillActive () {
      return store.state.local.skills.active !== null
    },

    isActiveSkill () {
      return this.index === store.state.local.skills.active
    },

    indexName () {
      return `${this.index + 1}`
    },

    hintText () {
      if (this.skill.target <= 1) {
        return null
      }
      if (this.skill.target === 2) {
        return `Select a ground ${this.skill.getEffectRange ? 'area' : 'point'} to target`
      }
      if (this.skill.target === 3) {
        return 'Select an enemy to target'
      }
      if (this.skill.target === 4) {
        return 'Select an ally to target'
      }
    },

    showsDiff () {
      return this.isOverLevelup && this.level > 0
    },

    descriptionHtml () {
      let description = this.skill.description.replace(MATCH_BRACKET_FORMATTING, (match, substitution) => {
        const substitutionFunction = this.skill[`getEffect${substitution}`]
        const factor = substitution === 'Duration' ? 1000 : this.skill[`factor${substitution}`] || 1
        const suffix = substitution === 'Duration' ? ' seconds' : (substitution === 'Damage' ? ' damage' : (substitution === 'Range' ? ' range' : this.skill[`suffix${substitution}`] || ''))

        const valueForLevel = substitutionFunction(this.level === 0 ? 1 : this.level)
        let effectText = `${valueForLevel / factor}`
        if (this.showsDiff) {
          const diff = substitutionFunction(this.level + 1) - valueForLevel
          effectText += ` <span class="levelup">(${diff >= 0 ? '+' : ''}${diff / factor})</span>`
        }
        return `<span class="bold">${effectText}${suffix}</span>`
      })

      const rows = [`<div class="description-text">${description}</div>`]
      if (this.skill.getDuration) {
        let durationText = `${this.activeDuration / 1000}`
        if (this.showsDiff) {
          const diff = this.skill.getDuration(this.level + 1) * 100 - this.activeDuration
          durationText += ` <span class="levelup">(${diff >= 0 ? '+' : ''}${diff / 1000})</span>`
        }
        rows.push(`<div>Duration: <span class="bold">${durationText}</span> seconds</div>`)
      }
      if (this.skill.getCooldown) {
        let cooldownText = `${this.cooldownDuration / 1000}`
        if (this.showsDiff) {
          const diff = this.skill.getCooldown(this.level + 1) * 100 - this.cooldownDuration
          cooldownText += ` <span class="levelup">(${diff === 0 ? '-' : (diff > 0 ? '+' : '')}${diff / 1000})</span>`
        }
        rows.push(`<div>Cooldown: <span class="bold">${cooldownText}</span> seconds</div>`)
      }
      return rows.join('')
    },

    level () {
      this.submittedLevelup = false
      return store.state.local.skills.levels[this.index]
    },
    levelupProgress () {
      return this.level / 10
    },

    higherLevelThanSkills () {
      return store.state.local.level > store.state.local.skills.leveled
    },

    showingLevelupIndicator () {
      return !this.isAnySkillActive && this.levelupReady
    },

    levelupReady () {
      return !this.submittedLevelup && this.levelupProgress < 1 && this.higherLevelThanSkills
    },

    activeDuration () {
      return this.skill.getDuration(this.level === 0 ? 1 : this.level) * 100
    },
    cooldownDuration () {
      return this.skill.getCooldown(this.level === 0 ? 1 : this.level) * 100
    },

    allActives () {
      return store.state.local.skills.actives
    },

    activated () {
      return this.allActives[this.index]
    },
    cooldownTime () {
      return this.activated ? 0 : store.state.local.skills.cooldowns[this.index]
    },
    cooldownRemaining () {
      const cooldownAt = this.cooldownTime
      if (cooldownAt > 0) {
        const diff = cooldownAt - store.state.game.renderTime
        if (diff >= 0) {
          if (!this.activationCooldown) {
            this.activationCooldown = diff
          }
          return diff
        }
        this.activationCooldown = null
        store.state.local.skills.cooldowns.splice(this.index, 1, 0)
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
        const skillIndex = this.index
        store.state.local.skills.active = skillIndex
        if (!this.preventsActivation && !currentKey.modifier) {
          this.createRangeIndicator()

          if (this.skill.target > 1) {
            store.state.local.skills.activation = this.getActivation()
            if (this.skill.target === 2) {
              store.state.local.skills.getGroundTarget = true
            } else {
              getUnitTarget(this.skill.target)
            }
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
          store.cancelActiveSkill(true)
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
        const angle = 360 - Math.floor(remaining / this.activationCooldown * 360)
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
        if (this.skill.getEffectRange) {
          Local.game.map.aoeRadiusIndicator(this.skill.getEffectRange(this.level))
        }
      }
    },
    removeRangeIndicator () {
      if (this.skill.getRange) {
        Local.player.unit.removeIndicator()
      }
    },

    getActivation () {
      return (target) => {
        Bridge.emit('action', { skill: this.index, target: target })
        store.cancelActiveSkill()
      }
    },

    onSkill (pressed) {
      if (this.skill.target === 0) {
        return
      }
      if (this.preventsActivation) {
        return
      }
      if (this.isActiveSkill) {
        store.cancelActiveSkill()
        return
      }
      const skillIndex = this.index
      if (this.skill.target === 1) {
        store.cancelActiveSkill()
        Bridge.emit('action', { skill: skillIndex, target: null })
      } else {
        const groundTargeted = this.skill.target === 2
        const activate = this.getActivation()
        if (pressed) {
          const target = groundTargeted ? store.state.local.skills.groundTarget : store.state.local.skills.unitTarget
          if (target) {
            if (!groundTargeted) {
              const unitTarget = Unit.get(target)
              if (!unitTarget || store.state.local.skills.withAlliance !== unitTarget.localAlly) {
                console.log('target not for alliance', unitTarget)
                return
              }
            }
            activate(target)
          } else {
            store.cancelActiveSkill()
          }
        } else {
          store.state.local.skills.active = skillIndex
          store.state.local.skills.activation = activate
          if (groundTargeted) {
            store.state.local.skills.getGroundTarget = true
          } else {
            getUnitTarget(this.skill.target)
          }
        }
      }
    },

    onLevelup () {
      if (this.levelupReady) {
        this.isOverLevelup = false
        this.submittedLevelup = true
        Bridge.emit('action', { skill: this.index, level: true })
      }
    },

    overButton (hovering) {
      if (hovering) {
        if (!this.isAnySkillActive) {
          this.createRangeIndicator()
        }
      } else {
        if (!this.isAnySkillActive) {
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

.skill-item .skill-content
  width 104px
.skill-item .button-content
  position relative
  width 88px
  height 88px
  margin auto
// .skill-item .skill-label

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
  left 0
  right 0
  margin 0
  z-index 0
  pointer-events none
.skill-item .tooltip-small
  height 28px
  top -28px
  text-shadow -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000
  font-size 1.1em
.skill-item .tooltip-large
  text-align left
  height 92px
  top -92px
.skill-item.showsLevelup .tooltip-large
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
