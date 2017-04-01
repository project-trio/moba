const THREE = require('three')

import Local from '@/play/local'

import dataConstants from '@/play/data/constants'

let renderer, scene, camera

let renderWidth, renderHeight, mapScale

export default {

  create (w, h) {
    renderHeight = 200
    renderWidth = w / h * renderHeight
    mapScale = renderHeight / h

    const canvas = document.getElementById('minimap')
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
    })
    renderer.setPixelRatio(window.devicePixelRatio)

    canvas.style.width = `${renderWidth}px`
    canvas.style.height = `${renderHeight}px`

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xcccccc) // 0x448866

    camera = new THREE.OrthographicCamera(renderWidth / -2, renderWidth / 2, renderHeight / 2, renderHeight / -2, -1024, 1024)
  },

  addFog (fogPlane) {
    fogPlane.scale.x = mapScale
    fogPlane.scale.y = mapScale
    scene.add(fogPlane)
  },

  add (unit, unitScale) {
    const size = unitScale * 1.5 + (unit.isLocal ? 3 : 1.5)
    const geometry = new THREE.CircleBufferGeometry(size, unit.isLocal ? 16 : 4)
    const color = unit.isLocal ? 0x222222 : dataConstants.teamColors[unit.team]
    const material = new THREE.MeshBasicMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    unit.minimapCircle = mesh
    const showing = unit.renderInBackground
    if (showing) {
      const position = unit.container.position
      mesh.position.x = position.x * mapScale - renderWidth / 2
      mesh.position.y = position.y * mapScale - renderHeight / 2
      mesh.position.z = 2
    } else {
      if (unit.isLocal) {
        // mesh.position.z = 3
      }
      mesh.visible = false
    }
  },

  addWall (x, y, w, h, team) {
    const geometry = new THREE.PlaneBufferGeometry(w * mapScale, h * mapScale)
    const material = new THREE.MeshBasicMaterial({ color: dataConstants.wallColors[team] })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = x * mapScale - renderWidth / 2
    mesh.position.y = y * mapScale - renderHeight / 2
    mesh.position.z = 1
    scene.add(mesh)
  },

  addWallCap (x, y, r, team) {
    const geometry = new THREE.CircleBufferGeometry(r * mapScale, 8)
    const material = new THREE.MeshBasicMaterial({ color: dataConstants.wallColors[team] })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.x = x * mapScale - renderWidth / 2
    mesh.position.y = y * mapScale - renderHeight / 2
    mesh.position.z = 1
    scene.add(mesh)
  },

  update (units) {
    const localTeam = Local.player.team
    for (let idx = 0; idx < units.length; idx += 1) {
      const unit = units[idx]
      let showing = true
      if (unit.isDying) {
        showing = false
      } else if (unit.renderInBackground) {
        continue
      } else if (unit.team !== localTeam && !unit.visibleForFrame) {
        showing = false
      }
      unit.minimapCircle.visible = showing
      if (showing) {
        const position = unit.container.position
        unit.minimapCircle.position.x = position.x * mapScale - renderWidth / 2
        unit.minimapCircle.position.y = position.y * mapScale - renderHeight / 2
      }
    }

    renderer.render(scene, camera)
    return renderer
  },

}
