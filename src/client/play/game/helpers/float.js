const PRECISION = Math.pow(10, 7)
const PRECISION_SQUARE = PRECISION * PRECISION

const precision = function (n) {
	return Math.floor(n * PRECISION) / PRECISION
}

export default {

	add (a, b) {
		return (a * PRECISION + b * PRECISION) / PRECISION
	},

	subtract (a, b) {
		return (a * PRECISION - b * PRECISION) / PRECISION
	},

	multiply (a, b) {
		return ((a * PRECISION) * (b * PRECISION)) / PRECISION_SQUARE
	},

	divide (a, b) {
		return (a * PRECISION) / (b * PRECISION)
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
