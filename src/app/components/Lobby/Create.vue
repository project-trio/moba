<template>
<div class="lobby-create scrolls">
	<h1>{{ isAdmin ? 'create game' : 'training bots' }}</h1>
	<div v-if="isAdmin">
		<h2 class="m-header">game type:</h2>
		<SelectionGroup>
			<button v-for="mode in gameModes" :key="mode.name" class="big interactive" :class="{ selected: mode === selectedMode }" @click="onGameMode(mode)">{{ mode.name }}</button>
			<div class="m-auto text-center">{{ selectedMode.description }}</div>
		</SelectionGroup>
	</div>
	<h2 class="m-header">{{ pvpMode ? 'max players' : 'game size' }}:</h2>
	<GameSizes :gameSizes="gameSizes" :selectedSize="selectedSize" :pvpMode="pvpMode" @select="selectedSize = $event" />
	<div v-if="selectedSize > 0">
		<h2 class="m-header">map:</h2>
		<GameMaps :selectedSize="selectedSize" :selectedMap="selectedMap" @select="selectedMap = $event" />
		<button class="interactive  mt-8" @click="onSubmit">confirm</button>
	</div>
</div>
</template>

<script>
import store from '@/app/store'

import { GAME_MODES, GAME_SIZES } from '@/play/data/constants'

import LobbyEvents from '@/play/events/lobby'

import SelectionGroup from '@/app/components/Lobby/SelectionGroup'
import GameMaps from '@/app/components/Lobby/SelectionGroup/GameMaps'
import GameSizes from '@/app/components/Lobby/SelectionGroup/GameSizes'

export default {
	components: {
		GameMaps,
		GameSizes,
		SelectionGroup,
	},

	data () {
		return {
			selectedMode: GAME_MODES[0],
			selectedSize: 0,
			selectedMap: null,
		}
	},

	computed: {
		isAdmin () {
			const user = store.state.signin.user
			return user && user.admin
		},

		gameModes () {
			return GAME_MODES
		},

		pvpMode () {
			return this.selectedMode === this.gameModes[0]
		},

		gameSizes () {
			return this.pvpMode ? GAME_SIZES : [ 1, 12, 25 ]
		},
	},

	created () {
		if (!this.isAdmin) {
			this.selectedMode = this.gameModes[1]
		}
	},

	methods: {
		onGameMode (mode) {
			this.selectedMode = mode
			if (!this.pvpMode) {
				this.selectedSize = 0
			}
		},

		onSubmit () {
			LobbyEvents.connect('create', { mode: this.selectedMode.name, size: this.selectedSize, map: this.selectedMap })
		},
	},
}
</script>
