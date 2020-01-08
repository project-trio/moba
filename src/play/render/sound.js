import * as THREE from 'three'

import store from '@/store'

let audioListener
let dieBuffer, respawnBuffer, levelupBuffer, activateBuffer
let respawnSound, levelSound, skillsSound

function globalSound (sound, buffer) {
	if (!buffer) {
		return console.error(sound, 'playSound')
	}
	sound.setBuffer(buffer)
	sound.play()
}

function createAudio () {
	const sound = new THREE.Audio(audioListener)
	sound.setVolume(0.25)
	return sound
}

export default {

	create () {
		audioListener = new THREE.AudioListener()
		this.setVolume(store.state.settings.soundVolume)

		const audioLoader = new THREE.AudioLoader()
		audioLoader.load(require('@/assets/sounds/fizzle1.wav'), (buffer) => {
			dieBuffer = buffer
		})
		audioLoader.load(require('@/assets/sounds/bubble1.wav'), (buffer) => {
			respawnBuffer = buffer
		})
		audioLoader.load(require('@/assets/sounds/confirm1.wav'), (buffer) => {
			levelupBuffer = buffer
		})
		audioLoader.load(require('@/assets/sounds/select1.wav'), (buffer) => {
			activateBuffer = buffer
		})

		respawnSound = createAudio()
		levelSound = createAudio()
		skillsSound = createAudio()
		return audioListener
	},

	destroy () {
		audioListener = null
		dieBuffer = null
		respawnBuffer = null
		levelupBuffer = null
		activateBuffer = null

		respawnSound = null
		levelSound = null
		skillsSound = null
	},

	setVolume (value) {
		audioListener.setMasterVolume(value / 100)
	},

	levelup () {
		globalSound(levelSound, levelupBuffer)
	},

	die () {
		globalSound(respawnSound, dieBuffer)
	},

	respawn () {
		globalSound(respawnSound, respawnBuffer)
	},

	activateSkill () {
		globalSound(skillsSound, activateBuffer)
	},

	positional (group) {
		const audio = new THREE.PositionalAudio(audioListener)
		audio.setDistanceModel('exponential')
		audio.setRefDistance(0.1)
		audio.setRolloffFactor(4)
		audio.setVolume(1000000000000000)
		group.add(audio)
		return audio
	},

}
