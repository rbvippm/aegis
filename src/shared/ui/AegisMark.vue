<script setup lang="ts">
import mark from '@/shared/assets/aegis-mark.png'
</script>

<template>
  <img class="aegis-mark" :src="mark" alt="" draggable="false" />
</template>

<style scoped>
.aegis-mark {
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}
</style>
