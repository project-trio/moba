import Vue from 'vue'
import App from './App'
import router from './router'

import store from '@/store'

import Events from '@/play/events'

// Setup

if (store.state.signin.username) {
  Events.init()
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
