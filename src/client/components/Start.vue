<template>
<div class="start">
  <div v-if="username == null">
    <h1>welcome to moba!</h1>
    <div v-if="loading">
      ...
    </div>
    <div v-else>
      <input v-model="enteringName" @keyup.enter="onEnterName" placeholder="enter a username"></input>
      <p class="note">note: there is no account system yet, just choose a name of your liking.</p>
    </div>
  </div>
  <div v-else>
    <router-link :to="{ name: 'Game' }" tag="button" class="interactive">play now</router-link>
    <router-link :to="{ name: 'Lobby' }" tag="button" class="interactive">enter lobby</router-link>
  </div>
</div>
</template>

<script>
import store from '@/store'

import Bridge from '@/play/bridge'

export default {
  data () {
    return {
      enteringName: this.username,
    }
  },

  computed: {
    loading () {
      return store.state.signin.loading
    },

    username () {
      return store.state.signin.username
    },
  },

  methods: {
    onEnterName () {
      store.setName(this.enteringName)
      Bridge.init()
    },
  },
}
</script>

<style lang="stylus" scoped>
.start
  color #111

input
  text-align center
  height 64px
  width 300px
  font-size 1.9em
  font-weight 300
  border 1px solid #ddd

button
  width 300px
  height 64px
  font-size 28px
  font-weight 500
  color #333
  display block
  margin 32px auto

.note
  font-style italic
</style>
