import Vue from 'vue'
import Router from 'vue-router'

import Start from '@/components/Start'
import Lobby from '@/components/Lobby'
import Game from '@/components/Game'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Start',
      component: Start,
    },
    {
      path: '/lobby',
      name: 'Lobby',
      component: Lobby,
    },
    {
      path: '/play',
      name: 'Game',
      component: Game,
    }
  ],
})
