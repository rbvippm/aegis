<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'glass' | 'data'; as?: 'section' | 'div' | 'article' }>(), {
  variant: 'data',
  as: 'section',
})
</script>
<template>
  <component :is="as" :class="['surface', variant === 'glass' ? 'ae-glass' : 'ae-surface']"
    ><slot
  /></component>
</template>
