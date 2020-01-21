import Vue from 'vue'
import Router from 'vue-router'

import Lobby from '@/app/components/Lobby'
import LobbyCreate from '@/app/components/Lobby/Create'
import LobbyJoin from '@/app/components/Lobby/Join'
import LobbyTutorial from '@/app/components/Lobby/Tutorial'
import LobbyQueue from '@/app/components/Lobby/Queue'
import Game from '@/app/components/Game'

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
