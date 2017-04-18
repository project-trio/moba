import Mini from '@/play/game/entity/unit/mini'

export default {

  spawn (waveData, renderTime) {
    waveData.forEach((minionData) => {
      const paths = minionData.paths
      const name = minionData.type
      for (let team = 0; team < 2; team += 1) {
        for (let mirror = 0; mirror < (minionData.mirror ? 2 : 1); mirror += 1) {
          const mirrored = mirror == 0
          for (let pi = 0; pi < paths.length; pi += 1) {
            const path = paths[pi]
            const mini = Mini.spawn(team, name, path, mirrored)
            mini.container.position.z = -10
            mini.queueAnimation('container', 'position', {
              axis: 'z',
              from: -10,
              to: 0,
              start: renderTime,
              duration: 1000,
            })
          }
          // return //SAMPLE
        }
      }
    })
  },

}
