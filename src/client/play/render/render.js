import * as THREE from 'three'

import store from '@/store'
import util from '@/helpers/util'

import dataConstants from '@/play/data/constants'

import Vox from '@/play/external/vox'
import OutlineEffect from '@/play/external/OutlineEffect'

import pointer from '@/play/render/pointer'
import RenderFog from '@/play/render/fog'
import RenderMinimap from '@/play/render/minimap'

THREE.Cache.enabled = true

const WALL_HEIGHT = 50

const CAMERA_FOV = 60
const CAMERA_HEIGHT = 256 / (CAMERA_FOV / 180)

let gameScene, gameCamera, renderer, outlineEffect
let audioListener, gameSound, audioLoader
let pixelMultiplier = null

let font
let voxelCache

//LOCAL

const resize = function () {
  const width = window.innerWidth
  const height = window.innerHeight

  let newPixelMultiplier = window.devicePixelRatio / (store.state.settings.fullResolution ? 1 : 2)
  if (newPixelMultiplier !== pixelMultiplier) {
    pixelMultiplier = newPixelMultiplier
    renderer.setPixelRatio(newPixelMultiplier)
  }
  renderer.setSize(width, height)

  gameCamera.aspect = width / height
  gameCamera.updateProjectionMatrix()

  const visibleFOV = gameCamera.fov * Math.PI / 180
  const visibleHeight = 2 * Math.tan(visibleFOV / 2) * gameCamera.position.z
  const visibleWidth = visibleHeight * gameCamera.aspect
  RenderMinimap.drawCameraOutline(visibleWidth, visibleHeight)
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

    outlineEffect = new OutlineEffect(renderer, {
      defaultThickness: 0.0015,
      defaultKeepAlive: false,
    })

    resize()
  },

  create () {
    voxelCache = [{}, {}]

    // Scene

    gameScene = new THREE.Scene()
    gameCamera = new THREE.PerspectiveCamera(CAMERA_FOV)
    // gameCamera = new THREE.OrthographicCamera(window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -CAMERA_HEIGHT, CAMERA_HEIGHT)
    gameCamera.position.z = CAMERA_HEIGHT

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

    audioListener = new THREE.AudioListener()
    gameCamera.add(audioListener)
    gameSound = new THREE.Audio(audioListener)
    audioLoader = new THREE.AudioLoader()

    this.createRenderer()
    util.addListener(window, 'resize', resize)
  },

  destroy () {
    util.removeListener(window, 'resize', resize)
    gameScene = null
    gameCamera = null
    renderer = null
    pixelMultiplier = null
    voxelCache = null

    audioListener = null
    gameSound = null
    audioLoader = null
    RenderMinimap.destroy()
  },

  playSound (name) {
    audioLoader.load(`${name}.mp3`, (buffer) => {
      gameSound.setBuffer(buffer)
      gameSound.play()
    })
  },

  positionCamera (x, y) {
    gameCamera.position.x = x
    gameCamera.position.y = y
  },

  render (units) {
    pointer.reposition(gameCamera)

    outlineEffect.render(gameScene, gameCamera)

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
    if (options.audio) {
      const audio = new THREE.PositionalAudio(audioListener)
      mesh.add(audio)
      mesh.owner.audio = audio
    }
    return mesh
  },

  voxel (team, type, name, options) {
    let builder = options.cache && voxelCache ? voxelCache[team][name] : null
    if (builder) {
      const mesh = builder.createMesh()
      return this.voxelMesh(mesh, team, options)
    }
    new Vox.Parser().parse(require(`@/assets/${type}/${name}.vox`)).then((voxelData) => {
      builder = new Vox.MeshBuilder(voxelData, { voxelSize: 2 })
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
    new Vox.Parser().parse(require(`@/assets/${type}/${name}.vox`)).then((voxelData) => {
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

  wall (team, x, y, w, h, parent) {
    const geometry = new THREE.BoxBufferGeometry(w, h, WALL_HEIGHT)
    const material = new THREE.MeshLambertMaterial({ color: dataConstants.wallColors[team] })
    material.outlineParameters = {
      color: new THREE.Color(dataConstants.darkColors[team]),
    }
    const wall = new THREE.Mesh(geometry, material)
    wall.position.set(x, y, WALL_HEIGHT / 2)
    wall.castShadow = true
    wall.receiveShadow = true
    parent.add(wall)
    return wall
  },

  wallCap (team, x, y, radius, parent) {
    const geometry = new THREE.CylinderBufferGeometry(radius, radius, WALL_HEIGHT, 32)
    const material = new THREE.MeshLambertMaterial({ color: dataConstants.wallColors[team] })
    material.outlineParameters = {
      color: new THREE.Color(dataConstants.darkColors[team]),
    }
    const wall = new THREE.Mesh(geometry, material)
    wall.rotation.set(Math.PI / 2, 0, 0)
    wall.castShadow = true
    wall.receiveShadow = false
    wall.position.set(x, y, WALL_HEIGHT / 2)
    parent.add(wall)
    return wall
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
    const segments = Math.ceil(radius / 21) * 8
    const geometry = new THREE.CircleBufferGeometry(radius, segments)
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
    const segments = options.segments || Math.ceil(innerRadius / 16) * 8
    const geometry = new THREE.RingBufferGeometry(innerRadius, innerRadius + size, segments)
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
    sphere.castShadow = true

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
