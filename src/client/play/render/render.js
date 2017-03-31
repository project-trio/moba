const THREE = require('three')

import store from '@/store'

import Vox from '@/play/external/vox'

import pointer from '@/play/render/pointer'
import RenderFog from '@/play/render/fog'
import RenderMinimap from '@/play/render/minimap'

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

  createRenderer () {
    const quality = store.state.settings.quality
    renderer = new THREE.WebGLRenderer({
      antialias: quality > 0,
      canvas: document.getElementById('canvas'),
    })
    renderer.shadowMap.enabled = quality > 0
    if (quality > 0) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }
    renderer.setPixelRatio(window.devicePixelRatio)
    resize()
  },

  create () {
    pointer.bind()

    resize()

    // Scene

    gameScene = new THREE.Scene()
    gameCamera = new THREE.PerspectiveCamera(90, windowWidth / windowHeight)
    gameCamera.lookAt(gameScene)
    gameCamera.position.z = 512

    const ambientLight = new THREE.AmbientLight(0x666666, 1)
    gameScene.add(ambientLight)

    // Shadow

    const light = new THREE.DirectionalLight(0xeeeeee, 1)
    gameScene.add(light)
    light.position.set(10, -50, 10)
    light.target.position.set(15, -40, 0)
    gameScene.add(light.target)

    light.castShadow = true
    light.shadow.enabled = true
    const projectionSize = 1000
    light.shadow.camera.left = -projectionSize
    light.shadow.camera.right = projectionSize
    light.shadow.camera.top = projectionSize
    light.shadow.camera.bottom = -projectionSize
    light.shadow.camera.near = 1
    light.shadow.camera.far = 10000000
    light.shadow.mapSize.width = 1024
    light.shadow.mapSize.height = 1024

    // const helper = new THREE.CameraHelper(light.shadow.camera)
    // gameScene.add(helper)

    this.createRenderer()
  },

  positionCamera (x, y) {
    gameCamera.position.x = x
    gameCamera.position.y = y
  },

  render (units) {
    pointer.reposition(gameCamera)

    renderer.render(gameScene, gameCamera)

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
      if (options.teamColor) {
        mesh.material.color.setHex(options.teamColor)
      }
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.owner = options.owner
    })
  },

  // Map

  wall (x, y, w, h, options) {
    const geometry = new THREE.BoxBufferGeometry(w, h, WALL_HEIGHT)
    const material = new THREE.MeshLambertMaterial({color: options.color || 0x888888})
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
    const material = new THREE.MeshLambertMaterial({color: options.color || 0x888888})
    const wall = new THREE.Mesh(geometry, material)
    wall.rotation.set(Math.PI / 2, 0, 0)
    wall.castShadow = true
    wall.receiveShadow = false
    wall.position.set(x, y, 0)
    if (options.parent) {
      options.parent.add(wall)
    }
    return wall
  },

  ground (width, height, options) {
    const geometry = new THREE.BoxBufferGeometry(width, height, 10)
    const material = new THREE.MeshLambertMaterial({color: options.color})
    const rectangle = new THREE.Mesh(geometry, material)
    rectangle.castShadow = false
    rectangle.receiveShadow = true
    rectangle.position.set(width / 2, height / 2, -10)

    options.floor.add(rectangle)

    RenderMinimap.create(width, height)
    RenderFog.create(width, height, options.ceiling)

    return rectangle
  },

  // Shapes

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

  circle (radius, options) {
    const geometry = new THREE.CircleBufferGeometry(radius, 32)
    const material = new THREE.MeshBasicMaterial({ color: options.color })
    if (options.opacity != null) {
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
    const geometry = new THREE.RingBufferGeometry(innerRadius, innerRadius + size, options.segments || 32)
    const material = new THREE.MeshBasicMaterial({ color: options.color })
    if (options.opacity != null) {
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
    const material = new THREE.MeshStandardMaterial({color: options.color})
    const sphere = new THREE.Mesh(geometry, material)
    sphere.castShadow = true

    if (options.parent) {
      options.parent.add(sphere)
    }
    return sphere
  },

}
