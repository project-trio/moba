<template>
<div class="selection-group">
	<slot />
</div>
</template>

<script>
export default {
}
</script>

<style lang="stylus" scoped>
.selection-group
	margin auto
	width 480px
	max-width 100%
	display flex
	flex-wrap wrap

.selection
	margin 4px
	height 56px
	flex-grow 1
	flex-basis 16%
	box-sizing border-box
	border-radius 1px

.selection
	background #ddd

.selection.selected
	background #dd6677
</style>
