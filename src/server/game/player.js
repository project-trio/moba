'use strict';

module.exports = function(client) {

	this.id = client.pid;
	this.game = null;
	this.serverUpdate = 0;
	this.name = client.name;
	this.lagCount = 0;

	this.emit = function(name, message) {
		client.emit(name, message);
	};

	this.join = function(game) {
		this.game = game;
		client.join(game.id);
		this.lagCount = 0;
	};

	this.isDisconnected = function() {
		return false; //TODO
	};

};
