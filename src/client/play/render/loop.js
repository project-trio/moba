import Stats from 'stats.js'

import Local from '@/play/local'

import Render from '@/play/render/render'

import Bullet from '@/play/game/entity/attack/bullet'

import Unit from '@/play/game/entity/unit/unit'

let lastUpdate = 0

let updatePanel, tickPanel, framePanel, animationId

//LOOP

const animate = function (timestamp) {
  const game = Local.game
  if (!game) {
    return
  }

  if (framePanel) {
    framePanel.begin()
  }
  if (game.started) {
    const isPlaying = game.playing
    const ticksToRender = game.calculateTicksToRender(timestamp)
    if (ticksToRender > 0) {
      const processUpdate = isPlaying && tickPanel
      if (processUpdate) {
        tickPanel.begin()
      }

      game.performTicks(ticksToRender, timestamp, updatePanel)

      if (isPlaying) {
        Local.player.unit.updateVisibility()
        if (processUpdate) {
          tickPanel.end()
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

    animationId = window.requestAnimationFrame(animate)
  }
  lastUpdate = timestamp

  if (framePanel) {
    framePanel.end()
  }
}

//PUBLIC

export default {

  start () {
    animationId = window.requestAnimationFrame(animate)

    // if (!Local.TESTING) {
    //   return
    // }
    updatePanel = new Stats()
    updatePanel.showPanel(1)
    document.body.appendChild(updatePanel.dom)

    tickPanel = new Stats()
    tickPanel.showPanel(1)
    document.body.appendChild(tickPanel.dom)
    tickPanel.dom.style.top = '48px'

    framePanel = new Stats()
    framePanel.showPanel(0)
    document.body.appendChild(framePanel.dom)
    framePanel.dom.style.top = '96px'

    Local.game.updatePanel = updatePanel
  },

  stop () {
    window.cancelAnimationFrame(animationId)
    animationId = null

    if (Local.game) {
      Local.game.started = false
      Local.game.updatePanel = null
    }
    if (tickPanel) {
      updatePanel.dom.remove()
      tickPanel.dom.remove()
      framePanel.dom.remove()
      updatePanel = null
      tickPanel = null
      framePanel = null
    }
  },

}
