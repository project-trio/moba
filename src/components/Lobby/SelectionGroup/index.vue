<template>
<div class="selection-group">
	<slot />
</div>
</template>

<script>
export default {
}
</script>

<style lang="postcss" scoped>
.selection-group {
	@apply mx-auto w-128 max-w-full  flex flex-wrap;
}

.big {
	@apply flex-grow  m-1 rounded-full;
	flex-basis: 16%;
	&.selected {
		background: #dd6677;
	}
}
</style>
