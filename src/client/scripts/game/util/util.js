'use strict';

module.exports = {

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

};
