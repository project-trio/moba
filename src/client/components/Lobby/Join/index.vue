<template>
<div class="lobby-join inherit scrolls">
  <div v-if="size === null">
    <h1>Loading...</h1>
  </div>
  <div v-else>
    <h1>{{ size }} v {{ size }}</h1>
    <h2>{{ map }} map</h2>
    <div class="player-teams scrolls">
      <div class="team-players team-1">
        <h3 class="vertical">Team Blue</h3>
        <player-box v-for="(player, index) in teamPlayers[0]" :player="player" :key="player ? player.id : index"></player-box>
      </div>
      <div class="team-players team-2">
        <h3 class="vertical">Team Pink</h3>
        <player-box v-for="(player, index) in teamPlayers[1]" :player="player" :key="player ? player.id : index"></player-box>
      </div>
    </div>
    <div class="invite-link faint note">
      Invite a friend: <a :href="url" onclick="return false">{{ url }}</a>
    </div>
    <button @click="onStart" v-if="isHost" class="big interactive">{{ startText }}</button>
    <div class="chat-input-container">
      <input ref="chatInput" v-model.trim="draftMessage" class="chat-input" placeholder="press enter to chat" :disabled="disableChat"></input>
    </div>
  </div>
</div>
</template>

<script>
import router from '@/router'
import store from '@/store'

import Game from '@/play/game/entity/game/game'

import Bridge from '@/play/events/bridge'
import LobbyEvents from '@/play/events/lobby'

import Local from '@/play/local'

import PlayerBox from '@/components/Lobby/Join/PlayerBox'

const KEY_ENTER = 13

export default {
  components: {
    PlayerBox,
  },

  props: {
    gid: String,
  },

  data () {
    return {
      map: null,
      size: null,
      draftMessage: '',
    }
  },

  created () {
    store.state.chatMessages = []
    Local.gid = this.gid
    LobbyEvents.connect('join', { gid: this.gid }, (data) => {
      if (data.error) {
        const errorMessage = `Join error: ${data.error}`
        if (Local.TESTING) {
          window.alert(errorMessage)
        } else {
          console.warn(errorMessage)
        }
        router.replace({ name: 'Lobby' })
      } else {
        this.size = data.size
        this.map = data.map
        console.log('join', data)
        if (Local.game) {
          console.warn('Game already exists', data)
        } else {
          const newGame = new Game(data.gid, data.mode, data.size, data.map)
          newGame.updatePlayers(data)
          Local.game = newGame
        }
      }
    })
  },

  computed: {
    gameSize () {
      return `${this.size} v ${this.size}`
    },

    playerCount () {
      return Object.keys(this.players).length
    },

    players () {
      return store.state.game.players
    },
    teamPlayers () {
      const result = [Array(this.size), Array(this.size)]
      for (let pid in this.players) {
        const player = this.players[pid]
        player.id = pid
        result[player.team][player.teamIndex] = player
      }
      return result
    },

    url () {
      return window.location.href
    },

    disableChat () {
      return !this.pressed
    },

    pressed () {
      return store.state.key.pressed
    },

    isHost () {
      console.log(store.state.playerId, store.state.game.host)
      return store.state.playerId === store.state.game.host
    },
    startText () {
      return this.readyToStart ? 'start!' : 'waiting...'
    },
    readyToStart () {
      return store.state.game.ready
    },
  },

  watch: {
    pressed (key) {
      if (key.code === KEY_ENTER) {
        this.$nextTick(() => {
          this.$refs.chatInput.focus()
        })

        if (this.draftMessage) {
          Bridge.emit('chat', { team: false, body: this.draftMessage }, (response) => {
            if (response.error) {
              //TODO display throttle error
              console.log('chat err', response)
            } else {
              this.draftMessage = ''
            }
          })
        }
      }
    },
  },

  methods: {
    onStart () {
      if (!this.readyToStart) {
        return
      }
      Bridge.emit('start game', {}, (data) => {
        if (data.error) {
          const errorMessage = `Start error: ${data.error}`
          window.alert(errorMessage)
        } else {
        }
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
.lobby-join
  padding-bottom 64px
  box-sizing border-box

.chat-input-container
  position fixed
  left 0
  right 0
  bottom 0
  height 64px
  width 100%
.chat-input
  height inherit
  width inherit
  font-size 1.5em
  padding 0 8px
  background transparent

.vertical
  display none

.player-teams
  display flex
  flex-direction column
  width 100%
  overflow-x auto
  height 360px
  justify-content space-between

.team-players
  padding 8px
  display flex
  flex-direction row

.invite-link
  margin 32px 8px

@media (max-width: 768px)
  .vertical
    display block

  .player-teams
    flex-direction row
    height auto
  .team-players
    flex-direction column
    flex-basis 50%

</style>
