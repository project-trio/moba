import * as THREE from 'three'

import store from '@/client/store'
import util from '@/client/helpers/util'

import dataConstants from '@/client/play/data/constants'

import Vox from '@/client/play/external/vox'
import OutlineEffect from '@/client/play/external/OutlineEffect'

import Pointer from '@/client/play/render/pointer'
import RenderFog from '@/client/play/render/fog'
import RenderMinimap from '@/client/play/render/minimap'
import RenderSound from '@/client/play/render/sound'

THREE.Cache.enabled = true

const WALL_HEIGHT = 50

const CAMERA_FOV = 60
const CAMERA_OFF = 256
const CAMERA_HEIGHT = CAMERA_OFF / (CAMERA_FOV / 180)

let gameScene, renderer, outlineEffect, gameLight
let gameCamera, perspectiveCamera, orthoCamera
let audioListener
let pixelMultiplier = null
let usePerspectiveCamera = null

let font
let voxelCache

const teamMaterials = [ new THREE.MeshBasicMaterial({ color: dataConstants.teamColors[0] }), new THREE.MeshBasicMaterial({ color: dataConstants.teamColors[1] }) ]

//LOCAL

const resize = function () {
	const width = window.innerWidth
	const height = window.innerHeight

	const newPerspectiveSetting = store.state.settings.perspective
	if (newPerspectiveSetting !== usePerspectiveCamera) {
		usePerspectiveCamera = newPerspectiveSetting
		let oldX, oldY
		if (gameCamera) {
			gameCamera.remove(audioListener)
			oldX = gameCamera.position.x
			oldY = gameCamera.position.y
		}
		if (usePerspectiveCamera) {
			gameCamera = perspectiveCamera
		} else {
			gameCamera = orthoCamera
		}
		if (oldX !== undefined) {
			gameCamera.position.x = oldX
			gameCamera.position.y = oldY
		}
		gameCamera.position.z = CAMERA_HEIGHT
		gameCamera.add(audioListener)
	}

	let newPixelMultiplier = window.devicePixelRatio / (store.state.settings.fullResolution ? 1 : 2)
	if (newPixelMultiplier !== pixelMultiplier) {
		pixelMultiplier = newPixelMultiplier
		renderer.setPixelRatio(newPixelMultiplier)
	}
	renderer.setSize(width, height)

	let visibleWidth, visibleHeight
	if (usePerspectiveCamera) {
		gameCamera.aspect = width / height
		const visibleFOV = gameCamera.fov * Math.PI / 180
		visibleHeight = 2 * Math.tan(visibleFOV / 2) * CAMERA_HEIGHT
		visibleWidth = visibleHeight * gameCamera.aspect
	} else {
		const cameraZoom = height / (CAMERA_OFF / 0.575)
		const zoomWidth = width / cameraZoom
		const zoomHeight = height / cameraZoom
		gameCamera.left = -zoomWidth
		gameCamera.right = zoomWidth
		gameCamera.top = zoomHeight
		gameCamera.bottom = -zoomHeight
		visibleWidth = zoomWidth * 2
		visibleHeight = zoomHeight * 2
	}
	gameCamera.updateProjectionMatrix()
	RenderMinimap.drawCameraOutline(visibleWidth, visibleHeight)
}

//PUBLIC

export default {

	resize,

	createRenderer () {
		pixelMultiplier = null

		renderer = new THREE.WebGLRenderer({
			// antialias: store.state.settings.antialias,
			canvas: document.getElementById('canvas'),
		})

		perspectiveCamera = new THREE.PerspectiveCamera(CAMERA_FOV)
		orthoCamera = new THREE.OrthographicCamera()

		const shadowQuality = store.state.settings.shadows
		const renderShadow = shadowQuality >= 1
		gameLight.castShadow = renderShadow
		renderer.shadowMap.enabled = renderShadow
		if (renderShadow) {
			renderer.shadowMap.type = shadowQuality >= 2 ? THREE.PCFSoftShadowMap : THREE.BasicShadowMap
		}

		this.toggleOutline(store.state.settings.outline)

		resize()
	},

	toggleOutline (enabled) {
		if (enabled) {
			outlineEffect = new OutlineEffect(renderer, {
				defaultThickness: 0.0015,
				defaultKeepAlive: false,
			})
		} else {
			outlineEffect = null
		}
	},

	create () {
		voxelCache = [{}, {}]

		// Scene

		gameScene = new THREE.Scene()

		const ambientLight = new THREE.AmbientLight(0x666666, 1)
		gameScene.add(ambientLight)

		gameLight = new THREE.DirectionalLight(0xdddddd, 1)
		gameScene.add(gameLight)
		gameLight.position.set(10, -50, 20)
		gameLight.target.position.set(15, -40, 0)
		gameScene.add(gameLight.target)

		const projectionSize = 1500
		gameLight.shadow.camera.left = -projectionSize
		gameLight.shadow.camera.right = projectionSize
		gameLight.shadow.camera.top = projectionSize
		gameLight.shadow.camera.bottom = -projectionSize
		gameLight.shadow.camera.near = 1
		gameLight.shadow.camera.far = 2048
		gameLight.shadow.mapSize.width = 2048
		gameLight.shadow.mapSize.height = 2048

		audioListener = RenderSound.create(audioListener)

		// const helper = new THREE.CameraHelper(gameLight.shadow.camera)
		// gameScene.add(helper)

		this.createRenderer()

		util.addListener(window, 'resize', resize)
	},

	destroy () {
		util.removeListener(window, 'resize', resize)
		gameScene = null
		gameCamera = null
		perspectiveCamera = null
		orthoCamera = null
		renderer = null
		outlineEffect = null
		pixelMultiplier = null
		voxelCache = null
		usePerspectiveCamera = null
		gameLight = null
		audioListener = null
		font = null

		RenderMinimap.destroy()
		RenderSound.destroy()
		RenderFog.destroy()
	},

	positionCamera (x, y) {
		gameCamera.position.x = x
		gameCamera.position.y = y
	},

	render (units) {
		Pointer.reposition(gameCamera)

		if (outlineEffect) {
			outlineEffect.render(gameScene, gameCamera)
		} else {
			renderer.render(gameScene, gameCamera)
		}

		const mmRenderer = RenderMinimap.update(units)
		RenderFog.update(units, renderer, mmRenderer)
	},

	addUnit (unit, unitScale) {
		RenderFog.add(unit)
		RenderMinimap.add(unit, unitScale)
	},

	remove (object) {
		object.parent.remove(object)
	},

	add (object) {
		gameScene.add(object)
	},

	group () {
		return new THREE.Group()
	},

	text (string, x, y, options) {
		const renderText = (newFont) => {
			font = newFont
			const geometry = new THREE.TextGeometry(string, {
				font: font,
				size: options.size,
				height: 1,
				curveSegments: 8,
				bevelEnabled: false,
				bevelThickness: 0,
				bevelSize: 0,
				bevelSegments: 0,
			})
			const material = new THREE.MeshBasicMaterial({color: options.color})
			material.outlineParameters = {
				// visible: false,
				color: new THREE.Color(0x000000),
			}
			const mesh = new THREE.Mesh(geometry, material)
			options.parent.add(mesh)
			mesh.position.set(x, y, 0)
			if (options.ref) {
				options.parent[options.ref] = mesh
			}
		}
		if (font) {
			renderText(font)
		} else {
			new THREE.FontLoader().load(require('@/client/assets/font.typeface'), renderText)
		}
	},

	sprite (name, options) {
		const map = new THREE.TextureLoader().load(require(`@/client/assets/${name}.png`))
		const material = new THREE.SpriteMaterial({map: map, color: 0xffffff, fog: true})
		const sprite = new THREE.Sprite(material)
		sprite.scale.set(88, 88, 1)
		if (options.parent) {
			options.parent.add(sprite)
		}
		return sprite
	},

	voxelMesh (mesh, team, options) {
		mesh.rotation.x = Math.PI / 2
		if (options.z) {
			mesh.position.z = options.z
		}
		if (options.parent) {
			options.parent.add(mesh)
		}
		if (options.opacity !== undefined) {
			mesh.material.transparent = true
			mesh.material.opacity = options.opacity
		}
		mesh.castShadow = true
		mesh.receiveShadow = true
		mesh.owner = options.owner
		return mesh
	},

	voxel (team, type, name, options) {
		let builder = options.cache && voxelCache ? voxelCache[team][name] : null
		if (builder) {
			const mesh = builder.createMesh()
			return this.voxelMesh(mesh, team, options)
		}
		new Vox.Parser().parse(require(`@/client/assets/${type}/${name}.vox`)).then((voxelData) => {
			builder = new Vox.MeshBuilder(voxelData, { voxelSize: options.size || 2 })
			if (voxelCache && options.cache) {
				voxelCache[team][name] = builder
			}
			const mesh = builder.createMesh()
			const teamColor = dataConstants.teamColors[team]
			const darkColor = dataConstants.darkColors[team]
			mesh.material.color.setHex(teamColor)
			mesh.material.outlineParameters = {
				color: new THREE.Color(darkColor),
			}
			return this.voxelMesh(mesh, team, options)
		})
	},

	generate (type, name, count, size, container, x, y, width, height) {
		new Vox.Parser().parse(require(`@/client/assets/${type}/${name}.vox`)).then((voxelData) => {
			const builder = new Vox.MeshBuilder(voxelData, { voxelSize: size })
			for (let i = 0; i < count; i += 1) {
				const mesh = builder.createMesh()
				mesh.material.outlineParameters = {
					visible: false,
				}
				mesh.castShadow = true
				mesh.receiveShadow = true
				mesh.position.set(x + Math.random() * Math.random() * Math.random() * width, y + Math.random() * Math.random() * Math.random() * height, 0)
				// mesh.material.transparent = true
				// mesh.material.opacity = 0.5
				mesh.rotation.x = Math.PI / 2
				mesh.rotation.y = Math.PI * 2 * Math.random()
				container.add(mesh)
			}
		})
	},

	// Map

	createWalls (array, parent) {
		const mergedGeometries = [ new THREE.Geometry(), new THREE.Geometry() ]
		let capGeometry
		for (const wall of array) {
			const x = wall[0]
			const y = wall[1]
			let geometry, team
			if (wall.length === 5) {
				const w = wall[2]
				const h = wall[3]
				team = wall[4]
				geometry = new THREE.BoxGeometry(w, h, WALL_HEIGHT)
			} else {
				team = wall[3]
				if (!capGeometry) {
					const radius = wall[2] / 2
					capGeometry = new THREE.CylinderGeometry(radius, radius, WALL_HEIGHT, 32)
					capGeometry.rotateX(Math.PI / 2)
				}
				geometry = capGeometry
			}
			geometry.translate(x, y, 0)
			mergedGeometries[team].merge(geometry)
			geometry.translate(-x, -y, 0)
		}
		for (let team = 0; team < 2; team += 1) {
			const material = new THREE.MeshLambertMaterial({ color: dataConstants.wallColors[team], blending: THREE.NoBlending })
			material.outlineParameters = {
				color: new THREE.Color(dataConstants.darkColors[team]),
			}
			const mesh = new THREE.Mesh(mergedGeometries[team], material)
			mesh.position.set(0, 0, WALL_HEIGHT / 2)
			mesh.castShadow = true
			mesh.receiveShadow = true
			parent.add(mesh)
		}
	},

	ground (width, height, options) {
		const geometry = new THREE.PlaneBufferGeometry(width, height)
		const material = new THREE.MeshLambertMaterial({ color: options.color })
		material.outlineParameters = {
			visible: false,
		}
		const rectangle = new THREE.Mesh(geometry, material)
		rectangle.castShadow = false
		rectangle.receiveShadow = true
		rectangle.position.set(width / 2, height / 2, 0)

		options.floor.add(rectangle)

		RenderMinimap.create(width, height)
		RenderFog.create(width, height, options.ceiling)

		return rectangle
	},

	// Shapes

	rectangle (x, y, w, h, options) {
		const geometry = new THREE.PlaneBufferGeometry(w, h)
		const material = new THREE.MeshBasicMaterial({ color: options.color })
		const rectangle = new THREE.Mesh(geometry, material)
		rectangle.position.set(x, y, options.z || 0)
		if (options.parent) {
			options.parent.add(rectangle)
		}
		if (options.noDepth) {
			material.depthTest = false
			rectangle.renderOrder = 999999999
		}
		return rectangle
	},

	circle (radius, options) {
		const segments = Math.ceil(radius / 16) * 8
		const geometry = new THREE.CircleBufferGeometry(radius, segments)
		const material = new THREE.MeshBasicMaterial({ color: options.color })
		if (options.opacity !== undefined) {
			material.transparent = true
			material.opacity = options.opacity
		}
		const mesh = new THREE.Mesh(geometry, material)
		if (options.parent) {
			options.parent.add(mesh)
		}
		return mesh
	},
	ring (innerRadius, size, options) {
		const segments = options.segments || Math.ceil(innerRadius / 16) * 8
		const geometry = new THREE.RingBufferGeometry(innerRadius, innerRadius + size, segments)
		const material = options.team !== undefined ? teamMaterials[options.team] : new THREE.MeshBasicMaterial({ color: options.color })
		if (options.opacity !== undefined) {
			material.transparent = true
			material.opacity = options.opacity
		}
		const mesh = new THREE.Mesh(geometry, material)
		if (options.parent) {
			options.parent.add(mesh)
		}
		return mesh
	},

	sphere (radius, options) {
		const geometry = new THREE.SphereBufferGeometry(radius, options.segments, options.segments && options.segments * 2 / 3)
		const color = options.team !== undefined ? dataConstants.teamColors[options.team] : options.color
		const material = new THREE.MeshLambertMaterial({ color })
		if (options.hideOutline) {
			material.outlineParameters = { visible: false }
		} else {
			material.outlineParameters = {
				color: new THREE.Color(dataConstants.darkColors[options.team]),
			}
		}
		if (options.opacity) {
			material.transparent = true
			material.opacity = options.opacity
		}
		const sphere = new THREE.Mesh(geometry, material)
		if (!options.hideShadow) {
			sphere.castShadow = true
		}

		if (options.parent) {
			options.parent.add(sphere)
		}
		return sphere
	},

	cube (size, options) {
		const geometry = new THREE.BoxBufferGeometry(size, size, size)
		const color = options.team !== undefined ? dataConstants.teamColors[options.team] : options.color
		const material = new THREE.MeshStandardMaterial({ color })
		if (options.hideOutline) {
			material.outlineParameters = { visible: false }
		} else {
			material.outlineParameters = {
				color: new THREE.Color(dataConstants.darkColors[options.team]),
			}
		}
		if (options.opacity) {
			material.transparent = true
			material.opacity = options.opacity
		}
		const cube = new THREE.Mesh(geometry, material)
		cube.castShadow = true

		if (options.parent) {
			options.parent.add(cube)
		}
		return cube
	},

	// Effects

	outline (mesh, color, scale) {
		const outlineMaterial = new THREE.MeshBasicMaterial({ color: color, side: THREE.BackSide })
		outlineMaterial.transparent = true
		outlineMaterial.opacity = 0.5
		const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMaterial)
		outlineMesh.scale.multiplyScalar(scale)
		mesh.add(outlineMesh)
		return outlineMesh
	},

}
