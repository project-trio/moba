'use strict';

const TrigCache = require('external/trigcache');

//PUBLIC

module.exports = {

	// Angle

	angleOf: function(dx, dy, fast) {
		if (fast) {
			return Math.atan2(dy, dx); 
		}
		return TrigCache.atan(dx, dy);
	},

	angleBetween: function(a, b, fast) {
		const positionA = a.container.position;
		const positionB = b.container.position;
		return this.angleOf(positionA.x - positionB.x, positionA.y - positionB.y, fast);
	},

	// Distance

	inRegion: function(distance) {
		return distance < 4000000000;
	},

	pointDistance: function(x1, y1, x2, y2) {
		const diffX = x2 - x1;
		const diffY = y2 - y1;
		return diffX * diffX + diffY * diffY;
	},

	manhattanDistance: function(x1, y1, x2, y2) {
		return Math.abs(x2 - x1) + Math.abs(y2 - y1);
	},

	withinSquared: function(distance, range) {
		return distance < range * range;
	},

	squared: function(distance) {
		return distance * distance;
	},

};
