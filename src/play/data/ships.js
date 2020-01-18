import * as THREE from 'three'

import { AXIS_Z } from '@/play/data/constants'

import Render from '@/play/render/render'

//HELPERS

const createMeshes = function (name, team, top, base, ship, inGame) {
	const opacity = inGame ? 0.5 : undefined
	Render.voxel(team, 'ships', `${name}-top`, { parent: top, z: this.offsetTop, owner: ship, opacity })
	Render.voxel(team, 'ships', `${name}-base`, { parent: base, owner: ship, opacity })
}

//SHIPS

export default {

	charger: {
		healthMax: [800, 10],
		healthRegen: [30, 1],
		armor: [0, 0],

		sightRange: [180, 0],
		attackRange: [110, 0],

		attackDamage: [70, 3],
		attackPierce: [0, 0],
		attackCooldown: [19, 0],

		bulletSpeed: 12,
		bulletSize: 6,

		moveSpeed: [30, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 24,

		create: createMeshes,
	},

	tempest: {
		healthMax: [600, 5],
		healthRegen: [40, 1],
		armor: [10, 1],

		sightRange: [160, 0],
		attackRange: [140, 0],

		attackDamage: [40, 2],
		attackPierce: [0, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 10,
		bulletSize: 3,

		moveSpeed: [34, 0],
		turnSpeed: 10,
		turnToMove: false,
		collision: 12,

		createMeshes: createMeshes,
		create (name, team, top, bottom, ship) {
			const cloudGroup = Render.group()
			cloudGroup.noAlpha = true
			const sphereCount = 6
			const sphereDist = 19
			const sphereSize = 14

			const material = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 0 })
			material.outlineParameters = { visible: false }
			material.transparent = true
			material.opacity = 0.5
			const geometry = new THREE.SphereBufferGeometry(sphereSize)
			for (let idx = 0; idx < sphereCount; idx += 1) {
				const sphere = new THREE.Mesh(geometry, material)
				sphere.castShadow = false
				sphere.receiveShadow = false
				const angle = Math.PI / (sphereCount / 2) * idx + Math.PI / sphereCount
				sphere.position.set(Math.cos(angle) * sphereDist, Math.sin(angle) * sphereDist, 0)
				sphere.renderOrder = idx / sphereCount
				sphere.fixedTransparency = true
				cloudGroup.add(sphere)
			}

			ship.model.add(cloudGroup)
			ship.cloudGroup = cloudGroup
			this.createMeshes(name, team, top, bottom, ship)
		},

		tween (renderTime) {
			// this.cloudGroup.position.z = 8 + Math.cos(renderTime) * 3
			const clouds = this.cloudGroup.children
			const speed = renderTime / 1000
			for (let idx = clouds.length - 1; idx >= 0; idx -= 1) {
				const cloud = clouds[idx]
				cloud.position.z = 16 + Math.cos(speed + idx) * 4
			}
		},

		onDeath (renderTime) {
			this.queueAnimation('cloudGroup', 'position', {
				axis: AXIS_Z,
				from: 0,
				to: -50,
				start: renderTime,
				duration: 900,
			})
		},
		onRespawn (renderTime) {
			this.queueAnimation('cloudGroup', 'position', {
				axis: AXIS_Z,
				from: -50,
				to: 0,
				pow: 2,
				start: renderTime,
				duration: 900,
			})
		},
	},

	stitches: {
		healthMax: [700, 10],
		healthRegen: [20, 1],
		armor: [0, 0],

		sightRange: [180, 0],
		attackRange: [180, 0],

		attackDamage: [20, 3],
		attackPierce: [0, 0],
		attackCooldown: [15, 0],

		bulletSpeed: 10,
		bulletSize: 3,

		moveSpeed: [30, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 16,

		create: createMeshes,
	},

	beedle: {
		healthMax: [600, 10],
		healthRegen: [40, 1],
		armor: [10, 0],

		sightRange: [160, 0],
		attackRange: [140, 0],

		attackDamage: [30, 4],
		attackPierce: [0, 0],
		attackCooldown: [12, 0],

		bulletSpeed: 10,
		bulletSize: 3,

		moveSpeed: [30, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 16,

		create: createMeshes,
	},

	proppy: {
		offsetTop: -12,
		topOffset: [14, 0, 55],

		healthMax: [600, 5],
		healthRegen: [40, 0],
		armor: [0, 1],

		sightRange: [160, 1],
		attackRange: [140, 1],

		attackDamage: [40, 1],
		attackPierce: [0, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 14,
		bulletSize: 4,

		moveSpeed: [32, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 20,

		createMeshes: createMeshes,
		create (name, team, top, bottom, ship) {
			const propGroup = Render.group()
			propGroup.position.set(14, 0, 54)
			bottom.add(propGroup)
			ship.propGroup = propGroup
			this.createMeshes(name, team, propGroup, bottom, ship)
		},

		tween (renderTime) {
			const sinceReemerge = renderTime - this.reemergeAt
			if (sinceReemerge > 0) {
				let rotation = 1.3
				const cutoff = 300
				if (sinceReemerge < cutoff * cutoff) {
					rotation *= Math.pow(sinceReemerge, 0.5) / cutoff
				}
				this.propGroup.rotation.x += rotation
			}
		},
	},

	pulter: {
		healthMax: [600, 10],
		healthRegen: [30, 1],
		armor: [10, 0],

		sightRange: [180, 0],
		attackRange: [170, 0],

		attackDamage: [70, 3],
		attackPierce: [0, 0],
		attackCooldown: [22, 0],

		bulletSpeed: 8,
		bulletSize: 5,

		moveSpeed: [28, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 22,

		create: createMeshes,
	},

	boxy: {
		healthMax: [800, 40],
		healthRegen: [40, 2],
		armor: [20, 0],

		sightRange: [160, 1],
		attackRange: [120, 1],

		attackDamage: [40, 2],
		attackPierce: [0, 0],
		attackCooldown: [18, 0],

		bulletSpeed: 11,
		bulletSize: 4,

		moveSpeed: [29, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 24,

		create: createMeshes,
	},

	glitch: {
		healthMax: [500, 10],
		healthRegen: [40, 1],
		armor: [30, 0],

		sightRange: [140, 0],
		attackRange: [130, 0],

		attackDamage: [60, 3],
		attackPierce: [0, 0],
		attackCooldown: [15, 0],

		bulletSpeed: 13,
		bulletSize: 4,

		moveSpeed: [30, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 16,

		create: createMeshes,
	},

	sinker: {
		healthMax: [800, 20],
		healthRegen: [60, 1],
		armor: [10, 1],

		sightRange: [160, 0],
		attackRange: [140, 0],

		attackDamage: [30, 3],
		attackPierce: [0, 0],
		attackCooldown: [16, 0],

		bulletSpeed: 11,
		bulletSize: 4,

		moveSpeed: [30, 0],
		turnSpeed: 10,
		turnToMove: true,
		collision: 18,

		properties: {
			whirlpoolDamage: 0,
		},

		create: createMeshes,

		onDamageDealt (renderTime, source, target, damage) {
			const whirpooledAt = target.afflictions['Whirlpool']?.[source.id]
			if (whirpooledAt && renderTime < whirpooledAt + 1000) {
				source.whirlpoolDamage += damage
			}
		},
	},

}
