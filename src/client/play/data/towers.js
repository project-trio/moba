export default {
	base: {
		healthMax: [1000, 0],
		healthRegen: [10, 0],
		armor: [40, 0],

		sightRange: [210, 0],
		attackRange: [200, 0],

		attackDamage: [50, 0],
		attackPierce: [10, 0],
		attackCooldown: [2, 0],

		bulletSpeed: 10,
		bulletOffset: 33,
		bulletSize: 6,
		bulletColor: 0xff0000,

		turnSpeed: 8,
		collision: 35,
		z: 0,
	},

	tower: {
		healthMax: [700, 0],
		healthRegen: [0, 0],
		armor: [20, 0],

		sightRange: [190, 0],
		attackRange: [190, 0],

		attackDamage: [140, 0],
		attackPierce: [2, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 10,
		bulletOffset: 33,
		bulletSize: 5,
		bulletColor: 0xbb0000,

		turnSpeed: 8,
		collision: 30,
		z: -5,
	},

	turret: {
		healthMax: [500, 0],
		healthRegen: [0, 0],
		armor: [10, 0],

		sightRange: [180, 0],
		attackRange: [180, 0],

		attackDamage: [100, 0],
		attackPierce: [6, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 10,
		bulletOffset: 33,
		bulletSize: 5,
		bulletColor: 0x770000,

		turnSpeed: 8,
		collision: 30,
		z: -10,
	},
}
