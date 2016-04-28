'use strict';

var pageLoad = window.location;

// var pathItems = pageLoad.pathname.split('/');

//PUBLIC

module.exports = {

	TESTING: pageLoad.hostname == 'localhost',

	name: null,
	email: null,

	id: null,
	username: localStorage.getItem('username'),
	game: null,

	shipSize: 44,
};
