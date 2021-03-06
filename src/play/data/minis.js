export default {
	melee: {
		healthMax: [300, 0],
		healthRegen: [0, 0],
		armor: [0, 0],

		sightRange: [100, 0],
		attackRange: [35, 0],

		attackDamage: [10, 0],
		attackPierce: [0, 0],
		attackCooldown: [2, 0],

		bulletSpeed: 0,

		moveSpeed: [25, 0],
		collision: 10,
	},

	ranged: {
		healthMax: [400, 0],
		healthRegen: [0, 0],
		armor: [0, 0],

		sightRange: [105, 0],
		attackRange: [100, 0],

		attackDamage: [20, 0],
		attackPierce: [0, 0],
		attackCooldown: [10, 0],

		bulletSpeed: 10,
		bulletOffset: 15,
		bulletSize: 3,
		bulletColor: 0x888888,

		moveSpeed: [20, 0],
		collision: 10,
	},
}
