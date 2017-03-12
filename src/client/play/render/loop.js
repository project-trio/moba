import Stats from 'stats.js'

import Local from 'local'

import Render from 'render/render'

import Bullet from 'game/entity/unit/bullet'
import Unit from 'game/entity/unit/unit'

let lastUpdate = 0

let updatePanel, framePanel

//LOOP

const animate = function (timestamp) {
	if (framePanel) {
		framePanel.begin()
	}
	const game = Local.game
	if (game) {
		if (game.running) {
			const ticksToRender = game.calculateTicksToRender(timestamp)
			if (ticksToRender > 0) {
				const processUpdate = updatePanel && ticksToRender == 1
				if (processUpdate) {
					updatePanel.begin()
				}
				game.performTicks(ticksToRender, timestamp)
				game.localUnit.updateVisibility()
				if (processUpdate) {
					updatePanel.end()
				}
			} else {
				const tweenTimeDelta = timestamp - lastUpdate
				Bullet.update(timestamp, tweenTimeDelta, true)
				Unit.update(timestamp, tweenTimeDelta, true)
			}

			const position = game.localUnit.container.position
			game.map.track(position.x, position.y)
			Render.render()
			Render.fog(Unit.all())
		}
	}
	lastUpdate = timestamp

	if (framePanel) {
		framePanel.end()
	}
	window.requestAnimationFrame(animate)
}

//PUBLIC

export default {

	start () {
		window.requestAnimationFrame(animate)

		// if (Local.TESTING) {
			updatePanel = new Stats()
			updatePanel.showPanel(1)
			document.body.appendChild(updatePanel.dom)

			framePanel = new Stats()
			framePanel.showPanel(0)
			framePanel.dom.style.top = '48px'
			document.body.appendChild(framePanel.dom)
		// }
	},

}
