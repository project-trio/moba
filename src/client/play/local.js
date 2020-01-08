export default {
	name: null,
	email: null,

	gid: null,
	id: null,
	game: null,
	player: null,
	unit: null,

	unitTarget: null,
	groundTarget: null,

	destroy () {
		this.game = null
		this.unit = null
		this.player = null
	},
}
