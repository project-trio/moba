<template>
<div class="lobby-join">
  <h1>New game</h1>
  <h3>{{ players.length }} of {{ gameSize }} players</h3>
  <div>
  </div>
  Invite a friend: <a :href="url">{{ url }}</a>
</div>
</template>

<script>
export default {
  props: {
    gid: String,
  },

  computed: {
    gameSize () {
      return 0 * 2
    },

    players () {
      return []
    },

    url () {
      return window.location.href
    },
  },

  methods: {

  },
}
</script>

<style lang="stylus" scoped>
.lobby-join
  color #111
</style>
