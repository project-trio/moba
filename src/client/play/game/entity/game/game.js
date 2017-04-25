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

export default function (gid, mode, size, mapName) {
  let players = {}

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
  this.size = size
  this.started = false
  this.playing = false
  this.finished = false
  this.serverUpdate = -1

  store.state.game.playing = false

  // Update

  this.calculateTicksToRender = function (currentTime) {
    const tickOffsetTime = tickOffsets * ticksPerUpdate * tickDuration / 2
    return Math.floor((currentTime - lastTickTime - tickOffsetTime) / tickDuration)
  }

  this.performTicks = function (ticksToRender, currentTime) {
    let renderTime
    let ticksRenderedForFrame = 0
    const maxTicksToRender = ticksToRender > 9 ? Math.min(10000, Math.floor(Math.pow(ticksToRender, 0.75))) : 1
    while (ticksToRender > 0) {
      renderTime = ticksRendered * tickDuration
      store.state.game.renderTime = renderTime

      if (ticksRendered % ticksPerUpdate === 0) {
        if (dequeueUpdate(renderTime)) {
          store.state.game.missingUpdate = false
        } else {
          tickOffsets += 1
          if (ticksToRender > ticksPerUpdate) {
            store.state.game.missingUpdate = true
          }
          // p('Missing update', ticksToRender, tickOffsets)
          break
        }
      }
      if (renderTime > 0) {
        AreaOfEffect.update(renderTime, Unit.all())
        Bullet.update(renderTime, tickDuration, false)
        Unit.update(renderTime, tickDuration, false)

        const spawnMinionWave = renderTime % 30000 === (Local.TESTING ? 5000 : 10000)
        if (spawnMinionWave) {
          Wave.spawn(this.map.minionData(), renderTime)
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
          const storePlayer = store.state.game.players[pid]
          if (!storePlayer) {
            console.error('Player not found for store', player, store.state.game.players)
          } else {
            storePlayer.shipName = playerActions.unit
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
        for (let idx = ship.queuedForActivation.length - 1; idx >= 0; idx -= 1) {
          ship.queuedForActivation[idx] = false
        }
        for (let ai = playerActions.length - 1; ai >= 0; ai -= 1) {
          const action = playerActions[ai]
          const skillIndex = action.skill
          if (action.level) {
            ship.levelup(skillIndex)
          } else {
            const target = action.target
            if (target || skillIndex !== undefined) {
              ship.enqueue(skillIndex, target)
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
        p('Catching up to server update', behindUpdates, tickOffsets)
      }
    }
  }

  this.centerOnUnit = function () {
    const position = Local.unit.container.position
    this.map.track(position.x, position.y, false)
  }

  this.startPlaying = function () {
    if (this.playing) {
      console.error('game already playing')
      return
    }
    for (let pid in players) {
      const player = players[pid]
      if (player) {
        player.createShip()
      }
    }
    Local.unit = Local.player.unit
    store.setSelectedUnit(Local.unit)

    this.playing = true
    store.state.game.playing = true

    this.centerOnUnit()
  }

  // Setup

  this.close = function () {
    Unit.destroy()
    Bullet.destroy()
    AreaOfEffect.destroy()
    Render.destroy()
    if (this.map) {
      this.map.destroy()
    }

    Local.game = null
    Local.unit = null
    Local.player = null
    store.resetGameState()
  }

  this.start = function () {
    if (this.started) {
      console.error('game already started')
      return
    }
    store.state.game.active = true

    Render.create()
    Unit.init()
    Bullet.init()
    AreaOfEffect.init()

    this.started = true
    store.state.game.winningTeam = null

    Local.player = players[store.state.playerId]

    TrigCache.prepare()

    const gameContainer = Render.group()
    this.container = gameContainer
    this.map = new GameMap(mapName, gameContainer)
    Render.add(gameContainer)

    ticksPerUpdate = updateDuration / tickDuration
    ticksRendered = -updatesUntilStart * ticksPerUpdate
    // p('STARTED', updateDuration, tickDuration, ticksPerUpdate, ticksRendered)

    // status = 'STARTED'
    lastTickTime = performance.now()

    let playerCount = 0
    // eslint-disable-next-line
    for (let pid in players) {
      playerCount += 1
    }
    this.map.build(playerCount)
  }

  this.end = function (winningTeam) {
    this.finished = true
    this.playing = false
    store.state.game.active = false
    store.state.game.playing = false
    store.state.game.winningTeam = winningTeam
  }

  this.killTower = function (byTeam) {
    for (let pid in players) {
      const player = players[pid]
      if (player.team === byTeam) {
        player.unit.awardExperience(1000)
      }
    }
  }

  // Players

  this.player = function (id) {
    return players[id]
  }

  this.updatePlayer = function (gameData) {
    const pid = gameData.pid
    const player = players[pid]
    const storePlayer = store.state.game.players[pid]
    if (!player || !storePlayer) {
      console.error('Updated player DNE', player, storePlayer, gameData, players)
      return
    }
    // p(gameData, store.state.game.players)
    player.isActive = gameData.joined
    storePlayer.isActive = gameData.joined
    store.state.chatMessages.push({ name: player.name, team: player.team, active: player.isActive })
  }

  this.updatePlayers = function (gameData) {
    if (this.started) {
      console.error('Cannot replace players for already started game')
      return
    }
    const serverPlayers = gameData.players
    players = {}
    for (let pid in serverPlayers) {
      const playerInfo = serverPlayers[pid]
      players[pid] = new Player(pid, playerInfo)
      playerInfo.isActive = true
    }
    store.state.game.players = serverPlayers

    if (gameData.updates !== undefined) {
      updateDuration = gameData.updates
      tickDuration = gameData.ticks
      Local.tickDuration = tickDuration
      updatesUntilStart = gameData.updatesUntilStart
    }
    if (gameData.host) {
      store.state.game.host = gameData.host
    }
    store.state.game.ready = gameData.ready
  }

}
