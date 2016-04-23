'use strict';

const Local = require('local');

const Canvas = require('game/util/canvas');

const Unit = require('game/entity/unit/unit');

let lastUpdate = 0;
let lastTick = 0;

const animate = function() {
	window.requestAnimationFrame(animate);

	const currentTime = Date.now();
	const game = Local.game;
	if (game) {
		if (game.running) {
			if (game.performTicks(currentTime)) {
				const tickDelta = currentTime - lastTick;
				const fps = Math.min(Math.round(1000 * 3 / tickDelta), 60);
				game.fpsText.text = fps + ' fps';
				lastTick = currentTime;
			} else {
				const timeDelta = currentTime - lastUpdate;
				Unit.update(currentTime, timeDelta, true);
			}
		}
		Canvas.render(game.container);
		// game.map.updateFog();
	}
	lastUpdate = currentTime;
};

module.exports = {

	start: function() {
		animate();
	},

};
