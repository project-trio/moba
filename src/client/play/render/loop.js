import Stats from 'stats.js'

import Local from '@/play/local'

import Render from '@/play/render/render'

import Bullet from '@/play/game/entity/attack/bullet'

import Unit from '@/play/game/entity/unit/unit'

let lastUpdate = 0

let updatePanel, framePanel

//LOOP

const animate = function (timestamp) {
  if (framePanel) {
    framePanel.begin()
  }
  const game = Local.game
  if (game.running) {
    const isPlaying = game.playing
    const ticksToRender = game.calculateTicksToRender(timestamp)
    if (ticksToRender > 0) {
      const processUpdate = isPlaying && updatePanel
      if (processUpdate) {
        updatePanel.begin()
      }

      game.performTicks(ticksToRender, timestamp)

      if (isPlaying) {
        Local.player.unit.updateVisibility()
        if (processUpdate) {
          updatePanel.end()
        }
      }
    } else if (isPlaying) { // Tween
      const tweenTimeDelta = timestamp - lastUpdate
      Bullet.update(timestamp, tweenTimeDelta, true)
      Unit.update(timestamp, tweenTimeDelta, true)
    }

    if (isPlaying) {
      const position = Local.player.unit.container.position
      game.map.track(position.x, position.y)
    }
    Render.render(Unit.all())

    window.requestAnimationFrame(animate)
  }
  lastUpdate = timestamp

  if (framePanel) {
    framePanel.end()
  }
}

//PUBLIC

export default {

  start () {
    window.requestAnimationFrame(animate)

    // if (!Local.TESTING) {
    //   return
    // }
    updatePanel = new Stats()
    updatePanel.showPanel(1)
    document.body.appendChild(updatePanel.dom)

    framePanel = new Stats()
    framePanel.showPanel(0)
    framePanel.dom.style.top = '48px'
    document.body.appendChild(framePanel.dom)
  },

  stop () {
    if (Local.game) {
      Local.game.running = false
    }
    if (updatePanel) {
      updatePanel.dom.remove()
      framePanel.dom.remove()
      updatePanel = null
      framePanel = null
    }
  },

}
