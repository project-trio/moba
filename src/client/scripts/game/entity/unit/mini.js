'use strict';

const Unit = require('game/entity/unit/unit');

module.exports = function(team, parent, x, y) {

	this.__proto__ = new Unit(team, parent, x, y);

};
