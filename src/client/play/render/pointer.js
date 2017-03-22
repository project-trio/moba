const THREE = require('three')

const raycaster = new THREE.Raycaster()
const pointerLocation = new THREE.Vector2()

let intersectContainer
let intersecting
let hovering = {}

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
      event.preventDefault()
      return false
    }
  }
}

window.addEventListener('mousedown', onClick, false)
window.addEventListener('mousemove', onMouseMove, false)
window.addEventListener('contextmenu', onClick, false)

//PUBLIC

export default {
  reposition (camera) {
    raycaster.setFromCamera(pointerLocation, camera)

    intersecting = raycaster.intersectObjects(intersectContainer.children, true)
    const newHovering = {}
    for (let i = 0; i < intersecting.length; i++) {
      const owner = intersecting[i].object.owner
      if (owner && owner.onHover) {
        if (!hovering[owner.id]) {
          owner.onHover()
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

  setParent (container) {
    intersectContainer = container
  }
}
