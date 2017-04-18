import Render from '@/play/render/render'

//HELPERS

const createMeshes = function (name, team, top, base, ship) {
  Render.voxel(team, `${name}-top`, { parent: top, z: this.offsetTop, owner: ship })
  if (this.split) {
    Render.voxel(team, `${name}-base`, { parent: base, owner: ship })
  }
}

//SHIPS

export default {
  stitches: {
    split: true,

    healthMax: [700, 10],
    healthRegen: [10, 1],
    armor: [0, 0],

    sightRange: [180, 0],
    attackRange: [180, 0],

    attackDamage: [20, 3],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 10,
    bulletSize: 3,

    moveSpeed: [10, 0],
    turnSpeed: 8,
    collision: 16,

    create: createMeshes,
  },

  beedle: {
    split: true,

    healthMax: [600, 10],
    healthRegen: [40, 1],
    armor: [10, 0],

    sightRange: [160, 0],
    attackRange: [140, 0],

    attackDamage: [30, 3],
    attackPierce: [0, 0],
    attackCooldown: [10, 0],
    attackMoveSpeed: 10,
    bulletSize: 3,

    moveSpeed: [9, 0],
    turnSpeed: 8,
    collision: 16,

    create: createMeshes,
  },

  proppy: {
    split: true,
    offsetTop: -12,
    topOffset: [14, 0, 55],

    healthMax: [600, 5],
    healthRegen: [40, 2],
    armor: [0, 1],

    sightRange: [160, 1],
    attackRange: [140, 1],

    attackDamage: [40, 1],
    attackPierce: [0, 0],
    attackCooldown: [10, 0],
    attackMoveSpeed: 16,
    bulletSize: 4,

    moveSpeed: [11, 0],
    turnSpeed: 12,
    collision: 20,

    createMeshes: createMeshes,
    create: function (name, team, top, bottom, ship) {
      const propGroup = Render.group()
      propGroup.position.set(14, 0, 54)
      bottom.add(propGroup)
      ship.propGroup = propGroup
      this.createMeshes(name, team, propGroup, bottom, ship)
    },

    tween: function (renderTime) {
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
    split: true,

    healthMax: [600, 10],
    healthRegen: [30, 1],
    armor: [10, 0],

    sightRange: [180, 0],
    attackRange: [170, 0],

    attackDamage: [70, 3],
    attackPierce: [0, 0],
    attackCooldown: [22, 0],
    attackMoveSpeed: 8,
    bulletSize: 5,

    moveSpeed: [8, 0],
    turnSpeed: 5,
    collision: 22,

    create: createMeshes,
  },

  boxy: {
    split: true,

    healthMax: [800, 40],
    healthRegen: [40, 2],
    armor: [20, 0],

    sightRange: [160, 1],
    attackRange: [120, 1],

    attackDamage: [40, 1],
    attackPierce: [0, 0],
    attackCooldown: [18, 0],
    attackMoveSpeed: 11,
    bulletSize: 4,

    moveSpeed: [9, 0],
    turnSpeed: 6,
    collision: 24,

    create: createMeshes,
  },

  glitch: {
    split: false,

    healthMax: [500, 10],
    healthRegen: [40, 1],
    armor: [30, 0],

    sightRange: [140, 0],
    attackRange: [130, 0],

    attackDamage: [60, 3],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 14,
    bulletSize: 4,

    moveSpeed: [12, 0],
    turnSpeed: 12,
    collision: 16,

    create: createMeshes,
  },

  sinker: {
    split: true,

    healthMax: [800, 20],
    healthRegen: [60, 1],
    armor: [10, 1],

    sightRange: [160, 0],
    attackRange: [140, 0],

    attackDamage: [30, 2],
    attackPierce: [0, 0],
    attackCooldown: [16, 0],
    attackMoveSpeed: 11,
    bulletSize: 4,

    moveSpeed: [10, 0],
    turnSpeed: 9,
    collision: 18,

    create: createMeshes,
  },
}
