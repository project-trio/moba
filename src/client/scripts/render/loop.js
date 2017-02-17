'use strict';

const Stats = require('stats.js');

const Local = require('local');

const Render = require('render/render');

const Bullet = require('game/entity/unit/bullet');
const Unit = require('game/entity/unit/unit');

let lastUpdate = 0;

let updatePanel, framePanel;

//LOOP

const animate = function(timestamp) {
	if (framePanel) {
		framePanel.begin();
	}
	const currentTime = Date.now(); //TODO timestamp
	const game = Local.game;
	if (game) {
		if (game.running) {
			const ticksToRender = game.calculateTicksToRender(currentTime);
			if (ticksToRender > 0) {
				const processUpdate = updatePanel && ticksToRender == 1;
				if (processUpdate) {
					updatePanel.begin();
				}
				game.performTicks(ticksToRender, currentTime);
				game.localUnit.updateVisibility();
				Render.fog(Unit.all());
				if (processUpdate) {
					updatePanel.end();
				}
			} else {
				const tweenTimeDelta = currentTime - lastUpdate;
				Bullet.update(currentTime, tweenTimeDelta, true);
				Unit.update(currentTime, tweenTimeDelta, true);
			}

			const position = game.localUnit.container.position;
			game.map.track(position.x, position.y);
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

		// if (Local.TESTING) {
			updatePanel = new Stats();
			updatePanel.showPanel(1);
			document.body.appendChild(updatePanel.dom);

			framePanel = new Stats();
			framePanel.showPanel(0);
			framePanel.dom.style.top = '48px';
			document.body.appendChild(framePanel.dom);
		// }
	},

};
