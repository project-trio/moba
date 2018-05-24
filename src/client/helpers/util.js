let passiveOption = false
try {
	const options = Object.defineProperty({}, 'passive', {
		get () {
			passiveOption = { passive: true }
		},
	})
	window.addEventListener('test', null, options)
} catch (error) {
	// p('passive unvailable')
}

export default {

	seconds () {
		return Math.round(Date.now() * 0.001)
	},

	pluralize (amount, word) {
		return `${amount} ${word}${amount === 1 ? '' : 's'}`
	},

	addListener (element, name, callback, disablePassive) {
		element.addEventListener(name, callback, disablePassive ? false : passiveOption)
	},

	removeListener (element, name, callback, disablePassive) {
		element.removeEventListener(name, callback, disablePassive ? false : passiveOption)
	},

}
