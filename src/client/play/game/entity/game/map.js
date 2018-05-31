import commonMaps from '@/common/maps'

import store from '@/client/store'

import Local from '@/client/play/local'

import Bridge from '@/client/play/events/bridge'

import pointer from '@/client/play/render/pointer'
import Render from '@/client/play/render/render'
import RenderMinimap from '@/client/play/render/minimap'

import Mini from '@/client/play/game/entity/unit/mini'
import Tower from '@/client/play/game/entity/unit/tower'
import Wave from '@/client/play/game/entity/game/wave'

//CONSTRUCTOR

const GameMap = function (mapName, parent) {
	let layout
	let automateTimer = null

	let container = Render.group()
	const floorContainer = Render.group()
	const wallContainer = Render.group()
	const fogContainer = Render.group()
	floorContainer.add(wallContainer)
	container.add(floorContainer)
	container.add(fogContainer)
	parent.add(container)
	this.floorContainer = floorContainer

	pointer.init(floorContainer)

	const collisionWalls = []

//LISTEN

	let previousPositionX = null
	let previousPositionY = null
	let previousCameraX, previousCameraY
	let maxMapX, maxMapY
	let waveNumber, waveInterval, waveDelay, wavesBetweenRanged, waveRangedDelay

	container.interactive = true

//MANAGE

	const sightsArray = []

	this.addSight = function (sight) {
		sightsArray.push(sight)
	}

	this.blockCheck = function (moveX, moveY) {
		if (moveX <= 0 || moveY <= 0 || moveX >= maxMapX || moveY >= maxMapY) {
			return null
		}
		return collisionWalls
	}

	this.createWalls = function (array) {
		for (const wall of array) {
			const x = wall[0]
			const y = wall[1]
			if (wall.length === 5) {
				const w = wall[2]
				const h = wall[3]
				const cx = (x - w / 2) * 100
				const cy = (y - h / 2) * 100
				collisionWalls.push([ cx, cy, cx + w * 100, cy + h * 100 ])
			} else {
				const r = wall[2] / 2
				collisionWalls.push([x * 100, y * 100, r * 100])

			}
		}
		RenderMinimap.createWalls(array)
		Render.createWalls(array, wallContainer)
	}

	const getTargetFromPoint = function (point) {
		const diffX = Math.round((point.x - previousCameraX) * 100)
		const diffY = Math.round((point.y - previousCameraY) * 100)
		return [diffX, diffY]
	}

	this.aoeRadiusIndicator = function (radius) {
		if (this.aoeRing) {
			Render.remove(this.aoeRing)
			this.aoeRing = null
		}
		if (radius) {
			this.aoeRing = Render.ring(radius, 2, {
				color: 0xffffff,
				opacity: 0.5,
				parent: floorContainer,
			})
			this.aoeRing.position.x = -9001
		}
	}

	this.build = function (playerCount) {
		const retro = store.state.game.retro
		// mapName = 'tiny' //SAMPLE
		layout = commonMaps[mapName]
		waveNumber = 0
		waveInterval = layout.spawn.interval * 1000
		waveDelay = layout.spawn.initialDelay * 1000
		wavesBetweenRanged = layout.spawn.rangedWaveEvery
		if (wavesBetweenRanged) {
			waveRangedDelay = layout.spawn.rangedDelay * 1000
		}

		const mapWidth = layout.width
		const mapHeight = layout.height
		maxMapX = mapWidth * 100
		maxMapY = mapHeight * 100
		Render.positionCamera(mapWidth / 2, mapHeight / 2)

		Mini.init()
		Tower.init(playerCount)

		this.aoeRing = null

		this.selectionRing = Render.ring(32, 4, {
			color: 0xff0000,
			opacity: 0.5,
			segments: 32,
			parent: floorContainer,
		})
		this.selectionRing.visible = false

		this.targetRing = Render.ring(32, 4, {
			color: 0xff0000,
			opacity: 0.5,
			segments: 32,
			parent: floorContainer,
		})
		this.targetRing.visible = false

		const ground = Render.ground(mapWidth, mapHeight, {
			color: 0x448866,
			floor: floorContainer,
			ceiling: fogContainer,
		})

		const count = 4
		const size = 3
		const ws = mapWidth / 2
		const hs = mapHeight / 2
		Render.generate('decorations', 'flower', Math.ceil(Math.sqrt(Math.random()) * count), size, floorContainer, 0, 0, ws, hs)
		Render.generate('decorations', 'flower', Math.ceil(Math.sqrt(Math.random()) * count), size, floorContainer, mapWidth, 0, -ws, hs)
		Render.generate('decorations', 'flower', Math.ceil(Math.sqrt(Math.random()) * count), size, floorContainer, 0, mapHeight, ws, -hs)
		Render.generate('decorations', 'flower', Math.ceil(Math.sqrt(Math.random()) * count), size, floorContainer, mapWidth, mapHeight, -ws, -hs)

		ground.owner = ground

		ground.onHover = () => {
		}
		ground.onMove = (point) => {
			if (!Local.unit || Local.unit.isDying) {
				return
			}
			const showActivateGround = store.state.local.skills.getGroundTarget
			if (showActivateGround || this.aoeRing) {
				const target = getTargetFromPoint(point)
				store.state.local.skills.groundTarget = target
				const groundX = target[0] / 100
				const groundY = target[1] / 100
				if (this.aoeRing) {
					this.aoeRing.position.x = groundX
					this.aoeRing.position.y = groundY
				} else {
					this.selectionRing.position.x = groundX
					this.selectionRing.position.y = groundY
				}
			}
			this.selectionRing.visible = showActivateGround && !this.aoeRing
		}
		ground.onBlur = () => {
			this.selectionRing.visible = false
		}

		ground.onClick = (point) => {
			store.state.game.showPanel = null

			if (!Local.unit || Local.unit.isDying) {
				return
			}
			const target = getTargetFromPoint(point)

			if (store.state.local.skills.getGroundTarget) {
				store.state.local.skills.activation(target)
			} else {
				store.cancelActiveSkill()
				Bridge.emit('action', { target })
				store.setSelectedUnit(Local.unit)

				if (automateTimer) {
					clearInterval(automateTimer)
					automateTimer = null
				}
			}
			return true
		}

		if (Local.TESTING || Local.player.name === 'bot') {
			automateTimer = setInterval(() => { //SAMPLE
				if (Local.player) {
					const dx = Math.round(Math.random() * 100 * layout.width)
					const dy = Math.round(Math.random() * 100 * layout.height)
					Bridge.emit('action', { target: [dx, dy] })
				}
			}, Math.random() * 2000 + 1000)
		}

		for (let idx = 0; idx < layout.minions.length; idx += 1) {
			const minionSpawn = layout.minions[idx]
			for (let team = 0; team < 2; team += 1) {
				for (let pidx = 0; pidx < minionSpawn.paths.length; pidx += 1) {
					const mini = Mini.spawn(team, minionSpawn.type, minionSpawn.paths[pidx], minionSpawn.mirrored, retro)
					mini.isDying = true
				}
			}
		}

		const wallArray = []
		for (let idx = 0; idx < layout.walls.length; idx += 1) {
			const wall = layout.walls[idx]
			const radius = wall.radius
			for (let team = 0; team < 2; team += 1) {
				const firstTeam = team === 0
				let teamX = firstTeam ? mapWidth - wall.start.x : wall.start.x
				let teamY = firstTeam ? mapHeight - wall.start.y : wall.start.y
				const teamMp = firstTeam ? -1 : 1
				for (let mirror = 0; mirror < (wall.mirror ? 2 : 1); mirror += 1) {
					const mirrored = mirror > 0
					const mirroredMp = mirrored ? 1 : -1
					let segmentX = mirrored ? mapWidth - teamX : teamX
					let segmentY = teamY
					wallArray.push([ segmentX, segmentY, radius * 2, team ])

					const moveCount = wall.move.length
					for (let pidx = 0; pidx < moveCount; pidx += 1) {
						const point = wall.move[pidx]
						const dx = -point.dx * teamMp * mirroredMp
						const dy = point.dy * teamMp
						const vertical = dy !== 0

						let wallX = segmentX
						let wallY = segmentY
						if (vertical) {
							wallY += dy
						} else {
							wallX += dx
						}
						const wallWidth = Math.abs(point.dx || radius) * 2
						const wallHeight = Math.abs(point.dy || radius) * 2
						wallArray.push([ wallX, wallY, wallWidth, wallHeight, team ])

						segmentX += dx * 2
						segmentY += dy * 2
						if (wall.endCap || pidx + 1 < moveCount) {
							wallArray.push([ segmentX, segmentY, radius * 2, team ])
						}
					}
				}
			}
		}
		this.createWalls(wallArray)

		for (let idx = 0; idx < layout.towers.length; idx += 1) {
			const tower = layout.towers[idx]
			const towerType = tower[0]
			const ox = tower[1]
			const oy = tower[2]
			const mirroring = tower[3]
			let mirrored = false
			for (let mirror = 0; mirror < (mirroring ? 2 : 1); mirror += 1) {
				mirrored = !mirrored
				for (let team = 0; team < 2; team += 1) {
					const firstTeam = team === 0
					const tx = firstTeam != mirrored ? mapWidth - ox : ox
					const ty = firstTeam ? mapHeight - oy : oy
					new Tower(team, towerType, tx, ty, retro)
				}
			}
		}
	}

	this.destroy = function () {
		Mini.destroy()

		if (automateTimer) {
			clearInterval(automateTimer)
			automateTimer = null
		}
	}

	this.trackDelta = function (deltaX, deltaY, speed) {
		if (previousPositionX === null) {
			return
		}
		this.track(Math.ceil(previousPositionX + deltaX * speed), Math.ceil(previousPositionY - deltaY * speed), true)
	}

	this.track = function (cameraX, cameraY, delta) {
		if (cameraX !== previousPositionX) {
			previousPositionX = cameraX

			const lwh = layout.width / 2
			cameraX = -cameraX + lwh
			const minX = -lwh / 2
			if (cameraX < minX) {
				cameraX = minX
			} else {
				const maxX = lwh / 2
				if (cameraX > maxX) {
					cameraX = maxX
				}
			}
			if (cameraX !== previousCameraX) {
				container.position.x = cameraX
				previousCameraX = cameraX
				RenderMinimap.cameraOutlineX(previousCameraX)
			}
		}

		const ratio = layout.height / window.innerHeight
		if (!delta) {
			cameraY -= 16 * ratio
		}
		if (cameraY !== previousPositionY) {
			previousPositionY = cameraY

			const offset = ratio * 96
			const lhh = layout.height / 2
			cameraY = -cameraY + lhh
			const minY = -lhh / 2 - offset
			if (cameraY < minY) {
				cameraY = minY
			} else {
				const maxY = lhh / 2 + offset
				if (cameraY > maxY) {
					cameraY = maxY
				}
			}
			if (cameraY !== previousCameraY) {
				container.position.y = cameraY
				previousCameraY = cameraY
				RenderMinimap.cameraOutlineY(previousCameraY)
			}
		}
	}

	this.layout = function () {
		return layout
	}

	this.update = function (renderTime, retro) {
		const spawnIntervalPoint = renderTime % waveInterval
		let spawnMinionWave = false
		let spawnRanged = false
		let spawnOneType = !!wavesBetweenRanged
		if (spawnIntervalPoint === waveDelay) {
			spawnMinionWave = true
		} else if (spawnOneType && waveNumber % wavesBetweenRanged === 1) {
			if (spawnIntervalPoint === waveDelay + waveRangedDelay) {
				spawnMinionWave = true
				spawnRanged = true
			}
		}
		if (spawnMinionWave) {
			if (!spawnRanged) {
				waveNumber += 1
			}
			Wave.spawn(layout.minions, spawnOneType, spawnRanged, renderTime, retro)
		}
	}

//DIMENSIONS

	this.width = function () {
		return layout.width
	}

	this.height = function () {
		return layout.height
	}

	this.centerX = function () {
		return layout.width * 0.5
	}

	this.centerY = function () {
		return layout.height * 0.5
	}

}

export default GameMap
