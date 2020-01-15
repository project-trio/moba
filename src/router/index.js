import Vue from 'vue'
import Router from 'vue-router'

import Lobby from '@/components/Lobby'
import LobbyCreate from '@/components/Lobby/Create'
import LobbyJoin from '@/components/Lobby/Join'
import LobbyTutorial from '@/components/Lobby/Tutorial'
import LobbyQueue from '@/components/Lobby/Queue'
import Game from '@/components/Game'

Vue.use(Router)

export default new Router({
	mode: 'history',
	routes: [
		{
			path: '/',
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
			path: '/tutorial',
			name: 'Tutorial',
			component: LobbyTutorial,
		},
		{
			path: '/join/:gid',
			props: true,
			name: 'Join',
			component: LobbyJoin,
		},
		{
			path: '/play/:gid',
			props: true,
			name: 'Game',
			component: Game,
		},
	],
})
