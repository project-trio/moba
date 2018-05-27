const PRECISION = Math.pow(10, 7)
const PRECISION_SQUARE = PRECISION * PRECISION

const precision = function (n) {
	return Math.floor(n * PRECISION) / PRECISION
}

export default {

	add (a, b) {
		a *= PRECISION
		b *= PRECISION
		return (a + b) / PRECISION
	},

	subtract (a, b) {
		a *= PRECISION
		b *= PRECISION
		return (a - b) / PRECISION
	},

	multiply (a, b) {
		a *= PRECISION
		b *= PRECISION
		return (a * b) / PRECISION_SQUARE
	},

	divide (a, b) {
		a *= PRECISION
		b *= PRECISION
		return a / b
	},

	atan (y, x) {
		return precision(Math.atan2(y, x))
	},
	cos (theta) {
		return precision(Math.cos(theta))
	},
	sin (theta) {
		return precision(Math.sin(theta))
	},
}
