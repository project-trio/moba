// import store from '@/client/store'

//LOCAL

const queue = function (key, property, data) {
  data.key = key
  data.property = property
  if (data.from === undefined) {
    let obj = this[key]
    if (data.child !== undefined) {
      obj = obj.children[data.child]
    }
    if (property === 'opacity') {
      data.from = obj.material[property]
    } else {
      data.from = data.axis ? obj[property][data.axis] : obj[property]
    }
    // p('infer from', data.from, key, property, obj, data)
  }
  if (data.from > data.to) {
    data.change = -(data.from - data.to)
  } else {
    data.change = +(data.to - data.from)
  }
  if (data.until) {
    data.start = data.until - data.duration
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
        currentValue = animation.final !== undefined ? animation.final : animation.to
        if (animation.onComplete) {
          animation.onComplete()
        }
      } else if (animation.parabola) {
        const halfDuration = duration / 2
        const progress = 1 - Math.pow((timeElapsed - halfDuration) / halfDuration, animation.parabola)
        currentValue = animation.from + (progress > 0.999 ? 1 : progress) * animation.max
      } else {
        let progress = timeElapsed / duration
        if (animation.pow) {
          progress = 1 - Math.pow(1 - progress, animation.pow)
        }
        currentValue = animation.from + progress * animation.change
      }
      let obj = null
      if (animation.key) {
        obj = this[animation.key]
        if (animation.child !== undefined) {
          obj = obj.children[animation.child]
        }
      }
      const axis = animation.axis
      if (axis !== undefined) {
        obj[animation.property][axis] = currentValue
      } else if (animation.property === 'opacity') {
        if (obj) {
          obj.material.transparent = true
          obj.material.opacity = currentValue
        } else {
          this.opacity(currentValue)
        }
      } else {
        obj[animation.property] = currentValue
      }
    }
  }
}

const cancel = function (key, property) {
  for (let idx = this.animations.length - 1; idx >= 0; idx -= 1) {
    const animation = this.animations[idx]
    if (animation.key === key && animation.property === property) {
      this.animations.splice(idx, 1)
    }
  }
}

//PUBLIC

export default {

  apply (object) {
    object.animations = []
    object.queueAnimation = queue
    object.updateAnimations = update
    object.cancelAnimation = cancel
  },

}
