<template>
<div class="lobby-create inherit scrolls">
	<h1>{{ isMod ? 'create game' : 'training bots' }}</h1>
	<div v-if="loading">
		...
	</div>
	<div v-else>
		<div v-if="isMod">
			<h3>game type:</h3>
			<selection-group>
				<button v-for="mode in gameModes" @click="onGameMode(mode)" class="selection interactive" :class="{ selected: mode === selectedMode }" :key="mode.name">{{ mode.name }}</button>
				<div class="mode-description">
					{{ selectedMode.description }}
				</div>
			</selection-group>
		</div>
		<h3>{{ pvpMode ? 'max players' : 'game size' }}:</h3>
		<game-sizes @select="selectedSize = $event" :gameSizes="gameSizes" :selectedSize="selectedSize" :pvpMode="pvpMode" />
		<h3>map:</h3>
		<game-maps @select="selectedMap = $event" :selectedSize="selectedSize" :selectedMap="selectedMap" />
		<button @click="onSubmit" class="big interactive">confirm</button>
	</div>
</div>
</template>

<script>
import router from '@/client/router'
import store from '@/client/store'

import CommonConsts from '@/common/constants'

import Local from '@/client/play/local'

import LobbyEvents from '@/client/play/events/lobby'

import SelectionGroup from '@/client/components/Lobby/SelectionGroup'
import GameMaps from '@/client/components/Lobby/SelectionGroup/GameMaps'
import GameSizes from '@/client/components/Lobby/SelectionGroup/GameSizes'

export default {
	components: {
		GameMaps,
		GameSizes,
		SelectionGroup,
	},

	data () {
		return {
			loading: false,
			selectedMode: CommonConsts.GAME_MODES[0],
			selectedSize: 0,
			selectedMap: null,
		}
	},

	computed: {
		username () {
			return store.state.signin.username
		},
		isMod () {
			return this.username === 'kiko ' || this.username === 'mod'
		},

		gameModes () {
			return CommonConsts.GAME_MODES
		},

		pvpMode () {
			return this.selectedMode === this.gameModes[0]
		},

		gameSizes () {
			let sizes = CommonConsts.GAME_SIZES
			if (this.pvpMode) {
				return sizes
			}
			sizes = sizes.slice(0, 2)
			sizes.push(25)
			return sizes
		},
	},

	created () {
		if (!this.isMod) {
			this.selectedMode = this.gameModes[1]
		}
	},

	methods: {
		onGameMode (mode) {
			this.selectedMode = mode
			if (!this.pvpMode) {
				this.selectedSize = 1
			}
		},

		onSubmit () {
			LobbyEvents.connect('create', { mode: this.selectedMode.name, size: this.selectedSize, map: this.selectedMap }, (data) => {
				if (data.error) {
					const errorMessage = `Unable to create game: ${data.error}`
					if (Local.TESTING) {
						warn(errorMessage)
					} else {
						window.alert(errorMessage)
					}
					if (data.backToLobby) {
						router.replace({ name: 'Lobby' })
					}
				} else {
					router.replace({ name: 'Join', params: { gid: data.gid } })
				}
			})
		},
	},
}
</script>

<style lang="stylus" scoped>
.mode-description
	text-align center
	margin auto

button.big
	margin-top 32px
</style>
