import Vue from 'vue'
import Router from 'vue-router'

import Start from '@/client/components/Start'
import Lobby from '@/client/components/Lobby'
import LobbyCreate from '@/client/components/Lobby/Create'
import LobbyJoin from '@/client/components/Lobby/Join'
import LobbyQueue from '@/client/components/Lobby/Queue'
import Game from '@/client/components/Game'

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
