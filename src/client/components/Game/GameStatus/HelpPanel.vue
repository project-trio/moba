<template>
<div class="help-panel bar-section panel">
  <h1>Help</h1>
  <p>Click the gear icon to access quality settings. Tweak these settings as needed if your framerate is dropping below 30.</p>
  <h2>Hotkeys</h2>
  <h4>Skills</h4>
  <p>Activate: <b>1</b>, <b>2</b>, <b>3</b></p>
  <p>Upgrade: <b>shift</b>/<b>control</b>/<b>alt</b> + <b>1</b>, <b>2</b>, <b>3</b></p>
  <h4>Chat</h4>
  <p>With team: <b>enter</b></p>
  <p>Globally: <b>shift</b>/<b>control</b>/<b>alt</b> + <b>enter</b></p>
  <h4>Overlays</h4>
  <p>Show scoreboard: hold <b>tab</b></p>
  <p>Use <b>Esc</b> to exit fullscreen, cancel chat input, or close overlays</p>
</div>
</template>

<script>
export default {

}
</script>

<style lang="stylus" scoped>
.help-panel
  pointer-events none

h4
  margin-bottom 0
</style>
