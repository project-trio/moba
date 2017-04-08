export default {
  base: {
    healthMax: [1500, 0],
    healthRegen: [20, 0],
    armor: [40, 0],

    sightRange: [200, 0],
    attackRange: [200, 0],

    attackDamage: [50, 0],
    attackPierce: [10, 0],
    attackCooldown: [2, 0],
    attackMoveSpeed: 10,
    bulletSize: 6,
    bulletColor: 0xff0000,

    turnSpeed: 8,
    collision: 35,
    z: -5,
  },

  tower: {
    healthMax: [1200, 0],
    healthRegen: [0, 0],
    armor: [20, 0],

    sightRange: [190, 0],
    attackRange: [190, 0],

    attackDamage: [140, 0],
    attackPierce: [2, 0],
    attackCooldown: [10, 0],
    attackMoveSpeed: 10,
    bulletSize: 5,
    bulletColor: 0xbb0000,

    turnSpeed: 8,
    collision: 30,
    z: -15,
  },

  turret: {
    healthMax: [1000, 0],
    healthRegen: [0, 0],
    armor: [10, 0],

    sightRange: [190, 0],
    attackRange: [190, 0],

    attackDamage: [100, 0],
    attackPierce: [6, 0],
    attackCooldown: [10, 0],
    attackMoveSpeed: 10,
    bulletSize: 5,
    bulletColor: 0x770000,

    turnSpeed: 8,
    collision: 30,
    z: -25,
  },
}
