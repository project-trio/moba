import Float from '@/client/play/game/helpers/float'

const PI = Math.PI
const PIt2 = PI * 2

//PUBLIC

export default {

	// Angle

	angleOf (dx, dy, fast) {
		if (fast) {
			return Math.atan2(dy, dx) //TODO remove
		}
		return Float.atan(dy, dx)
	},

	angleBetween (a, b, fast) {
		const positionA = a.container.position
		const positionB = b.container.position
		return this.angleOf(positionA.x - positionB.x, positionA.y - positionB.y, fast) + PI
	},

	distanceBetweenAngles (a, b) {
		let diff = ((b - a + PI) % PIt2) - PI
		return (diff < -PI ? diff + PIt2 : diff)
	},

	// Distance

	inRegion (distance) {
		return distance < 4000000000
	},

	pointDistance (x1, y1, x2, y2) {
		const diffX = x2 - x1
		const diffY = y2 - y1
		return diffX * diffX + diffY * diffY
	},

	withinSquared (distance, range) {
		return distance < (range * range)
	},

	squared (value) {
		return value * value
	},

}
