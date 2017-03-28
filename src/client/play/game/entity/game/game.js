import TrigCache from '@/play/external/trigcache'

import store from '@/store'

import Local from '@/play/local'
import Render from '@/play/render/render'

import GameMap from '@/play/game/entity/game/map'
import Player from '@/play/game/entity/game/player'
import Wave from '@/play/game/entity/game/wave'

import Bullet from '@/play/game/entity/unit/bullet'
import Unit from '@/play/game/entity/unit/unit'

export default function (gid, size) {
  let players = {}
  let teamSize = size
  let startTime

  let updateCount = 0
  let updateQueue = {}

  let updateDuration
  let tickDuration
  let ticksPerUpdate
  let renderedSinceUpdate = false
  let ticksRendered = 0
  let lastTickTime
  let tickOffsets = -4

  store.state.game.running = false

  this.beginRender = function () {
    const gameContainer = Render.group()
    this.container = gameContainer

    this.serverUpdate = -1
    this.running = false

    this.map = new GameMap(gameContainer)

    Render.add(gameContainer)
  }

  this.calculateTicksToRender = function (currentTime) {
    const tickOffsetTime = tickOffsets * ticksPerUpdate * tickDuration / 2
    return Math.floor((currentTime - lastTickTime - tickOffsetTime) / tickDuration)
  }

  this.performTicks = function (ticksToRender, currentTime) {
    let renderTime
    let ticksRenderedForFrame = 0
    const maxTicksToRender = ticksToRender > 9 ? Math.floor(Math.pow(ticksToRender, 0.5)) : 1
    while (ticksToRender > 0) {
      renderTime = ticksRendered * tickDuration
      if (ticksRendered % ticksPerUpdate === 0) {
        if (!dequeueUpdate(renderTime)) {
          tickOffsets += 1
          console.log('Missing update', [ticksToRender, tickOffsets])
          break
        }
      }
      Unit.update(renderTime, tickDuration, false)
      Bullet.update(renderTime, tickDuration, false)

      const spawnMinionWave = Local.TESTING ? renderTime % 30000 == 5000 : renderTime % 45000 === 15000
      if (spawnMinionWave) {
        Wave.spawn(this.map.minionData())
      }

      ticksRendered += 1
      ticksToRender -= 1
      lastTickTime += tickDuration

      if (ticksRenderedForFrame >= maxTicksToRender) {
        break
      }
      ticksRenderedForFrame += 1
    }
    if (ticksToRender === 0) {
      renderedSinceUpdate = true
    }
    if (renderTime) {
      store.state.renderTime = renderTime
    }
    return true
  }

  const dequeueUpdate = function (renderTime) {
    const nextUpdate = updateQueue[updateCount]
    if (!nextUpdate) {
      return false
    }

    updateQueue[updateCount] = null
    updateCount += 1

    for (let pid in nextUpdate) { // 'action' response
      const player = players[pid]
      if (player) {
        const playerActions = nextUpdate[pid]
        const ship = player.unit
        for (let ai = playerActions.length - 1; ai >= 0; ai -= 1) {
          const action = playerActions[ai]
          const target = action.target
          const skillIndex = action.skill
          if (skillIndex !== undefined) {
            if (action.level) {
              ship.levelup(skillIndex)
            } else {
              ship.performSkill(renderTime, skillIndex, target)
            }
          } else if (target && !ship.isDying) {
            if (typeof target === 'string') {
              ship.setTargetId(target)
            } else {
              ship.targetDestination(target[0], target[1], false)
            }
          }
        }
      } else {
        console.log('Update invalid for player', pid)
      }
    }
    return true
  }

  // Play

  this.enqueueUpdate = function (update, actions) {
    this.serverUpdate = update
    updateQueue[update] = actions
    if (renderedSinceUpdate) {
      const behindUpdates = update - updateCount
      if (behindUpdates > 0) {
        tickOffsets -= 1
        renderedSinceUpdate = false
        console.log('Catching up to server update', [behindUpdates, tickOffsets])
      }
    }
  }

  this.start = function () {
    Local.player = players[Local.playerId]
    Local.player.isLocal = true

    TrigCache.prepare()
    this.beginRender()

    ticksPerUpdate = updateDuration / tickDuration
    console.log('STARTED', updateDuration, tickDuration, ticksPerUpdate)
    console.log(Local.playerId, players)

    const mapType = teamSize <= 1 ? 'tiny' : (teamSize <= 3 ? 'small' : ('standard'))
    this.map.build(mapType)

    for (let pid in players) {
      const player = players[pid]
      if (player) {
        player.createShip()
      }
    }
    store.setSelectedUnit(Local.player.unit)
    store.state.game.running = true

    // status = 'STARTED'
    startTime = performance.now()
    lastTickTime = startTime
    this.enqueueUpdate(0, {})

    this.running = true
  }

  this.end = function (losingTeam) {
    this.running = false
    store.state.game.running = false

    // const overText = Render.text('GAME OVER', centerX, centerY, {font: '64px Arial', fill: 0xff1010}, gameContainer)
    // const winnerText = Render.text('Team ' + (2-losingTeam) + ' won!', centerX, centerY + 88, {font: '44px Arial', fill: 0xff1010}, gameContainer)
  }

  // Players

  this.player = function (id) {
    return players[id]
  }

  this.updatePlayers = function (playerData) {
    if (playerData.updates) {
      updateDuration = playerData.updates
      tickDuration = playerData.ticks
    }
    const serverPlayers = playerData.players
    players = {}
    for (let pid in serverPlayers) {
      const playerInfo = serverPlayers[pid]
      players[pid] = new Player(pid, playerInfo)
    }
    store.state.game.players = serverPlayers
  }

}
