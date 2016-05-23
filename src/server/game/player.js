'use strict';

//CONSTRUCTOR

module.exports = function(client) {

	this.id = client.pid;
	this.game = null;
	this.serverUpdate = 0;
	this.name = client.name;

	this.emit = function(name, message) {
		client.emit(name, message);
	};

	this.join = function(game) {
		this.game = game;
		client.join(game.id);
	};

	this.isDisconnected = function() {
		return false; //TODO
	};

};
