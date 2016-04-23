'use strict';

const PIXI = require('pixi.js');

//PUBLIC

module.exports = {

	create: function() {
		return new PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight);
	},

	group: function() {
		return new PIXI.Container();
	},

	text: function(string, x, y, options, parent) {
		let text = new PIXI.Text(string, options);
		text.position.set(x, y);
		if (parent) {
			parent.addChild(text);
		}
		return text;
	},

	sprite: function(name) {
		return new PIXI.Sprite.fromImage(require(`images/${name}.png`));
	},

	// Shapes

	circle: function(x, y, radius, color, parent) {
		let circle = new PIXI.Graphics();
		circle.cacheAsBitmap = true;
		circle.beginFill(color);
		circle.drawCircle(x, y, radius);
		circle.endFill();
		if (parent) {
			parent.addChild(circle);
		}
		return circle;
	},

	rectangle: function(x, y, w, h, options) {
		let rect = new PIXI.Graphics();
		rect.cacheAsBitmap = true;
		console.log(options);
		if (options.color) {
			rect.beginFill(options.color);
		}
		if (options.strokeWidth) {
			rect.lineStyle(options.strokeWidth, options.strokeColor);	
		}
		if (options.radius) {
			rect.drawRoundedRect(x, y, w, h, options.radius);
		} else {
			rect.drawRect(x, y, w, h);
		}
		rect.endFill();
		if (options.parent) {
			options.parent.addChild(rect);
		}
		return rect;
	},

};
