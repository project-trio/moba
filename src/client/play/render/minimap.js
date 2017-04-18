import * as THREE from 'three'

import Local from '@/play/local'

import dataConstants from '@/play/data/constants'

let renderer, scene, camera, cameraMesh

let renderWidth, renderHeight, mapScale
let startWidth, startHeight

//MOUSE

let clickActive = false

const track = function (event) {
  const clickX = event.offsetX / mapScale
  const clickY = (renderHeight - event.offsetY) / mapScale
  Local.game.map.track(clickX, clickY, false)
}

const onMouseDown = function (event) {
  clickActive = true
  track(event)
}

const onMouseMove = function (event) {
  if (!clickActive) {
    return false
  }
  track(event)
}

const onMouseCancel = function (event) {
  clickActive = false
}

//PUBLIC

export default {

  create (mapWidth, mapHeight) {
    renderHeight = 200
    renderWidth = mapWidth / mapHeight * renderHeight
    mapScale = renderHeight / mapHeight

    const canvas = document.getElementById('minimap')
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseCancel)
    canvas.addEventListener('mouseleave', onMouseCancel)

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

    const cameraOutlineGeometry = new THREE.PlaneBufferGeometry(renderWidth, renderHeight)
    const cameraOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    cameraOutlineMaterial.transparent = true
    cameraOutlineMaterial.opacity = 0.5
    cameraMesh = new THREE.Mesh(cameraOutlineGeometry, cameraOutlineMaterial)
    cameraMesh.position.z = -1
    scene.add(cameraMesh)
    this.drawCameraOutline(startWidth, startHeight)
  },

  destroy () {
    const canvas = document.getElementById('canvas')
    if (canvas) {
      canvas.removeEventListener('mousedown', onMouseDown)
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseup', onMouseCancel)
      canvas.removeEventListener('mouseleave', onMouseCancel)
    }

    renderer = null
    scene = null
    camera = null
    cameraMesh = null
  },

  addFog (fogPlane) {
    fogPlane.scale.x = mapScale
    fogPlane.scale.y = mapScale
    scene.add(fogPlane)
  },

  drawCameraOutline (width, height) {
    if (cameraMesh) {
      cameraMesh.scale.x = (width * mapScale) / renderWidth
      cameraMesh.scale.y = (height * mapScale) / renderHeight
    } else {
      startWidth = width
      startHeight = height
    }
  },

  cameraOutlineX (x) {
    if (cameraMesh) {
      cameraMesh.position.x = -(x * mapScale)
    }
  },
  cameraOutlineY (y) {
    if (cameraMesh) {
      cameraMesh.position.y = -(y * mapScale)
    }
  },

  add (unit, size) {
    if (!size) {
      size = 1000
    }
    const geometry = new THREE.CircleBufferGeometry(size * mapScale / 100 * 2, unit.isLocal ? 16 : 4)
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
    for (let idx = units.length - 1; idx >= 0; idx -= 1) {
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
