import Vue from 'vue'
import App from './App'
import router from './router'

import store from '@/store'

import Events from '@/play/events'

// Setup

if (store.state.signin.username) {
  Events.init()
  if (router.currentRoute.name === 'Start') {
    router.replace({ name: 'Lobby' })
  }
} else {
  router.replace({ name: 'Start' })
}

// App

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  data: store,
  template: '<App/>',
  components: { App }
})

// Guard routes

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
