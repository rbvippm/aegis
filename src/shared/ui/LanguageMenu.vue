<script setup lang="ts">
import { computed, ref } from 'vue'
import { Languages } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { languageOptions } from '@/mocks/languages'
const selected = ref('zh-Hans')
const current = computed(
  () => languageOptions.find((item) => item.id === selected.value) ?? languageOptions[0]!,
)
</script>
<template>
  <GlassSelect
    class="language-menu"
    v-model="selected"
    label="语言"
    :display-value="current.button"
    plain
    hide-chevron
  >
    <template #leading><Languages :size="17" :stroke-width="1.8" aria-hidden="true" /></template>
    <option v-for="item in languageOptions" :key="item.id" :value="item.id">
      {{ item.label }}
    </option>
  </GlassSelect>
</template>
<style scoped>
.language-menu :deep(.glass-select__trigger) {
  gap: 5px;
  min-height: 44px;
  padding: 0 8px;
  border-radius: 12px;
  color: var(--ae-text);
  font-size: 13px;
  font-weight: 550;
  line-height: 1.4;
  transition:
    background 160ms ease,
    color 160ms ease;
}
.language-menu :deep(.glass-select__trigger > svg) {
  width: 17px;
  height: 17px;
  color: var(--ae-muted);
}
.language-menu :deep(.glass-select__trigger[aria-expanded='true']) {
  background: #eaf3ff;
  color: var(--ae-highlight);
}
.language-menu :deep(.glass-select__trigger[aria-expanded='true'] > svg) {
  color: var(--ae-highlight);
}
.language-menu :deep(.glass-select__trigger:active) {
  background: #edf4fd;
}
@media (prefers-reduced-motion: reduce) {
  .language-menu :deep(.glass-select__trigger) {
    transition: none;
  }
}
</style>
