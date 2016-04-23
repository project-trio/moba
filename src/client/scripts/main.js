'use strict';

const $ = require('jquery');

require('styles/main');
require('styles/game');

require('bridge');

//SETUP
$(function() {

	const Lobby = require('game/lobby');
	const Loop = require('game/util/loop');

	Lobby.toggle(true);
	Lobby.displaySection('start');
	Loop.start(); //TODO delay

	require('game/events');
});

//TESTING

window.setTimeout(function() {
	// $('#s-clubs').show();
}, 0);
