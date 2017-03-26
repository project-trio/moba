import Vue from 'vue'
import App from './App'
import router from '@/router'

import store from '@/store'

import Local from '@/play/local'

import Events from '@/play/events'
import LobbyEvents from '@/play/events/lobby'

// App

Vue.config.productionTip = false

const hasSignin = store.state.signin.username !== null
if (hasSignin) {
  Events.init()
}

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  data: store,
  template: '<App/>',
  components: { App }
})

// Guard routes

if (hasSignin) {
  if (router.currentRoute.name === 'Game') {
    if (!Local.game) {
      if (!Local.TESTING) {
        router.replace({ name: 'Lobby' })
      } else {
        LobbyEvents.connect('quick', { size: 0 }, (data) => {
          router.replace({ name: 'Join', params: { gid: data.gid } })
        })
      }
    }
  } else if (router.currentRoute.name === 'Start') {
    router.replace({ name: 'Lobby' })
  }
} else {
  router.replace({ name: 'Start' })
}

router.beforeEach((to, from, next) => {
  if (to.name === 'Start') {
    if (store.state.signin.username) {
      return next({name: 'Lobby'})
    }
  } else if (!store.state.signin.username && to.name !== 'Start') {
    if (!store.state.signin.email) {
      return next({name: 'Start'})
    }
  }
  next()
})
