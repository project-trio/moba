const PRECISION = Math.pow(10, 7)
const PRECISION_SQUARE = PRECISION * PRECISION

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

	precision (n) {
		return Math.floor(n * PRECISION) / PRECISION
	},

}
