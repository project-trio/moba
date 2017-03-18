export default {

	TESTING: process.env.NODE_ENV !== 'production',

	name: null,
	email: null,

	id: null,
	username: localStorage.getItem('username'),
	game: null,

	shipSize: 44,

}
