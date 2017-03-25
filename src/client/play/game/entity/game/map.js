import store from '@/store'

import Bridge from '@/play/events/bridge'
import Local from '@/play/local'

import pointer from '@/play/render/pointer'
import Render from '@/play/render/render'

import Tower from '@/play/game/entity/unit/tower'

//LAYOUTS

const maps = {}

const wallRadius = 24

maps.tiny = {
	width: 800,
	height: 800,
	towers: [
		['base', 400, 44, false],
		['standard', 320, 320, false],
	],
	walls: [
		{
			x: 650, y: 260,
			w: 300, h: wallRadius * 2,
			capStart: true,
		},
	],
}

const wallSmallH = 50

maps.small = {
	width: 800,
	height: 1400,

	towers: [
		['base', 400, 44, false],
		['turret', 190, 380, true],
		['turret', 470, 600, false],
	],

	walls: [ //TODO arrays of connection points
		{
			x: 240, y: 320,
			w: wallSmallH * 2, h: wallRadius * 2,
			capStart: true, capEnd: true,
			mirror: true,
		},
		{
			x: 240 - wallSmallH, y: 320 - wallSmallH,
			w: wallRadius * 2, h: wallSmallH * 2,
			capStart: true, capEnd: false,
			mirror: true,
		},
	],
}

const wallStandardH = 60

maps.standard = {
	width: 1200,
	height: 2000,

	towers: [
		['base', 600, 44, false],
		['standard', 435, 360, true],
		['turret', 44, 440, true],
		['turret', 300, 840, true],
	],

	walls: [
		{
			x: 320, y: 360,
			w: wallStandardH * 2, h: wallRadius * 2,
			capStart: true, capEnd: true,
			mirror: true,
		},
		{
			x: 320 - wallStandardH, y: 360 - wallStandardH,
			w: wallRadius * 2, h: wallStandardH * 2,
			capStart: true, capEnd: false,
			mirror: true,
		},
	],

	minions: [
		{
			type: 'melee',
			paths: [
				[[520, 90, 0, 0], [90, 100, 1000, -23], [90, 360, 0, -1000], [260, 880, -311, -950], [260, 900, 0, -1000]],
				[[520, 60, 0, 0], [120, 70, 1000, -25], [120, 390, 0, -1000], [300, 880, -345, -939], [300, 900, 0, -1000]],
				[[520, 30, 0, 0], [150, 40, 1000, -27], [150, 420, 0, -1000], [340, 880, -382, -924], [340, 900, 0, -1000]],
			],
			mirror: true,
		},
		{
			type: 'ranged',
			paths: [
				[[560, 74, 0, 0], [560, 900, 0, -1000]],
				[[600, 80, 0, 0], [600, 900, 0, -1000]],
				[[640, 74, 0, 0], [640, 900, 0, -1000]],
			],
			mirror: false,
		},
	],
}

//CONSTRUCTOR

const GameMap = function (parent) {

	let layout

	Render.create()

	let container = Render.group()
	const floorContainer = Render.group()
	const wallContainer = Render.group()
	const infoContainer = Render.group()
	const fogContainer = Render.group()
	floorContainer.add(wallContainer)
	container.add(floorContainer)
	container.add(infoContainer)
	container.add(fogContainer)
	parent.add(container)
	this.floorContainer = floorContainer

	pointer.setParent(floorContainer)

	const walls = []

//LISTEN

	let previousPositionX, previousPositionY, previousCameraX, previousCameraY

	container.interactive = true

//MANAGE

	const sightsArray = []

	this.addSight = function (sight) {
		sightsArray.push(sight)
	}

	this.addInfo = function (container) {
		infoContainer.add(container)
	}

	this.blockCheck = function (moveX, moveY) {
		if (moveX < 1 || moveY < 1 || moveX >= layout.width * 1000 || moveY >= layout.height * 1000) {
			return null
		}
		return walls
	}

	const createWallRect = function (x, y, w, h) {
		walls.push([(x - w / 2) * 100, (y - h / 2) * 100, w * 100, h * 100])

		Render.wall(x, y, w, h, {
			parent: wallContainer,
		})
	}

	const createWallCap = function (vertical, x, y, radius) {
		radius = radius / 2
		walls.push([x * 100, y * 100, radius * 100])

		Render.wallCap(x, y, radius, {
			parent: wallContainer,
		})
	}

	this.build = function (name) {
		name = 'standard'
		layout = maps[name]

		const mapWidth = layout.width
		const mapHeight = layout.height
		Render.positionCamera(mapWidth / 2, mapHeight / 2)

		const ground = Render.ground(mapWidth, mapHeight, {
			color: 0x448866,
			floor: floorContainer,
			ceiling: fogContainer,
		})
		ground.owner = ground

		let automateTimer = null
		ground.onClick = (point) => {
			const localUnit = Local.player.unit
			if (localUnit.canMove()) {
				const diffX = Math.round(point.x) - previousCameraX
				const diffY = Math.round(point.y) - previousCameraY
				Bridge.emit('action', { target: [diffX, diffY] })

				if (automateTimer) {
					clearInterval(automateTimer)
					automateTimer = null
				}
			}
			store.setSelectedUnit(localUnit)
			return true
		}

		if (Local.TESTING) {
			automateTimer = setInterval(() => { //SAMPLE
				if (Local.player) {
					const dx = Math.round(Math.random() * layout.width)
					const dy = Math.round(Math.random() * layout.height)
					Bridge.emit('action', { target: [dx, dy] })
				}
			}, Math.random() * 2000 + 1000)
		}

		for (let idx = 0; idx < layout.walls.length; idx += 1) {
			const wall = layout.walls[idx]
			let w = wall.w
			let h = wall.h
			let vertical = h > w

			for (let team = 0; team < 2; team += 1) {
				const firstTeam = team === 0
				let tx = firstTeam ? mapWidth - wall.x : wall.x
				let ty = firstTeam ? mapHeight - wall.y : wall.y
				const teamMp = firstTeam ? -1 : 1

				for (let mirror = 0; mirror < (wall.mirror ? 2 : 1); mirror += 1) {
					const mirrored = mirror > 0
					const mirroredMp = mirrored ? 1 : -1
					if (mirrored) {
						tx = (mapWidth - tx)
					}
					if (wall.capStart) {
						let capX = tx
						let capY = ty
						if (vertical) {
							capY = ty - h / 2 * teamMp
						} else {
							capX = tx + w / 2 * teamMp * mirroredMp
						}
						createWallCap(vertical, capX, capY, Math.min(w, h))
					}
					if (wall.capEnd) {
						let capX = tx
						let capY = ty
						if (vertical) {
							capY = ty + h / 2 * teamMp
						} else {
							capX = tx - w / 2 * teamMp * mirroredMp
						}
						createWallCap(vertical, capX, capY, Math.min(w, h))
					}
					createWallRect(tx, ty, w, h)
				}
			}
		}
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
					new Tower(team, towerType, tx, ty)
				}
			}
		}
	}

	this.destroy = function () {
		if (container) {
			container.destroy()
			container = null
		}
	}

	this.track = function (cameraX, cameraY) {
		if (cameraX != previousPositionX) {
			previousPositionX = cameraX

			const lwh = layout.width / 2
			cameraX = -cameraX + lwh
			if (cameraX < -lwh / 2) {
				cameraX = -lwh / 2
			} else if (cameraX > lwh / 2) {
				cameraX = lwh / 2
			}
			if (cameraX != previousCameraX) {
				container.position.x = cameraX
				previousCameraX = cameraX
			}
		}
		if (cameraY != previousPositionY) {
			previousPositionY = cameraY

			const lhh = layout.height / 2
			cameraY = -cameraY + lhh
			if (cameraY < -lhh / 2) {
				cameraY = -lhh / 2
			} else if (cameraY > lhh / 2) {
				cameraY = lhh / 2
			}
			if (cameraY != previousCameraY) {
				container.position.y = cameraY
				previousCameraY = cameraY
			}
		}
	}

	this.minionData = function () {
		return layout.minions
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
