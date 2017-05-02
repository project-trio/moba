import Vue from 'vue'
import Router from 'vue-router'

import Start from '@/components/Start'
import Lobby from '@/components/Lobby'
import LobbyCreate from '@/components/Lobby/Create'
import LobbyJoin from '@/components/Lobby/Join'
import LobbyQueue from '@/components/Lobby/Queue'
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
      path: '/lobby/queue',
      name: 'Queue',
      component: LobbyQueue,
    },
    {
      path: '/lobby/create',
      name: 'Create',
      component: LobbyCreate,
    },
    {
      path: '/join/:gid',
      props: true,
      name: 'Join',
      component: LobbyJoin,
    },
    {
      path: '/play',
      name: 'Game',
      component: Game,
    },
  ],
})
