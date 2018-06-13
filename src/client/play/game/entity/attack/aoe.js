import Local from '@/client/play/local'

import Render from '@/client/play/render/render'

import Animate from '@/client/play/game/helpers/animate'
import Util from '@/client/play/game/util'

const POSITION_MAGNITUDE_OFFSET = 100

let areaofEffects = null

//CLASS

class AreaOfEffect {

	// Constructor

	constructor (source, data) {
		this.source = source
		this.withUnit = data.follow
		this.dot = data.dot
		this.startAt = data.delay ? data.time + data.delay : null
		this.endAt = data.duration ? data.time + data.duration : null
		this.active = true
		this.hitsTowers = data.hitsTowers
		if (data.allies !== undefined) {
			this.allies = data.allies
		} else {
			this.allies = false
		}
		this.modify = data.modify

		const startingOpacity = this.startAt ? 0 : data.opacity
		this.container = Render.group()
		this.circle = Render.circle(data.radius, { color: data.color, opacity: startingOpacity, parent: this.container })
		const showsRing = this.px || data.duration > 500
		if (showsRing) {
			this.ring = Render.ring(data.radius, 1, { team: source.team, parent: this.container })
		}
		const parent = this.withUnit ? source.floor : Local.game.map.floorContainer
		parent.add(this.container)

		if (this.withUnit) {
			this.container.position.z = 1
		} else {
			let ax, ay
			if (data.px) {
				ax = data.px
				ay = data.py
			} else {
				ax = source.px
				ay = source.py
			}
			this.px = ax
			this.py = ay
			this.container.position.x = ax / POSITION_MAGNITUDE_OFFSET
			this.container.position.y = ay / POSITION_MAGNITUDE_OFFSET
		}
		this.collisionSize = data.radius * POSITION_MAGNITUDE_OFFSET
		this.attackDamage = data.attackDamage
		this.attackPierce = data.attackPierce
		this.stunDuration = data.stunDuration

		areaofEffects.push(this)
		Animate.apply(this)

		if (this.startAt) {
			this.queueAnimation('circle', 'opacity', {
				from: 0,
				to: 0.1,
				final: data.opacity,
				start: data.time,
				duration: data.delay,
			})
		}
	}

	apply (renderTime, units) {
		const fromUnit = this.source
		const positionUnit = this.withUnit ? fromUnit : this
		const team = fromUnit.team, px = positionUnit.px, py = positionUnit.py
		for (let idx = units.length - 1; idx >= 0; idx -= 1) {
			const target = units[idx]
			if (target.isDead || target.untargetable || (target.tower && !this.hitsTowers)) {
				continue
			}
			const isAlly = team === target.team
			if (isAlly !== this.allies) {
				continue
			}
			const dist = target.distanceToPoint(px, py)
			if (Util.withinSquared(dist, this.collisionSize + target.stats.collision)) {
				if (this.modify) {
					target.modifyData(renderTime, this.modify)
				}
				if (!isAlly) {
					if (this.attackDamage) {
						target.takeDamage(fromUnit, renderTime, this.attackDamage, this.attackPierce)
					}
					if (this.stunDuration) {
						target.stun(renderTime, this.stunDuration)
					}
				}
			}
		}
	}

	destroy () {
		Render.remove(this.container)
		this.remove = true
	}

	deactivate (renderTime) {
		this.active = false
		this.queueAnimation('circle', 'opacity', {
			from: this.circle.material.opacity / 1.5,
			to: 0,
			start: renderTime,
			duration: 300,
			onComplete: () => {
				this.destroy()
			},
		})
	}

}

//STATIC

AreaOfEffect.init = function () {
	areaofEffects = []
}

AreaOfEffect.destroy = function () {
	areaofEffects = null
}

AreaOfEffect.all = function () {
	return areaofEffects
}

AreaOfEffect.update = function (renderTime, units) {
	for (let idx = areaofEffects.length - 1; idx >= 0; idx -= 1) {
		const aoe = areaofEffects[idx]
		aoe.updateAnimations(renderTime)
		if (aoe.remove) {
			areaofEffects.splice(idx, 1)
			continue
		}
		if (!aoe.active || (aoe.startAt && renderTime < aoe.startAt)) {
			continue
		}
		if (aoe.endAt && renderTime >= aoe.endAt) {
			aoe.deactivate(renderTime)
		} else {
			aoe.apply(renderTime, units)
			if (!aoe.dot) {
				aoe.deactivate(renderTime)
			}
		}
	}
}

export default AreaOfEffect
