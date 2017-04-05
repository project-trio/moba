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
  pulsor: {
    split: true,
    lockTop: true,
    offsetTop: -12,
    topOffset: [14, 0, 55],

    healthMax: [800, 40],
    healthRegen: [40, 2],
    armor: [100, 5],

    sightRange: [160, 1],
    attackRange: [140, 1],

    attackDamage: [50, 1],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 11,
    bulletSize: 4,

    moveSpeed: [12, 0],
    turnSpeed: 10,
    collision: 24,

    createMeshes: createMeshes,
    create: function (name, team, top, bottom, ship) {
      const propGroup = Render.group()
      propGroup.position.set(14, 0, 54)
      top.add(propGroup)
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

    sightRange: [160, 0],
    attackRange: [160, 0],

    attackDamage: [60, 3],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 8,
    bulletSize: 5,

    moveSpeed: [9, 0],
    turnSpeed: 5,
    collision: 20,

    create: createMeshes,
  },

  boxy: {
    split: true,

    healthMax: [800, 40],
    healthRegen: [40, 2],
    armor: [100, 5],

    sightRange: [160, 1],
    attackRange: [140, 1],

    attackDamage: [50, 1],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 11,
    bulletSize: 4,

    moveSpeed: [12, 0],
    turnSpeed: 10,
    collision: 24,

    create: createMeshes,
  },

  glitch: {
    split: false,

    healthMax: [700, 10],
    healthRegen: [40, 1],
    armor: [50, 0],

    sightRange: [160, 0],
    attackRange: [120, 0],

    attackDamage: [70, 3],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 11,
    bulletSize: 4,

    moveSpeed: [14, 0],
    turnSpeed: 12,
    collision: 20,

    create: createMeshes,
  },

  sinker: {
    split: true,

    healthMax: [900, 20],
    healthRegen: [40, 1],
    armor: [5, 1],

    sightRange: [160, 0],
    attackRange: [140, 0],

    attackDamage: [40, 2],
    attackPierce: [0, 0],
    attackCooldown: [15, 0],
    attackMoveSpeed: 11,
    bulletSize: 4,

    moveSpeed: [12, 0],
    turnSpeed: 10,
    collision: 20,

    create: createMeshes,
  },
}
