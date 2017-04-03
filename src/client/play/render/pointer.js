const THREE = require('three')

const raycaster = new THREE.Raycaster()
const pointerLocation = new THREE.Vector2()

let intersectContainer, intersecting, hovering

//LISTENER

function onMouseMove (event) {
  pointerLocation.x = (event.clientX / window.innerWidth) * 2 - 1
  pointerLocation.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function onClick (event) {
  const rightClick = event.which ? event.which === 3 : event.button >= 2
  for (let i = 0; i < intersecting.length; i++) {
    const intersect = intersecting[i]
    const owner = intersect.object.owner
    if (owner && owner.onClick && owner.onClick(intersect.point, rightClick)) {
      return false
    }
  }
}

//PUBLIC

export default {
  init (container) {
    intersectContainer = container

    hovering = {}
    const canvas = document.getElementById('canvas')
    canvas.addEventListener('mousedown', onClick, false)
    canvas.addEventListener('mousemove', onMouseMove, false)
    canvas.addEventListener('contextmenu', onClick, false)
  },

  destroy () {
    hovering = null
    intersecting = null
    intersectContainer = null

    const canvas = document.getElementById('canvas')
    canvas.removeEventListener('mousedown', onClick, false)
    canvas.removeEventListener('mousemove', onMouseMove, false)
    canvas.removeEventListener('contextmenu', onClick, false)
  },

  reposition (camera) {
    raycaster.setFromCamera(pointerLocation, camera)

    intersecting = raycaster.intersectObjects(intersectContainer.children, true)
    const newHovering = {}
    for (let i = 0; i < intersecting.length; i++) {
      const intersect = intersecting[i]
      const owner = intersect.object.owner
      if (owner && owner.onHover) {
        if (!hovering[owner.id]) {
          owner.onHover(intersect.point)
        } else if (owner.onMove) {
          owner.onMove(intersect.point)
        }
        newHovering[owner.id] = owner
      }
    }
    for (let id in hovering) {
      const newOwner = newHovering[id]
      if (!newOwner) {
        hovering[id].onBlur()
      }
    }
    hovering = newHovering
  },
}
