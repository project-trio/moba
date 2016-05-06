'use strict';

const Local = require('local');

const Mini = require('game/entity/unit/mini');

module.exports = {

	spawn: function(waveData) {
		const mapWidth = Local.game.map.width();
		const mapHeight = Local.game.map.height();
		waveData.forEach((minionData) => {
			const paths = minionData.paths;
			const name = minionData.type;
			for (let team = 0; team < 2; ++team) {
				for (let mirror = 0; mirror < (minionData.mirror ? 2 : 1); ++mirror) {
					let mirrored = mirror == 1;
					for (let pi = 0; pi < paths.length; ++pi) {
						const path = paths[pi];
						const minion = new Mini(team, name, path, mirrored, mapWidth, mapHeight);
					}
				}
			}
		});
	},

};
