<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Check, Languages } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { languageOptions, type LanguageId } from '@/mocks/languages'

const route = useRoute()
const open = ref(false)
const selected = ref<LanguageId>('zh-Hans')
const root = ref<HTMLElement>()
const current = computed(
  () => languageOptions.find((item) => item.id === selected.value) ?? languageOptions[0],
)

function toggle() {
  open.value = !open.value
}
function choose(id: LanguageId) {
  selected.value = id
  open.value = false
}
function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}
watch(open, (value) => {
  if (value) {
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('keydown', onKeydown)
  }
})
watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="lang-switch">
    <button
      type="button"
      class="lang-switch__trigger"
      aria-haspopup="listbox"
      :aria-expanded="open"
      aria-controls="language-options"
      @click="toggle"
    >
      <Languages :size="18" :stroke-width="1.75" aria-hidden="true" />
      <span>{{ current.button }}</span>
    </button>
    <ul v-if="open" id="language-options" class="lang-switch__menu" role="listbox" aria-label="语言">
      <li v-for="item in languageOptions" :key="item.id">
        <button
          type="button"
          role="option"
          :aria-selected="item.id === selected"
          @click="choose(item.id)"
        >
          <span>{{ item.label }}</span>
          <Check v-if="item.id === selected" :size="16" :stroke-width="2.25" aria-hidden="true" />
        </button>
      </li>
    </ul>
  </div>
</template>
