export function levelMultiplier (base, level, multiplier) {
	return base + (level - 1) * multiplier
}

export function isDisabledBy (actives) {
	for (let idx = actives.length - 1; idx >= 0; idx -= 1) {
		if (actives[idx] > 0 && this.disabledBy[idx]) {
			return true
		}
	}
	return false
}
