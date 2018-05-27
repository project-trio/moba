const CommonConsts = require.main.require('../common/constants')

const config = {}

config.tickDuration = 50
config.updateDuration = 200
config.updatesUntilStart = (CommonConsts.TESTING ? 5 : 20) * 1000 / config.updateDuration
config.maxIdleUpdates = CommonConsts.TESTING ? 1000 : 1000

module.exports = config
