import * as THREE from 'three'

import Local from '@/client/play/local'

import RenderMinimap from '@/client/play/render/minimap'

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
		fogTarget = new THREE.WebGLRenderTarget(mapWidth, mapHeight, { depthBuffer: false, stencilBuffer: false })

		const fogGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight)
		const fogMaterial = new THREE.MeshBasicMaterial({ color: 0x111111, alphaMap: fogTarget.texture, depthTest: true })
		fogMaterial.transparent = true
		fogMaterial.opacity = 0.3
		const fogPlane = new THREE.Mesh(fogGeometry, fogMaterial)
		fogPlane.position.set(mapWidth / 2, mapHeight / 2, 1)
		parent.add(fogPlane)

		const fogMinimapMaterial = new THREE.MeshBasicMaterial({ color: 0x111111, alphaMap: fogTarget.texture, depthTest: true })
		fogMinimapMaterial.transparent = true
		fogMinimapMaterial.opacity = 0.2
		const fogPlaneMinimap = new THREE.Mesh(fogGeometry, fogMinimapMaterial)
		RenderMinimap.addFog(fogPlaneMinimap)

		fogCamera = new THREE.OrthographicCamera(mapWidth / -2, mapWidth / 2, mapHeight / 2, mapHeight / -2, -1024, 1024)
	},

	add (unit) {
		const geometry = new THREE.CircleBufferGeometry(FOG_RADIUS, 48)
		const circle = new THREE.Mesh(geometry, circleMaterial)
		fogScene.add(circle)
		unit.fogCircle = circle
	},

	update (units, renderer, mmRenderer) {
		const localTeam = Local.player.team
		let clearRadius = 0
		for (let idx = units.length - 1; idx >= 0; idx -= 1) {
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
			if (unit.fogRadius !== clearRadius) {
				const scale = clearRadius === 0 ? 0.0001 : clearRadius / FOG_RADIUS
				unit.fogCircle.scale.x = scale
				unit.fogCircle.scale.y = scale
				unit.fogRadius = clearRadius
			}
			if (clearRadius !== 0) {
				const position = unit.container.position
				unit.fogCircle.position.x = position.x - mapWidth / 2
				unit.fogCircle.position.y = position.y - mapHeight / 2
			}
		}

		renderer.render(fogScene, fogCamera, fogTarget)
		mmRenderer.render(fogScene, fogCamera, fogTarget)
	},

}
