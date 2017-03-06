const pageLoad = window.location

// const pathItems = pageLoad.pathname.split('/')

//PUBLIC

export default {

	TESTING: pageLoad.hostname == 'localhost',

	name: null,
	email: null,

	id: null,
	username: localStorage.getItem('username'),
	game: null,

	shipSize: 44,
}
