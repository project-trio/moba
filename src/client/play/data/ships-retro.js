import Render from '@/client/play/render/render'

//HELPERS

const createMeshes = function (name, team, top, base, ship, inGame) {
	const opacity = inGame ? 0.5 : undefined
	const modelName = ship.statBase.name
	Render.voxel(team, 'ships', `${modelName}-top`, { parent: top, z: this.offsetTop, owner: ship, opacity })
	if (this.split && !this.noBaseModel) {
		Render.voxel(team, 'ships', `${modelName}-base`, { parent: base, owner: ship, opacity })
	}
}

//SHIPS

export default {

	splodge: {
		name: 'boxy',
		split: true,

		healthMax: [250, 20],
		healthRegen: [15, 0],
		armor: [0, 0],

		sightRange: [160, 0],
		attackRange: [115, 0], //80

		attackDamage: [18, 1], //15 1
		attackPierce: [0, 0],
		attackCooldown: [12, 0],

		bulletSpeed: 11,
		bulletSize: 4,

		moveSpeed: [9, 0], //31
		turnSpeed: 6,
		collision: 24,

		create: createMeshes,
	},

	basher: {
		name: 'charger',
		healthMax: [190, 15],
		healthRegen: [15, 0],
		armor: [0, 1], //0 0.5?

		sightRange: [140, 0],
		attackRange: [125, 0], //85

		attackDamage: [27, 4], //27 3
		attackPierce: [0, 0],
		attackCooldown: [13, 0],

		bulletSpeed: 12,
		bulletSize: 6,

		moveSpeed: [9, 0], //31
		turnSpeed: 5,
		collision: 24,

		create: createMeshes,
	},

	doc: {
		name: 'stitches',
		split: true,

		healthMax: [180, 10],
		healthRegen: [15, 0],
		armor: [0, 1], //0 0.33?

		sightRange: [155, 0],
		attackRange: [155, 0], //100

		attackDamage: [13, 1], //13 0.8
		attackPierce: [0, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 10,
		bulletSize: 3,

		moveSpeed: [8, 0], //31
		turnSpeed: 8,
		collision: 22,

		create: createMeshes,
	},

	stinger: {
		name: 'beedle',
		split: true,

		healthMax: [150, 10],
		healthRegen: [15, 0],
		armor: [0, 1], //0 0.5?

		sightRange: [155, 0],
		attackRange: [155, 0], //100

		attackDamage: [12, 1], //10 1
		attackPierce: [0, 0],
		attackCooldown: [12, 0],

		bulletSpeed: 10,
		bulletSize: 3,

		moveSpeed: [7, 0], //29
		turnSpeed: 8,
		collision: 20,

		create: createMeshes,
	},

	shouty: {
		name: 'pulter',
		split: true,

		healthMax: [150, 8],
		healthRegen: [15, 0],
		armor: [0, 0],

		sightRange: [155, 0],
		attackRange: [170, 0], //110

		attackDamage: [15, 2], //8 +1
		attackPierce: [0, 0],
		attackCooldown: [19, 0],

		bulletSpeed: 8,
		bulletSize: 5,

		moveSpeed: [8, 0], //30
		turnSpeed: 5,
		collision: 22,

		create: createMeshes,
	},

	sneaky: {
		name: 'sinker',
		split: true,

		healthMax: [150, 5],
		healthRegen: [15, 0],
		armor: [18, 1], //20 0.5?

		sightRange: [140, 0],
		attackRange: [100, 0], //70

		attackDamage: [27, 1], //27  1
		attackPierce: [0, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 11,
		bulletSize: 4,

		moveSpeed: [9, 0], //32
		turnSpeed: 9,
		collision: 16,

		create: createMeshes,
	},

	dash: {
		name: 'glitch',
		split: false,

		healthMax: [125, 3],
		healthRegen: [15, 0],
		armor: [20, 1],

		sightRange: [140, 0],
		attackRange: [130, 0], //95

		attackDamage: [20, 1], //15 1
		attackPierce: [0, 0],
		attackCooldown: [13, 0],

		bulletSpeed: 13,
		bulletSize: 4,

		moveSpeed: [9, 0], //31
		turnSpeed: 12,
		collision: 18,

		create: createMeshes,
	},

}
