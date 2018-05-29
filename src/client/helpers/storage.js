let storage = false
{
	const uid = new Date()
	try {
		window.localStorage.setItem(uid, uid)
		window.localStorage.removeItem(uid)
		storage = window.localStorage
	} catch (e) {
		window.alert('Local Storage unavailable\n\nYour progress data cannot be loaded or saved. Please ensure Private Browsing mode is off, and that Storage is enabled in your browser settings.')
	}
}

export default {

	get (key, defaultValue = null) {
		if (storage) {
			const value = storage.getItem(key)
			if (value !== undefined && value !== 'null') {
				return value
			}
		}
		return defaultValue
	},

	set (key, value) {
		return storage && storage.setItem(key, value)
	},

	remove (key) {
		return storage && storage.removeItem(key)
	},

	//CONVENIENCE

	getBool (key, defaultValue = null) {
		return this.get(key, defaultValue) == 'true'
	},

	getInt (key, defaultValue = null) {
		const parsed = parseInt(this.get(key), 10)
		return !isNaN(parsed) ? parsed : defaultValue
	},

	getJSON (key) {
		const raw = this.get(key)
		if (raw) {
			try {
				return JSON.parse(raw)
			} catch (e) {
				console.error('Invalid json', key, raw, e)
				storage.removeItem(key)
			}
		}
		return null
	},

	setJSON (key, value) {
		return this.set(key, JSON.stringify(value))
	},

}
