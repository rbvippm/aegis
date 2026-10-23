<script setup lang="ts">
import { SearchX, CircleAlert, LoaderCircle } from '@lucide/vue'
defineProps<{ title: string; description?: string; error?: boolean; loading?: boolean }>()
</script>
<template>
  <div class="state-panel" :role="error ? 'alert' : 'status'">
    <LoaderCircle v-if="loading" class="spin" :size="25" /><CircleAlert
      v-else-if="error"
      :size="25"
    /><SearchX v-else :size="25" /> <strong>{{ title }}</strong>
    <p v-if="description">{{ description }}</p>
    <slot />
  </div>
</template>
