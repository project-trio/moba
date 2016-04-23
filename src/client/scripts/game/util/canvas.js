'use strict';

const Render = require('game/util/render');

let renderer;

//PUBLIC

module.exports = {

	create: function() {
		renderer = Render.create();

		const htmlCanvas = document.createElement('canvas');
		htmlCanvas.id = 'canvas-fog';
		document.getElementById('game-viewport').appendChild(renderer.view);
		document.getElementById('game-viewport').appendChild(htmlCanvas);
		renderer.canvas = htmlCanvas;
	},

	render: function(container) {
		renderer.render(container);
	},

	get: function() {
		return renderer.canvas;
	},

};
