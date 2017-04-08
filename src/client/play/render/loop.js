import Stats from 'stats.js'

import store from '@/store'

import Local from '@/play/local'

import Render from '@/play/render/render'

import Bullet from '@/play/game/entity/attack/bullet'

import Unit from '@/play/game/entity/unit/unit'

let lastUpdate = 0
let lastTickTime = 0

let updatePanel, tickPanel, framePanel, animationId

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

    game.performTicks(ticksToRender, timestamp, updatePanel)

    if (isPlaying) {
      Local.unit.updateVisibility()
      if (processUpdate) {
        tickPanel.end()
      }
    }
    lastTickTime = timestamp
  } else if (isPlaying) { // Tween
    const tweenTimeDelta = timestamp - lastUpdate
    const renderTime = store.state.game.renderTime + (timestamp - lastTickTime)
    Bullet.update(renderTime, tweenTimeDelta, true)
    Unit.update(renderTime, tweenTimeDelta, true)
  }

  if (isPlaying) {
    const position = Local.unit.container.position
    game.map.track(position.x, position.y)
  }
  Render.render(Unit.all())

  if (framePanel && isPlaying) {
    framePanel.end()
  }
  lastUpdate = timestamp
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
