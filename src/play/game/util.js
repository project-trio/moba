import Float from '@/play/game/helpers/float'

const MATH_PI = Math.PI
const PRECISION_PI = Float.integer(MATH_PI)

//PUBLIC

export default {

	// Angle

	radiansBetween (a, b) {
		const ax = a.px, ay = a.py, bx = b.px, by = b.py
		return Float.add(Float.atan(ay - by, ax - bx), MATH_PI)
	},

	radianDistance (a, b, tweening) {
		const pi = tweening ? MATH_PI : PRECISION_PI
		const pi2 = pi * 2
		if (!tweening) {
			a = Float.integer(a)
			b = Float.integer(b)
		}
		const diff = ((b - a + pi) % pi2) - pi
		const result = diff < -pi ? diff + pi2 : diff
		return tweening ? result : result / Float.PRECISION
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
