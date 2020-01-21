import Stats from 'stats.js'

import store from '@/app/store'

import Local from '@/play/local'

import Render from '@/play/render/render'

import Tutorial from '@/play/game/tutorial'

import Bullet from '@/play/game/entity/attack/bullet'
import Unit from '@/play/game/entity/unit/unit'

let previousTimestamp = 0
let lastTickTime = 0

let updatePanel, tickPanel, framePanel, animationId

const storeSettings = store.state.settings

//LOOP

const animate = function (timestamp) {
	const game = Local.game
	if (!game || game.finished) {
		return
	}
	animationId = window.requestAnimationFrame(animate)

	const isPlaying = game.playing
	if (isPlaying && framePanel) {
		framePanel.begin()
	}
	const ticksToRender = game.calculateTicksToRender(timestamp)
	if (ticksToRender > 0) {
		const processUpdate = isPlaying && tickPanel
		if (processUpdate) {
			tickPanel.begin()
		}

		game.performTicks(ticksToRender)

		if (isPlaying) {
			Local.unit.updateVisibility()
			if (processUpdate) {
				tickPanel.end()
			}
			const tutorial = store.state.game.tutorial
			if (tutorial && tutorial.check && tutorial.check(Local.unit)) {
				Tutorial.advance()
			}
		}
		lastTickTime = timestamp
	} else if (isPlaying) { // Tween
		if (storeSettings.fpsCap) {
			return
		}
		const tweenTimeDelta = timestamp - previousTimestamp
		const renderTime = store.state.game.renderTime + (timestamp - lastTickTime)
		Bullet.update(renderTime, tweenTimeDelta, true)
		Unit.update(renderTime, tweenTimeDelta, true)
	}

	if (isPlaying) { //TODO isStarted
		if (!store.state.manualCamera || store.state.trackCamera) {
			const position = Local.unit.container.position
			game.map.track(position.x, position.y, false)
		} else if (store.state.trackX || store.state.trackY) {
			game.map.trackDelta(store.state.trackX, store.state.trackY, 8)
		}
	}
	Render.render(Unit.all())

	if (framePanel && isPlaying) {
		framePanel.end()
	}
	previousTimestamp = timestamp
}

//PUBLIC

export default {

	start () {
		animationId = window.requestAnimationFrame(animate)

		framePanel = new Stats()
		framePanel.showPanel(0)
		document.body.appendChild(framePanel.dom)

		const isAdmin = store.state.signin.user.admin
		if (isAdmin) {
			tickPanel = new Stats()
			tickPanel.showPanel(1)
			document.body.appendChild(tickPanel.dom)
			tickPanel.dom.style.top = '48px'

			updatePanel = new Stats()
			updatePanel.showPanel(1)
			document.body.appendChild(updatePanel.dom)
			Local.game.updatePanel = updatePanel
			framePanel.dom.style.top = '96px'
		}
	},

	stop () {
		window.cancelAnimationFrame(animationId)
		animationId = null

		if (Local.game) {
			Local.game.started = false
			Local.game.updatePanel = null
		}
		if (framePanel) {
			framePanel.dom.remove()
			framePanel = null
			if (updatePanel) {
				updatePanel.dom.remove()
				tickPanel.dom.remove()
				updatePanel = null
				tickPanel = null
			}
		}
	},

}
