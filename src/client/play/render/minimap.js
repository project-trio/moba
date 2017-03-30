const THREE = require('three')

import Local from '@/play/local'

import dataConstants from '@/play/data/constants'

let renderer, scene, camera

let renderWidth, renderHeight

let mapWidth, mapHeight

export default {

  create (w, h) {
    mapWidth = w
    mapHeight = h
    renderHeight = 200
    renderWidth = w / h * renderHeight

    const canvas = document.getElementById('minimap')
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
    })
    canvas.style.width = `${renderWidth}px`
    canvas.style.height = `${renderHeight}px`

    scene = new THREE.Scene()
    scene.background = new THREE.Color(0xdddddd)

    camera = new THREE.OrthographicCamera(renderWidth / -2, renderWidth / 2, renderHeight / 2, renderHeight / -2, -1024, 1024)
  },

  add (unit, unitScale) {
    const size = unitScale * 1.5 + (unit.isLocal ? 3 : 1.5)
    const geometry = new THREE.CircleBufferGeometry(size, unit.isLocal ? 16 : 4)
    const color = unit.isLocal ? 0x008844 : dataConstants.teamColors[unit.team]
    const material = new THREE.MeshBasicMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
    unit.minimapCircle = mesh
  },

  update (units) {
    const localTeam = Local.player.team
    for (let idx = 0; idx < units.length; idx += 1) {
      const unit = units[idx]
      let showing = true
      if (unit.isDying) {
        showing = false
      } else if (!unit.renderInBackground && unit.team !== localTeam && !unit.visibleForFrame) {
        showing = false
      }
      unit.minimapCircle.visible = showing
      if (showing) {
        const position = unit.container.position
        unit.minimapCircle.position.x = (position.x / mapWidth) * renderWidth - renderWidth / 2
        unit.minimapCircle.position.y = (position.y / mapHeight) * renderHeight - renderHeight / 2
      }
    }

    renderer.render(scene, camera)
  },

}
