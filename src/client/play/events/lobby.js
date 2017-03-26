import router from '@/router'

import Bridge from '@/play/events/bridge'

import Local from '@/play/local'

export default {

	connect (name, data, callback) {
		if (!data) {
			data = {}
		}
		data.action = name
		Bridge.emit('lobby action', data, callback)
	},

	init () {
		Bridge.on('join game', (data) => {
			console.log('join game', data)
			const routeObject = { name: 'Join', params: { gid: data.gid } }
			if (router.currentRoute.name === 'Create') {
				router.replace(routeObject)
			} else {
				router.push(routeObject)
			}
		})

		Bridge.on('add player', (data) => {
			console.log('Add ' + data)
			Local.game.updatePlayers(data)
		})

		Bridge.on('remove player', (data) => {
			console.log('Del ' + data)
			Local.game.updatePlayers(data)
		})

		Bridge.on('start game', (data) => {
			console.log('Start game', data)
			Local.game.updatePlayers(data)
			router.replace({ name: 'Game' })
		})
	},

}
