import Float from '@/play/game/helpers/float'

const MATH_PI = Math.PI
const PRECISION_PI = Float.integer(MATH_PI)

export function radiansBetween (a, b) {
	const ax = a.px, ay = a.py, bx = b.px, by = b.py
	return Float.add(Float.atan(ay - by, ax - bx), MATH_PI)
}

export function radianDistance (a, b, tweening) {
	const pi = tweening ? MATH_PI : PRECISION_PI
	const pi2 = pi * 2
	if (!tweening) {
		a = Float.integer(a)
		b = Float.integer(b)
	}
	const diff = ((b - a + pi) % pi2) - pi
	const result = diff < -pi ? diff + pi2 : diff
	return tweening ? result : result / Float.PRECISION
}

export function inRegion (distance) {
	return distance < 4000000000
}

export function pointDistance (x1, y1, x2, y2) {
	const diffX = x2 - x1
	const diffY = y2 - y1
	return diffX * diffX + diffY * diffY
}

export function withinSquared (distance, range) {
	return distance < (range * range)
}

export function squared (value) {
	return value * value
}
