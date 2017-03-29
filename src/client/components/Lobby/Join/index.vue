<template>
<div class="lobby-join inherit scrolls">
  <div v-if="size === null">
    <h1>Loading...</h1>
  </div>
  <div v-else>
    <h1>{{ size }} v {{ size }}</h1>
    <h3>{{ playerCount }} of {{ size * 2 }} players</h3>
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

export default {
  components: {
    PlayerBox,
  },

  props: {
    gid: String,
  },

  data () {
    return {
      size: null,
      draftMessage: '',
    }
  },

  created () {
    LobbyEvents.connect('join', { gid: this.gid }, (data) => {
      if (data.error) {
        const errorMessage = `Join error: ${data.error}`
        window.alert(errorMessage)
        router.replace({ name: 'Lobby' })
      } else {
        this.size = data.size
        console.log('join', data)
        const newGame = new Game(data.gid, data.size)
        newGame.updatePlayers(data)
        Local.game = newGame
      }
    })
  },

  beforeDestroy () {
    if (Local.game && !Local.game.readyToStart) {
      Local.leaving = Local.game.id
      LobbyEvents.connect('leave game')
    }
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
  },

  watch: {
    pressed (key) {
      if (key.name === 'enter') {
        this.$nextTick(() => {
          this.$refs.chatInput.focus()
        })

        if (this.draftMessage) {
          Bridge.emit('chat', { team: true, body: this.draftMessage }) //TODO or global
          this.draftMessage = ''
        }
      }
    },
  },
}
</script>

<style lang="stylus" scoped>
.lobby-join
  padding-bottom 64px
  box-sizing border-box

.chat-input-container
  position absolute
  left 0
  right 0
  bottom 0
  height 64px
  width 100%
.chat-input
  height inherit
  width inherit

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
