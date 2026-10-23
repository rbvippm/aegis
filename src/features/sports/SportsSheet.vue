<script setup lang="ts">
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>
<template>
  <BottomDrawer :open="open" :title="title" @close="emit('close')">
    <div class="sp-sheet-body"><slot /></div>
  </BottomDrawer>
</template>
