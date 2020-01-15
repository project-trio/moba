export default {
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
