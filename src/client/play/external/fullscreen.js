const hasWebkitFullScreen = 'webkitExitFullscreen' in document
const hasMozFullScreen = 'mozCancelFullScreen' in document

export default {
  active () {
    if (hasWebkitFullScreen) {
      return document.webkitIsFullScreen
    } else if (hasMozFullScreen) {
      return document.mozFullScreenEnabled
    } else {
      console.assert(false)
    }
  },

  request () {
    const element = document.body
    if (hasWebkitFullScreen) {
      element.webkitRequestFullScreen()
    } else if (hasMozFullScreen) {
      element.mozRequestFullScreen()
    } else {
      console.assert(false)
    }
  },

  cancel () {
    if (hasWebkitFullScreen) {
      document.webkitExitFullscreen()
    } else if (hasMozFullScreen) {
      document.mozCancelFullScreen()
    } else {
      console.assert(false)
    }
  },

  toggle () {
    if (this.active()) {
      this.cancel()
    } else {
      this.request()
    }
  },
}
