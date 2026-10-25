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
  <GlassSelect v-model="selected" label="语言" :display-value="current.button" plain hide-chevron>
    <template #leading><Languages :size="18" :stroke-width="1.75" aria-hidden="true" /></template>
    <option v-for="item in languageOptions" :key="item.id" :value="item.id">
      {{ item.label }}
    </option>
  </GlassSelect>
</template>
