import Mini from '@/play/game/entity/unit/mini'

export default {

  spawn (waveData) {
    waveData.forEach((minionData) => {
      const paths = minionData.paths
      const name = minionData.type
      for (let team = 0; team < 2; team += 1) {
        for (let mirror = 0; mirror < (minionData.mirror ? 2 : 1); mirror += 1) {
          const mirrored = mirror == 0
          for (let pi = 0; pi < paths.length; pi += 1) {
            const path = paths[pi]
            Mini.spawn(team, name, path, mirrored)
          }
        }
      }
    })
  },

}
