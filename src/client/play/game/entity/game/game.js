import TrigCache from '@/play/external/trigcache'

import store from '@/store'

import Local from '@/play/local'
import Render from '@/play/render/render'

import AreaOfEffect from '@/play/game/entity/attack/aoe'
import Bullet from '@/play/game/entity/attack/bullet'

import GameMap from '@/play/game/entity/game/map'
import Player from '@/play/game/entity/game/player'
import Wave from '@/play/game/entity/game/wave'

import Unit from '@/play/game/entity/unit/unit'

export default function (gid, size, mapName) {
  let players = {}
  let startTime

  let updateCount = 0
  let updateQueue = {}

  let updateDuration
  let tickDuration
  let ticksPerUpdate
  let renderedSinceUpdate = false
  let ticksRendered = 0
  let updatesUntilStart = 0
  let lastTickTime
  let tickOffsets = -4

  this.id = gid
  this.running = false
  this.playing = false
  this.serverUpdate = -1

  store.state.game.running = false
  store.state.game.playing = false

  // Update

  this.calculateTicksToRender = function (currentTime) {
    const tickOffsetTime = tickOffsets * ticksPerUpdate * tickDuration / 2
    return Math.floor((currentTime - lastTickTime - tickOffsetTime) / tickDuration)
  }

  this.performTicks = function (ticksToRender, currentTime) {
    let renderTime
    let ticksRenderedForFrame = 0
    const maxTicksToRender = ticksToRender > 9 ? Math.floor(Math.pow(ticksToRender, 0.67)) : 1
    while (ticksToRender > 0) {
      renderTime = ticksRendered * tickDuration
      if (ticksRendered % ticksPerUpdate === 0) {
        if (dequeueUpdate(renderTime)) {
          store.state.game.missingUpdate = false
        } else {
          tickOffsets += 1
          if (ticksToRender > ticksPerUpdate) {
            store.state.game.missingUpdate = true
          }
          console.log('Missing update', ticksToRender, tickOffsets)
          break
        }
      }
      if (renderTime > 0) {
        AreaOfEffect.update(renderTime, Unit.all())
        Bullet.update(renderTime, tickDuration, false)
        Unit.update(renderTime, tickDuration, false)

        const spawnMinionWave = renderTime % 30000 === (Local.TESTING ? 5000 : 10000)
        if (spawnMinionWave) {
          Wave.spawn(this.map.minionData())
        }
      } else if (renderTime === 0) {
        this.startPlaying()
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
      store.state.game.renderTime = renderTime
    }
    return true
  }

  const dequeueUpdate = function (renderTime) {
    const nextUpdate = updateQueue[updateCount]
    if (!nextUpdate) {
      return false
    }
    const onSelectionScreen = updateCount <= updatesUntilStart
    updateQueue[updateCount] = null
    updateCount += 1

    for (let pid in nextUpdate) { // 'action' response
      const player = players[pid]
      if (!player) {
        console.error('Update invalid for player', pid, nextUpdate)
        continue
      }
      const playerActions = nextUpdate[pid]
      if (onSelectionScreen) {
        if (playerActions.unit) {
          player.shipName = playerActions.unit
          const storePlayer = store.state.game.players[pid]
          if (!storePlayer) {
            console.warn('Player not found for store', player, store.state.game.players)
          } else {
            storePlayer.shipName = player.shipName
          }
        }
      } else {
        const ship = player.unit
        if (!ship) {
          console.error('Update invalid for ship', pid, player, nextUpdate, Unit.all())
          if (Local.TESTING) {
            window.alert('No ship')
          }
          continue
        }
        for (let ai = playerActions.length - 1; ai >= 0; ai -= 1) {
          const action = playerActions[ai]
          const target = action.target
          const skillIndex = action.skill
          ship.targetingSkill = null
          if (skillIndex !== undefined) {
            if (action.level) {
              ship.levelup(skillIndex)
            } else {
              ship.trySkill(renderTime, skillIndex, target)
            }
          } else if (target && ship.canMove()) {
            if (typeof target === 'string') {
              ship.setTargetId(target)
            } else {
              ship.targetDestination(target[0], target[1])
            }
          }
        }
      }
    }
    return true
  }

  // Play

  this.enqueueUpdate = function (update, actions) {
    if (update >= 9 && this.updatePanel) {
      if (update > 9) {
        this.updatePanel.end()
      }
      this.updatePanel.begin()
    }
    this.serverUpdate = update
    updateQueue[update] = actions
    if (renderedSinceUpdate) {
      const behindUpdates = update - updateCount
      if (behindUpdates > 0) {
        tickOffsets -= behindUpdates
        renderedSinceUpdate = false
        console.log('Catching up to server update', behindUpdates, tickOffsets)
      }
    }
  }

  this.startPlaying = function () {
    if (this.playing) {
      console.warn('game already playing')
      return
    }
    for (let pid in players) {
      const player = players[pid]
      if (player) {
        player.createShip()
      }
    }
    store.setSelectedUnit(Local.player.unit)

    this.playing = true
    store.state.game.playing = true
  }

  // Setup

  this.close = function () {
    Unit.destroy()
    Bullet.destroy()
    AreaOfEffect.destroy()
    Render.destroy()
    this.map.destroy()

    Local.game = null
    Local.player.game = null
    store.resetGameState()
  }

  this.start = function () {
    if (this.running) {
      console.warn('game already running')
      return
    }

    Unit.init()
    Bullet.init()
    AreaOfEffect.init()
    Render.create()

    this.running = true
    store.state.game.running = true
    store.state.game.winningTeam = null

    Local.player = players[Local.playerId]

    TrigCache.prepare()

    const gameContainer = Render.group()
    this.container = gameContainer
    this.map = new GameMap(mapName, gameContainer)
    Render.add(gameContainer)

    ticksPerUpdate = updateDuration / tickDuration
    ticksRendered = -updatesUntilStart * ticksPerUpdate
    console.log('STARTED', updateDuration, tickDuration, ticksPerUpdate, ticksRendered)

    // status = 'STARTED'
    startTime = performance.now()
    lastTickTime = startTime

    this.map.build()
  }

  this.end = function (winningTeam) {
    this.running = false
    this.playing = false
    store.state.game.running = false
    store.state.game.playing = false
    store.state.game.winningTeam = winningTeam
  }

  // Players

  this.player = function (id) {
    return players[id]
  }

  this.updatePlayers = function (gameData) {
    const serverPlayers = gameData.players
    store.state.game.players = serverPlayers

    if (!this.running) { //TODO show disconnected players in game
      if (gameData.updates !== undefined) {
        updateDuration = gameData.updates
        tickDuration = gameData.ticks
        updatesUntilStart = gameData.updatesUntilStart
      }
      players = {}
      for (let pid in serverPlayers) {
        const playerInfo = serverPlayers[pid]
        players[pid] = new Player(pid, playerInfo)
      }
      if (gameData.host) {
        store.state.game.host = gameData.host
      }
      store.state.game.ready = gameData.ready
    }
  }

}
