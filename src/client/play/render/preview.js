const THREE = require('three')

import shipStats from '@/play/data/ships'

import Render from '@/play/render/render'

let renderer, scene, camera, cameraTarget, container, canvas, animationId

let renderWidth, renderHeight

//ANIMATE

function animate () {
  if (!renderer) {
    return
  }
  animationId = window.requestAnimationFrame(animate)

  camera.lookAt(cameraTarget)
  renderer.render(scene, camera)
}

//PUBLIC

export default {

  create () {
    canvas = document.getElementById('preview')
    renderWidth = canvas.offsetWidth
    renderHeight = canvas.offsetHeight

    const elevation = 140
    const unitRotation = -0.7

    container = Render.group()
    container.position.y = elevation
    container.rotation.z = unitRotation

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
      alpha: true,
    })
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(window.devicePixelRatio)

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

    var dirLight = new THREE.DirectionalLight(0xffffff, 0.3)
    dirLight.position.set(0, 0, 1).normalize()
    scene.add(dirLight)
    const pointLight = new THREE.PointLight(0xffffff, 0.3)
    pointLight.position.set(0, elevation, elevation)
    scene.add(pointLight)

    pointLight.castShadow = true

    scene.add(container)

    animate()
  },

  load (name, team) {
    for (let i = container.children.length - 1; i >= 0; i -= 1) {
      container.remove(container.children[i])
    }

    const statBase = shipStats[name]
    Render.voxel(team, `${name}-top`, { parent: container })
    if (statBase.split) {
      Render.voxel(team, `${name}-base`, { parent: container })
    }
  },

  destroy () {
    window.cancelAnimationFrame(animationId)
    animationId = null

    scene.remove(container)
    renderer = null
    scene = null
    camera = null
    cameraTarget = null
    container = null
    canvas = null
  },

}
