const THREE = require('three')

import Local from '@/play/local'

let fogScene, fogCamera, fogTarget
let circleMaterial

let mapWidth, mapHeight

const MINI_RADIUS = 48
const FOG_RADIUS = 100

export default {

	create (w, h, parent) {
		mapWidth = w
		mapHeight = h

		circleMaterial = new THREE.MeshBasicMaterial({color: 0x000000})

		fogScene = new THREE.Scene()
		fogScene.background = new THREE.Color(0xffffff)
		fogTarget = new THREE.WebGLRenderTarget(mapWidth, mapHeight, {})

		const fogGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight)
		const fogMaterial = new THREE.MeshBasicMaterial({color: 0x000000, alphaMap: fogTarget.texture, depthTest: false, depthWrite: false})
		fogMaterial.transparent = true
		fogMaterial.opacity = 0.3

		fogCamera = new THREE.OrthographicCamera(mapWidth / -2, mapWidth / 2, mapHeight / 2, mapHeight / -2, -1024, 1024)

		const fogPlane = new THREE.Mesh(fogGeometry, fogMaterial)
		fogPlane.position.set(mapWidth / 2, mapHeight / 2, -5)
		parent.add(fogPlane)
	},

	add (unit) {
		const geometry = new THREE.CircleBufferGeometry(FOG_RADIUS, 48)
		const circle = new THREE.Mesh(geometry, circleMaterial)
		fogScene.add(circle)
		unit.fogRadius = null
		unit.fogCircle = circle
	},

	update (renderer, units) {
		const localTeam = Local.player.team
		let clearRadius = 0
		for (let idx = 0; idx < units.length; idx += 1) {
			const unit = units[idx]
			if (unit.isDying) {
				clearRadius = 0
			} else if (unit.team === localTeam) {
				clearRadius = unit.isDead ? MINI_RADIUS : unit.stats.sightRange / 100
			} else if (unit.visibleForFrame) {
				clearRadius = MINI_RADIUS
			} else {
				clearRadius = 0
			}
			const circle = unit.fogCircle
			if (unit.fogRadius !== clearRadius) {
				const scale = clearRadius === 0 ? 0.0001 : clearRadius / FOG_RADIUS
				circle.scale.x = scale
				circle.scale.y = scale
				unit.fogRadius = clearRadius
			}
			if (clearRadius !== 0) {
				const position = unit.container.position
				circle.position.x = position.x - mapWidth / 2
				circle.position.y = position.y - mapHeight / 2
			}
		}

		renderer.render(fogScene, fogCamera, fogTarget)
	},

}
