let passiveOption = false
try {
	const options = Object.defineProperty({}, 'passive', {
		get () {
			passiveOption = { passive: true }
			return passiveOption
		},
	})
	window.addEventListener('test', null, options)
} catch (error) {
	// p('passive events unvailable')
}

// Public

export function getTimestamp () {
	return Math.round(Date.now() * 0.001)
}

export function pluralize (amount, word) {
	return `${amount} ${word}${amount === 1 ? '' : 's'}`
}

export function addListener (element, name, callback, disablePassive) {
	element.addEventListener(name, callback, disablePassive ? false : passiveOption)
}

export function removeListener (element, name, callback, disablePassive) {
	element.removeEventListener(name, callback, disablePassive ? false : passiveOption)
}
