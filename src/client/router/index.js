import Vue from 'vue'
import Router from 'vue-router'

import Start from '@/components/Start'
import Lobby from '@/components/Lobby'
import LobbyCreate from '@/components/Lobby/Create'
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
      path: '/lobby/create',
      name: 'Create',
      component: LobbyCreate,
    },
    {
      path: '/play',
      name: 'Game',
      component: Game,
    }
  ],
})
