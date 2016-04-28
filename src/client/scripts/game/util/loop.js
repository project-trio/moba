'use strict';

const Stats = require('stats.js');

const Local = require('local');

const Render = require('game/util/render');

const Unit = require('game/entity/unit/unit');

let lastUpdate = 0;
let lastTick = 0;

var stats;
// if (Local.TESTING) {
	setTimeout(() => {
		stats = new Stats();
		stats.showPanel(1);
		document.body.appendChild(stats.dom);
	}, 5000);
// }

//LOOP

const animate = function() {
	if (stats) {
		stats.begin();
	}

	const currentTime = Date.now();
	const game = Local.game;
	if (game) {
		if (game.running) {
			if (game.performTicks(currentTime)) {
				lastTick = currentTime;
			} else {
				const timeDelta = currentTime - lastUpdate;
				Unit.update(currentTime, timeDelta, true);
			}
		}
		Render.render();
	}
	lastUpdate = currentTime;

	if (stats) {
		stats.end();
	}
	window.requestAnimationFrame(animate);
};

//PUBLIC

module.exports = {

	start: function() {
		animate();
	},

};
