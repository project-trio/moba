import * as THREE from 'three'

import store from '@/store'

import shipStats from '@/play/data/ships'
import retroShipStats from '@/play/data/ships-retro'

import Animate from '@/play/game/helpers/animate'

import OutlineEffect from '@/play/external/OutlineEffect'
import Render from '@/play/render/render'

import Unit from '@/play/game/entity/unit/unit'

let renderer, outlineEffect, scene, camera, cameraTarget, container, shipContainer, canvas, animationId
let renderWidth, renderHeight
let statBase = null

let spinDirection = 1
const spinCutoff = 0.02

//ANIMATE

function animate (time) {
	if (!renderer) {
		return
	}
	animationId = window.requestAnimationFrame(animate)

	container.updateAnimations(time)

	if (statBase) {
		let rotateContainer = false
		if (container.tween) {
			container.tween(time)
			rotateContainer = true
		}
		const rotationBase = shipContainer.children[0]
		if (rotationBase) {
			const random = Math.random()
			if (random < spinCutoff) {
				if (random < spinCutoff / 2) {
					spinDirection = Math.sign(random - spinCutoff / 4)
				} else {
					spinDirection = 0
				}
			}
			if (spinDirection !== 0) {
				const spin = random / 200 * spinDirection
				if (rotateContainer) {
					shipContainer.rotation.z += spin
				} else {
					rotationBase.rotation.y += spin
				}
			}
		}
	}

	camera.lookAt(cameraTarget)
	outlineEffect.render(scene, camera)
}

//PUBLIC

export default {

	create () {
		canvas = document.getElementById('preview')
		if (!canvas) {
			return
		}
		renderWidth = canvas.offsetWidth
		renderHeight = canvas.offsetHeight

		const elevation = 140
		const unitRotation = -0.7

		container = Render.group()
		container.position.y = elevation
		shipContainer = Render.group()
		container.rotation.z = unitRotation
		container.add(shipContainer)
		container.model = shipContainer

		renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: canvas,
			alpha: true,
		})
		renderer.shadowMap.enabled = true
		renderer.shadowMap.type = THREE.PCFSoftShadowMap
		renderer.setPixelRatio(window.devicePixelRatio)

		outlineEffect = new OutlineEffect(renderer, {
			defaultKeepAlive: false,
		})

		scene = new THREE.Scene()

		const geometry = new THREE.PlaneBufferGeometry(128, 128)
		const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa })
		const rectangle = new THREE.Mesh(geometry, material)
		rectangle.rotation.z = unitRotation

		scene.add(rectangle)
		rectangle.castShadow = false
		rectangle.receiveShadow = true
		rectangle.position.y = elevation
		// rect.rotation.z = 1

		camera = new THREE.PerspectiveCamera(25, renderWidth / renderHeight, 1, 1500)
		camera.position.set(0, -50, 200)
		cameraTarget = new THREE.Vector3(0, 150, 0)

		const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
		scene.add(ambientLight)

		const dirLight = new THREE.DirectionalLight(0xffffff, 0.3)
		dirLight.position.set(0, 0, 1).normalize()
		scene.add(dirLight)
		const pointLight = new THREE.PointLight(0xffffff, 0.3)
		pointLight.position.set(0, elevation, elevation)
		scene.add(pointLight)

		pointLight.castShadow = true

		scene.add(container)
		Animate.apply(container)

		animate()
	},

	load (name, team, retro) {
		for (let i = shipContainer.children.length - 1; i >= 0; i -= 1) {
			shipContainer.remove(shipContainer.children[i])
		}
		shipContainer.rotation.z = 0

		statBase = retro ? retroShipStats[name] : shipStats[name]
		store.setSelectedUnit({
			sample: true,
			name: name,
			maxLevel: true,
			stats: {
				healthMax: statBase.healthMax[0] * 100,
				attackPierce: statBase.attackPierce[0] * 100,
				attackRange: statBase.attackRange[0] * 100,
				attackDamage: statBase.attackDamage[0],
			},
			current: {
				attackCooldown: statBase.attackCooldown[0],
			},
			cacheMoveSpeed: statBase.moveSpeed[0] / 5000,
			armorCheck: Unit.calculateArmor(statBase.armor[0]),
		})

		const renderTime = performance.now()
		container.reemergeAt = renderTime + 300
		container.statBase = statBase
		statBase.create(name, team, shipContainer, shipContainer, container)
		container.tween = statBase.tween
		if (statBase.onRespawn) {
			container.onRespawn = statBase.onRespawn
			container.onRespawn(renderTime)
		}
	},

	destroy () {
		window.cancelAnimationFrame(animationId)
		animationId = null

		if (scene) {
			scene.remove(container)
			scene = null
		}
		renderer = null
		outlineEffect = null
		camera = null
		cameraTarget = null
		container = null
		shipContainer = null
		statBase = null
		canvas = null
	},

}
