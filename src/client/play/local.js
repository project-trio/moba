export default {
	name: null,
	email: null,
	username: localStorage.getItem('username'),

	gid: null,
	id: null,
	game: null,
	player: null,
	unit: null,

	destroy () {
		this.game = null
		this.unit = null
		this.player = null
	},
}
