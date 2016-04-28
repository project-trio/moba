'use strict';

module.exports = {

	// Angle

	atan: function(dx, dy) {
		let angle = Math.atan(dy / dx);
		if (dx < 0) {
			angle += Math.PI;
		}
		return angle;
	},

	angleBetween: function(a, b) {
		const positionA = a.container.position;
		const positionB = b.container.position;
		const dx = positionA.x - positionB.x;
		const dy = positionA.y - positionB.y;
		return this.atan(dx, dy);
	},

	// Distance

	pointDistance: function(x1, y1, x2, y2) {
		return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
	},

	manhattanDistance: function(x1, y1, x2, y2) {
		return Math.abs(x2 - x1) + Math.abs(y2 - y1);
	},

};
