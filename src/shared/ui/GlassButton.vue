<script setup lang="ts">
withDefaults(defineProps<{ primary?: boolean; disabled?: boolean; type?: 'button' | 'submit' }>(), {
  type: 'button',
})
</script>
<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="['ae-button ae-pill', primary ? 'ae-button--primary' : 'secondary-button']"
  >
    <slot />
  </button>
</template>
