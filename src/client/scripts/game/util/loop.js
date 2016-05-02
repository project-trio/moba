'use strict';

const Stats = require('stats.js');

const Local = require('local');

const Render = require('game/util/render');

const Unit = require('game/entity/unit/unit');

let lastUpdate = 0;

var updatePanel, framePanel;
// if (Local.TESTING) {
	setTimeout(() => {
		updatePanel = new Stats();
		updatePanel.showPanel(1);
		document.body.appendChild(updatePanel.dom);

		// framePanel = new Stats();
		// framePanel.showPanel(0);
		// document.body.appendChild(framePanel.dom);
	}, 5000);
// }

//LOOP

const animate = function() {
	if (framePanel) {
		framePanel.begin();
	}
	const currentTime = Date.now();
	const game = Local.game;
	if (game) {
		if (game.running) {
			const ticksToRender = game.ticksToRender(currentTime);
			if (ticksToRender > 0) {
				if (updatePanel && ticksToRender == 1) {
					updatePanel.begin();
				}
				game.performTicks(ticksToRender, currentTime);
				if (updatePanel) {
					updatePanel.end();
				}
			} else {
				const timeDelta = currentTime - lastUpdate;
				Unit.update(currentTime, timeDelta, true);
			}
		}
		Render.render();
	}
	lastUpdate = currentTime;

	if (framePanel) {
		framePanel.end();
	}
	window.requestAnimationFrame(animate);
};

//PUBLIC

module.exports = {

	start: function() {
		window.requestAnimationFrame(animate);
	},

};
