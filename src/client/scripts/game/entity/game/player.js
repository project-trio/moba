'use strict';

const Local = require('local');
const Ship = require('game/entity/unit/ship');

const PLAYER_INSET = 64;

module.exports = function(pid, team, index, name) {

	this.id = pid;
	this.unit = null;
	this.team = team;
	this.name = name;

//MANAGE

	this.spawnLocation = function() {
		const teamMp = team == 0 ? 1 : -1;
		const indexMp = index % 2 == 0 ? -1 : 1;

		const mapWidthHalf = Local.game.map.centerX();
		const mapHeightHalf = Local.game.map.centerY();
		const x = mapWidthHalf + Local.shipSize * 2 * (Math.floor(index / 2) + 1) * indexMp * teamMp;
		const y = (mapHeightHalf - PLAYER_INSET) * teamMp + mapHeightHalf;
		return [x, y];
	};

	this.createShip = function() {
		const position = this.spawnLocation();
		this.unit = new Ship('boxy', this, team, position[0], position[1]);
	};

	this.destroy = function() {
		if (this.unit) {
			this.unit.destroy();
			this.unit = null;
			delete this.unit;
		}
	};

};
