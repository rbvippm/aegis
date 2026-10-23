<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { X } from '@lucide/vue'
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (open && !dialog.value?.open) dialog.value?.showModal()
    else if (!open) dialog.value?.close()
  },
  { immediate: true },
)
onBeforeUnmount(() => dialog.value?.close())
</script>
<template>
  <dialog
    ref="dialog"
    class="sp-sheet"
    aria-labelledby="sp-sheet-title"
    @close="emit('close')"
    @click="
      (event) => {
        if (event.target === dialog) emit('close')
      }
    "
  >
    <header>
      <span class="sp-sheet-handle"></span>
      <h2 id="sp-sheet-title">{{ title }}</h2>
      <button aria-label="关闭面板" @click="emit('close')"><X :size="22" /></button>
    </header>
    <div class="sp-sheet-body"><slot /></div>
  </dialog>
</template>
