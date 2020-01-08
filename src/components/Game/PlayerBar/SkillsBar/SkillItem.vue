<template>
<div class="skill-item  inline-block m-1" :class="{ selected: !disabled && isActiveSkill, disabled, cooldown: cooldownTime, showsLevelup: levelupReady }">
	<div class="skill-content">
		<div class="button-content">
			<div :id="`cooldown-ring-${indexName}`" class="item-circle cooldown-ring" />
			<div v-show="!cooldownRemaining" :id="`internal-ring-${indexName}`" />
			<div :id="`level-ring-${indexName}`" class="item-circle" />
			<button class="skill-button" @click="onSkill(true)" @mouseenter="overButton(true)" @mouseleave="overButton(false)">{{ indexName }}</button>
			<div
				v-if="showingLevelupIndicator" class="button-levelup interactive"
				@click="onLevelup" @mouseenter="overLevelup(true)" @mouseleave="overLevelup(false)"
			>
				⇧
			</div>
		</div>
		<div class="max-lg:hidden">
			{{ skill.name }}
		</div>
	</div>
	<div v-if="isActiveSkill && hintText" class="description-tooltip tooltip-small">{{ hintText }}</div>
	<div v-if="!isAnySkillActive" class="description-tooltip tooltip-large bar-section" v-html="descriptionHtml" />
</div>
</template>

<script>
import store from '@/store'

import Sektor from '@/play/external/sektor'

import Local from '@/play/local'

import Bridge from '@/play/events/bridge'

const checkTarget = function (target) {
	if (!target) {
		return false
	}
	if (store.state.local.skills.withAlliance !== target.localAlly) {
		// p('target not for alliance', store.state.local.skills.withAlliance, target.localAlly)
		return false
	}
	return true
}

const getUnitTarget = function (skillData) {
	const targetType = skillData.target
	store.state.local.skills.getUnitTarget = true
	store.state.local.skills.hitsTowers = skillData.hitsTowers
	store.state.local.skills.withAlliance = targetType === 3 ? false : targetType === 4 ? true : null
	if (Local.unitTarget) {
		if (checkTarget(Local.unitTarget)) {
			Local.unitTarget.setSelection(0xff0000)
		}
	}
}

const MATCH_BRACKET_FORMATTING = /\[\[([^\]]+)\]\]/g

export default {
	props: {
		skill: Object,
		index: Number,
	},

	data () {
		return {
			internalRing: null,
			cooldownRing: null,
			levelRing: null,
			submittedLevelup: false,
			disabledByOtherSkill: false,
			isOverLevelup: false,
			activationCooldown: null,
			internalCooldown: null,
		}
	},

	computed: {
		keyCode () {
			return this.index + 49
		},

		playing () {
			return store.state.game.playing
		},

		preventsActivation () {
			return this.level === 0 || this.activated || this.cooldownRemaining > 200 || (this.skill.activatable && !this.skill.activatable())
		},
		disabled () {
			return this.preventsActivation || this.cooldownRemaining > 0 || this.isToggled || this.disabledByOtherSkill || store.state.local.dead || !this.skill.getCooldown
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
			if (this.skill.target === 2) {
				return `Select a ground ${this.skill.getEffectRange ? 'area' : 'point'} to target`
			}
			if (this.skill.target === 3) {
				return `Select an enemy ${this.skill.hitsTowers ? '' : 'unit'} to target`
			}
			if (this.skill.target === 4) {
				return 'Select an ally to target'
			}
			return null
		},

		showsDiff () {
			return this.isOverLevelup && this.level > 0
		},

		descriptionHtml () {
			const description = this.skill.description.replace(MATCH_BRACKET_FORMATTING, (match, substitution) => {
				const split = substitution.split(':')
				if (split.length > 1) {
					return `<span class="font-bold ${split[1]}">${split[0]}</span>`
				}

				const substitutionFunction = this.skill[`getEffect${substitution}`]
				let divisor, suffix
				if (substitution === 'Damage') {
					suffix = ' damage'
				} else if (substitution === 'Range') {
					suffix = ' range'
				} else if (substitution.startsWith('Dps')) {
					divisor = 10
					suffix = ' dps'
				} else if (substitution === 'Regen') {
					divisor = 10
					suffix = ' hp / s'
				} else if (substitution === 'Duration' || substitution === 'Delay' || substitution === 'Cooldown') {
					divisor = 1000
					suffix = ' seconds'
				} else {
					divisor = this.skill[`divisor${substitution}`]
					suffix = this.skill[`suffix${substitution}`] || ''
				}

				const valueForLevel = substitutionFunction(this.level === 0 ? 1 : this.level)
				let effectText = `${!divisor ? valueForLevel : (valueForLevel / divisor)}`
				if (this.showsDiff) {
					const diff = substitutionFunction(this.level + 1) - valueForLevel
					if (diff) {
						effectText += ` <span class="diff">(${diff >= 0 ? '+' : ''}${!divisor ? diff : (diff / divisor)})</span>`
					}
				}
				return `<span class="font-bold">${effectText}${suffix}</span>`
			})

			const rows = [`<div class="mb-px">${description}</div>`]
			if (this.skill.getDuration && !this.skill.hideDuration) {
				let durationText = `${this.activeDuration / 1000}`
				if (this.showsDiff) {
					const diff = this.skill.getDuration(this.level + 1) * 100 - this.activeDuration
					if (diff) {
						durationText += ` <span class="diff">(${diff >= 0 ? '+' : ''}${diff / 1000})</span>`
					}
				}
				rows.push(`<div>Duration: <span class="font-bold">${durationText}</span> seconds</div>`)
			}
			if (this.skill.getCooldown) {
				let cooldownText = `${this.cooldownDuration / 1000}`
				if (this.showsDiff) {
					const diff = this.skill.getCooldown(this.level + 1) * 100 - this.cooldownDuration
					if (diff) {
						cooldownText += ` <span class="diff">(${diff === 0 ? '-' : (diff > 0 ? '+' : '')}${diff / 1000})</span>`
					}
				}
				rows.push(`<div>Cooldown: <span class="font-bold">${cooldownText}</span> seconds</div>`)
			}
			return rows.join('')
		},

		level () {
			return store.state.local.skills.levels[this.index]
		},
		levelupProgress () {
			return this.level / 10
		},

		skillsLeveled () {
			return store.state.local.skills.leveled
		},
		higherLevelThanSkills () {
			return store.state.local.level > this.skillsLeveled
		},

		showingLevelupIndicator () {
			if (this.playing && this.levelupProgress < 1 && !this.isAnySkillActive && this.levelupReady) {
				return !this.skill.minLeveled || this.skillsLeveled >= this.skill.minLeveled
			}
			return false
		},

		levelupReady () {
			return !this.submittedLevelup && this.higherLevelThanSkills
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
		renderTime () {
			return store.state.game.renderTime
		},
		internalTime () {
			return this.activated ? 0 : store.state.local.skills.internal[this.index]
		},
		internalRemaining () {
			return this.internalTime > 0 ? this.internalTime - this.renderTime : 0
		},
		cooldownTime () {
			return this.activated ? 0 : store.state.local.skills.cooldowns[this.index]
		},
		cooldownRemaining () {
			return this.cooldownTime ? this.cooldownTime - this.renderTime : 0
		},

		isToggled () {
			return store.state.local.skills.toggle === this.index
		},

		currentPress () {
			const code = store.state.key.lastPress.code
			const modifier = store.state.key.lastPress.modifier
			return code !== undefined && modifier !== undefined && store.state.key.lastPress
		},
	},

	watch: {
		level () {
			this.submittedLevelup = false
		},

		currentPress (currentKey) {
			if (!Local.unit) {
				return
			}
			if (currentKey.code === this.keyCode) {
				store.cancelActiveSkill()
				const skillIndex = this.index
				store.state.local.skills.active = skillIndex
				if (!this.preventsActivation && !currentKey.modifier) {
					this.createRangeIndicator(this.level)

					if (this.skill.target > 1) {
						store.state.local.skills.activation = this.getActivation()
						if (this.skill.target === 2) {
							store.state.local.skills.getGroundTarget = true
						} else {
							getUnitTarget(this.skill)
						}
					}
				}
			} else {
				if (this.isActiveSkill) {
					if (currentKey.released) {
						if (currentKey.modifier) {
							this.onLevelup()
						} else {
							this.onSkill(false)
						}
					} else {
						// p('Cancel skill', this.indexName, currentKey)
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

		internalRemaining (remaining) {
			if (this.cooldownRemaining) {
				return
			}
			if (!this.internalCooldown) {
				this.internalCooldown = remaining
			}
			const angle = Math.floor(remaining / this.internalCooldown * 360)
			this.internalRing.changeAngle(angle >= 360 ? 0 : angle)
			if (remaining === 0) {
				this.internalCooldown = null
				store.state.local.skills.internal.splice(this.index, 1, 0)
			}
		},
		cooldownRemaining (remaining) {
			if (!this.activationCooldown) {
				this.activationCooldown = remaining
			}
			const angle = 360 - Math.floor(remaining / this.activationCooldown * 360)
			this.cooldownRing.changeAngle(angle >= 360 ? 0 : angle)
			if (remaining === 0) {
				this.activationCooldown = null
				store.state.local.skills.cooldowns.splice(this.index, 1, 0)
			}
		},

		levelupProgress (progress) {
			this.levelRing.animateTo(Math.floor(progress * 360))
		},
	},

	mounted () {
		this.cooldownRing = new Sektor(`#cooldown-ring-${this.indexName}`, {
			size: 80,
			stroke: 40,
			arc: true,
			angle: this.activated ? 360 : 0,
			sectorColor: '#68f',
			circleColor: '#aaa',
			fillCircle: true,
		})
		if (this.skill.getEffectCooldown) {
			this.internalRing = new Sektor(`#internal-ring-${this.indexName}`, {
				size: 80,
				stroke: 40,
				arc: true,
				angle: 0,
				sectorColor: '#888',
			})
		}
		this.levelRing = new Sektor(`#level-ring-${this.indexName}`, {
			size: 82,
			stroke: 6,
			arc: true,
			angle: Math.floor(this.levelupProgress * 360),
			sectorColor: '#8e9',
			circleColor: 'transparent',
			fillCircle: true,
		})
	},

	methods: {
		createRangeIndicator (forLevel) {
			if (this.skill.getRange && Local.unit) {
				Local.unit.createIndicator(this.skill.getRange(forLevel))
				if (this.skill.getEffectRange) {
					Local.game.map.aoeRadiusIndicator(this.skill.getEffectRange(forLevel))
				}
			}
		},
		removeRangeIndicator () {
			if (this.skill.getRange && Local.unit) {
				Local.unit.removeIndicator()
			}
		},

		getActivation () {
			return (target) => {
				Bridge.emit('action', { skill: this.index, target: target.id ? target.id : target })
				store.cancelActiveSkill()
			}
		},

		onSkill (clicked) {
			if (this.skill.target === 0) {
				return
			}
			if (this.preventsActivation) {
				return
			}
			if (clicked && this.isActiveSkill) {
				store.cancelActiveSkill()
				return
			}
			const skillIndex = this.index
			if (this.skill.target === 1) {
				store.cancelActiveSkill()
				Bridge.emit('action', { skill: skillIndex, target: null })
			} else {
				const groundTargeted = this.skill.target === 2
				const activateBlock = this.getActivation()
				if (clicked) {
					store.state.local.skills.active = skillIndex
					store.state.local.skills.activation = activateBlock
					if (groundTargeted) {
						store.state.local.skills.getGroundTarget = true
					} else {
						getUnitTarget(this.skill)
					}
				} else {
					const target = groundTargeted ? Local.groundTarget : Local.unitTarget
					if (target) {
						if (!groundTargeted) {
							if (!checkTarget(target)) {
								return
							}
						}
						activateBlock(target)
					} else {
						store.cancelActiveSkill()
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
					this.createRangeIndicator(this.level)
				}
			} else {
				if (!this.isAnySkillActive) {
					this.removeRangeIndicator()
				}
			}
		},

		overLevelup (hovering) {
			this.isOverLevelup = hovering
			if (hovering) {
				if (!this.isAnySkillActive) {
					this.createRangeIndicator(this.level + 1)
				}
			} else {
				if (!this.isAnySkillActive) {
					this.removeRangeIndicator()
				}
			}
		},
	},
}
</script>

<style lang="postcss">
.skill-item .skill-content {
	width: 104px;
}
.skill-item .button-content {
	@apply relative m-auto;
	width: 88px;
	height: 88px;
}

.skill-item.selected .skill-button {
	box-shadow: inset 0 0 32px #f0d;
}

.skill-item .Sektor {
	@apply absolute top-0 left-0;
	z-index: 10;
}

.skill-item .description-tooltip {
	@apply absolute left-0 right-0 hidden m-0 z-0 pointer-events-none;
}

.skill-item .tooltip-small {
	@apply text-lg;
	height: 28px;
	top: -28px;
	text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
}
.skill-item .tooltip-large {
	@apply text-left;
	height: 92px;
	top: -92px;
}
.skill-item.showsLevelup .tooltip-large{
	height: 116px;
	top: -116px;
}

.skill-item .skill-button {
	@apply relative m-1 p-1 font-semibold bg-transparent rounded-full cursor-pointer;
	/* TODO wh-full? */
	width: 76px;
	height: 76px;
	z-index: 100;
}
.skill-item.disabled .skill-button {
	@apply cursor-not-allowed;
}

.skill-item .button-levelup {
	@apply absolute h-16;
	top: -24px;
	left: 1px;
	right: 1px;
	background: #d55;
	z-index: 1;
}

.skill-item .diff {
	color: #8e9;
}
.skill-item .levelup {
	color: #d55;
}
.skill-item .button-levelup:hover {
	@apply opacity-75;
}
.skill-item.disabled .cooldown-ring .Sektor-circle {
	stroke: #666;
}
.skill-item .skill-button, .skill-item .cooldown-ring {
	transition: transform 0.4s ease, opacity 0.4s ease;
}
.skill-item:hover .cooldown-ring, .skill-item.selected .cooldown-ring {
	background: rgba(170, 170, 170, 0.8);
}
.skill-item:hover .description-tooltip, .skill-item.selected .description-tooltip {
	@apply block;
}
.skill-item:hover:active .cooldown-ring, .skill-item:hover:active .cooldown-ring {
	background: rgba(170, 170, 170, 0.5);
}
.skill-item:hover:active button {
	transform: scale(0.9);
}

.skill-item .poison {
	color: #00cc00;
}
.skill-item .whirlpool {
	color: #0088ff;
}
</style>
