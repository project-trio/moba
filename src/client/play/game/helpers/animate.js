//LOCAL

const queue = function (key, property, data) {
  data.key = key
  data.property = property
  if (data.from > data.to) {
    data.change = -(data.from - data.to)
  } else {
    data.change = +(data.to - data.from)
  }
  // if (!data.start) {
  //   data.start = store.state.game.renderTime
  // }
  this.animations.push(data)
}

const update = function (renderTime) {
  for (let idx = this.animations.length - 1; idx >= 0; idx -= 1) {
    const animation = this.animations[idx]
    const startTime = animation.start
    const timeElapsed = renderTime - startTime
    if (timeElapsed > 0) {
      const duration = animation.duration
      let currentValue
      if (renderTime >= startTime + duration) {
        this.animations.splice(idx, 1)
        currentValue = animation.to
      } else {
        currentValue = animation.from + timeElapsed * animation.change / duration
      }
      let obj = this[animation.key]
      if (animation.child !== undefined) {
        obj = obj.children[animation.child]
      }
      const axis = animation.axis
      if (axis !== undefined) {
        obj[animation.property][axis] = currentValue
      } else {
        obj[animation.property] = currentValue
      }
    }
  }
}

//PUBLIC

export default {

  apply (object) {
    object.animations = []
    object.queueAnimation = queue
    object.updateAnimations = update
  },

}
