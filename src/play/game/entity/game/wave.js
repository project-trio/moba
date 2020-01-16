import { AXIS_Z } from '@/play/data/constants'

import Mini from '@/play/game/entity/unit/mini'

export default {

	spawn (waveData, spawnOneKind, spawnRanged, renderTime, retro) {
		for (const minionData of waveData) {
			const paths = minionData.paths
			const name = minionData.type
			if (spawnOneKind && spawnRanged !== (name === 'ranged')) {
				continue
			}
			for (let team = 0; team < 2; team += 1) {
				for (let mirror = 0; mirror < (minionData.mirror ? 2 : 1); mirror += 1) {
					const mirrored = mirror === 0
					for (const path of paths) {
						const mini = Mini.spawn(team, name, path, mirrored, retro)
						mini.model.scale.set(0.1, 0.1, 0.1)
						mini.queueAnimation('model', 'scale', {
							axis: 'all',
							from: 0.1,
							to: 1,
							start: renderTime,
							duration: 1000,
						})
						mini.model.position.z = -10
						mini.queueAnimation('model', 'position', {
							axis: AXIS_Z,
							from: -10,
							to: 0,
							start: renderTime,
							duration: 1000,
						})
					}
					// return //SAMPLE
				}
			}
		}
	},

}
