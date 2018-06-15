const PRECISION = Math.pow(10, 7)
const PRECISION_SQUARE = PRECISION * PRECISION

const precision = function (n) {
	return Math.floor(n * PRECISION) / PRECISION
}

const atan = Math.atan2, cos = Math.cos, sin = Math.sin

export default {

	PRECISION: PRECISION,

	integer (precisionFloat) {
		return Math.floor(precisionFloat * PRECISION)
	},

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
		return precision(atan(y, x))
	},
	cos (theta) {
		return precision(cos(theta))
	},
	sin (theta) {
		return precision(sin(theta))
	},
}
