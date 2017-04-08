import * as THREE from 'three'

import store from '@/store'

import dataConstants from '@/play/data/constants'

import Vox from '@/play/external/vox'

import pointer from '@/play/render/pointer'
import RenderFog from '@/play/render/fog'
import RenderMinimap from '@/play/render/minimap'

const WALL_HEIGHT = 60

let gameScene, gameCamera, renderer
let pixelMultiplier = null

let font
let voxelCache

//LOCAL

const resize = function () {
  const width = window.innerWidth
  const height = window.innerHeight

  const resolution = store.state.settings.resolution
  let newPixelMultiplier = window.devicePixelRatio / (resolution === 0 ? 4 : resolution === 1 ? 2 : 1)
  if (newPixelMultiplier !== pixelMultiplier) {
    pixelMultiplier = newPixelMultiplier
    renderer.setPixelRatio(newPixelMultiplier)
  }
  renderer.setSize(width, height)

  gameCamera.aspect = width / height
  gameCamera.updateProjectionMatrix()
}

//PUBLIC

export default {

  createRenderer () {
    pixelMultiplier = null

    renderer = new THREE.WebGLRenderer({
      antialias: store.state.settings.antialias,
      canvas: document.getElementById('canvas'),
    })
    const shadowQuality = store.state.settings.shadows
    renderer.shadowMap.enabled = shadowQuality >= 1
    if (shadowQuality >= 2) {
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
    }
    resize()
  },

  create () {
    voxelCache = [{}, {}]

    // Scene

    gameScene = new THREE.Scene()
    gameCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight)
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
    window.addEventListener('resize', resize)
  },

  destroy () {
    window.removeEventListener('resize', resize)
    gameScene = null
    gameCamera = null
    renderer = null
    pixelMultiplier = null
    voxelCache = null
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

  voxelMesh (mesh, team, options) {
    mesh.rotation.x = Math.PI / 2
    if (options.z) {
      mesh.position.z = options.z
    }
    if (options.parent) {
      options.parent.add(mesh)
    }
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.owner = options.owner
    return mesh
  },

  voxel (team, name, options) {
    let builder = options.cache && voxelCache ? voxelCache[team][name] : null
    if (builder) {
      const mesh = builder.createMesh()
      return this.voxelMesh(mesh, team, options)
    }
    new Vox.Parser().parse(require(`@/assets/${name}.vox`)).then((voxelData) => {
      let builder = new Vox.MeshBuilder(voxelData, { voxelSize: 2 }) //TODO cache
      if (options.cache) {
        voxelCache[team][name] = builder
      }
      const mesh = builder.createMesh()
      mesh.material.color.setHex(dataConstants.teamColors[team])
      return this.voxelMesh(mesh, team, options)
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
