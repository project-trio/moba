const THREE = require('three')

import Vox from '@/play/external/vox'

import pointer from '@/play/render/pointer'
import RenderFog from '@/play/render/fog'

let gameScene, gameCamera, renderer

const WALL_HEIGHT = 60

let windowWidth, windowHeight

let font

//LOCAL

const resize = function () {
	windowWidth = window.innerWidth
	windowHeight = window.innerHeight

	if (!renderer) {
		return
	}

	renderer.setSize(windowWidth, windowHeight)

	gameCamera.aspect = windowWidth / windowHeight
	gameCamera.updateProjectionMatrix()
}

window.addEventListener('resize', resize)

//PUBLIC

// let counter = 0

export default {

	create () {
		pointer.bind()

		windowWidth = window.innerWidth
		windowHeight = window.innerHeight

		// Renderer

		renderer = new THREE.WebGLRenderer({
			antialias: true,
			canvas: document.getElementById('canvas'),
		})
		renderer.setPixelRatio(window.devicePixelRatio)
		renderer.shadowMap.enabled = true

		// Scene

		gameScene = new THREE.Scene()
		gameCamera = new THREE.PerspectiveCamera(90, windowWidth / windowHeight, 1, 1024)
		gameCamera.lookAt(gameScene)
		gameCamera.position.z = 512

		const ambient = new THREE.AmbientLight(0x555555, 1)
		gameScene.add(ambient)

		// const light = new THREE.DirectionalLight(0xffffff, 1)
		// light.position.set(512, 512, 512)
		// light.position.set(1, 1, 1)
		// light.target.position.set(0, 0, 1)
		// gameScene.add(light.target)

		const light = new THREE.PointLight(0xffffff, 1, 0)
		light.position.set(windowWidth / 2, windowHeight / 2, 400)

		light.castShadow = true
		light.receiveShadow = false
		gameScene.add(light)

		resize()

		return renderer
	},

	positionCamera (x, y) {
		gameCamera.position.x = x
		gameCamera.position.y = y
	},

	render () {
		pointer.reposition(gameCamera)

		renderer.render(gameScene, gameCamera)
	},

	fog (units) {
		RenderFog.update(renderer, units)
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
			const material = new THREE.MeshLambertMaterial({color: options.color})
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
			new THREE.FontLoader().load(require('@/assets/font.typeface.json'), renderText)
		}
	},

	sprite (name, options) {
		const map = new THREE.TextureLoader().load(require(`@/assets/${name}.png`))
		const material = new THREE.SpriteMaterial({map: map, color: 0xffffff, fog: true})
		const sprite = new THREE.Sprite(material)
		sprite.scale.set(88, 88, 1)
		if (options.parent) {
			options.parent.add(sprite)
		}
		return sprite
	},

	voxel (name, options) {
		const parser = new Vox.Parser()
		parser.parse(require(`@/assets/${name}.vox`)).then((voxelData) => {
			const builder = new Vox.MeshBuilder(voxelData, { voxelSize: 2 }) //TODO cache
			const mesh = builder.createMesh()
			mesh.rotation.x = Math.PI / 2
			if (options.z) {
				mesh.position.z = options.z
			}
			if (options.parent) {
				options.parent.add(mesh)
			}
			mesh.castShadow = true
			mesh.owner = options.owner
		})
	},

	// Shapes

	wall (x, y, w, h, options) {
		const geometry = new THREE.BoxBufferGeometry(w, h, WALL_HEIGHT)
		const material = new THREE.MeshLambertMaterial({color: options.color})
		const wall = new THREE.Mesh(geometry, material)
		wall.position.set(x, y, 0)
		wall.castShadow = true
		wall.receiveShadow = true
		if (options.parent) {
			options.parent.add(wall)
		}
		return wall
	},

	wallCap (x, y, radius, options) {
		const geometry = new THREE.CylinderBufferGeometry(radius, radius, WALL_HEIGHT, 16)
		const material = new THREE.MeshLambertMaterial({color: options.color})
		const wall = new THREE.Mesh(geometry, material)
		wall.rotation.set(Math.PI / 2, 0, 0)
		wall.castShadow = true
		wall.receiveShadow = true
		wall.position.set(x, y, 0)
		if (options.parent) {
			options.parent.add(wall)
		}
		return wall
	},

	ground (width, height, options) {
		const geometry = new THREE.BoxBufferGeometry(width, height, 10)
		const material = new THREE.MeshBasicMaterial({color: options.color})
		const rectangle = new THREE.Mesh(geometry, material)
		rectangle.castShadow = true
		rectangle.receiveShadow = true
		rectangle.position.set(width / 2, height / 2, -10)

		options.floor.add(rectangle)

		RenderFog.create(width, height, options.ceiling)

		return rectangle
	},

	rectangle (x, y, w, h, options) {
		const geometry = new THREE.BoxBufferGeometry(w, h, options.depth || 1)
		const material = new THREE.MeshBasicMaterial({color: options.color})
		const rectangle = new THREE.Mesh(geometry, material)
		rectangle.position.set(x, y, options.z || 0)
		if (options.parent) {
			options.parent.add(rectangle)
		}
		return rectangle
	},

	sphere (radius, options) {
		const geometry = new THREE.SphereBufferGeometry(radius)
		const material = new THREE.MeshStandardMaterial({color: options.color})
		const sphere = new THREE.Mesh(geometry, material)
		sphere.castShadow = true

		if (options.parent) {
			options.parent.add(sphere)
		}
		return sphere
	},

}
