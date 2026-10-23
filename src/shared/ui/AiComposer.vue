<script setup lang="ts">
import { ref } from 'vue'
import { ArrowUpRight, Square, Sparkles } from '@lucide/vue'
const props = withDefaults(
  defineProps<{ busy?: boolean; placeholder?: string; compact?: boolean }>(),
  {
    placeholder: '问比赛、查赔率、看出入金…',
  },
)
const emit = defineEmits<{ submit: [text: string]; stop: [] }>()
const text = ref('')
const composing = ref(false)
function submit() {
  const value = text.value.trim()
  if (!value || composing.value || props.busy) return
  emit('submit', value)
  text.value = ''
}
function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
    return
  if (event.isComposing || composing.value) return
  event.preventDefault()
  submit()
}
</script>
<template>
  <form
    class="ae-glass ae-composer"
    :class="{ 'composer-compact': compact }"
    aria-label="向 Aegis AI 提问"
    @submit.prevent="submit"
  >
    <Sparkles :size="19" class="composer-spark" aria-hidden="true" />
    <textarea
      v-model="text"
      rows="1"
      maxlength="2000"
      :placeholder="placeholder"
      aria-label="输入你的问题"
      :disabled="busy"
      @compositionstart="composing = true"
      @compositionend="composing = false"
      @keydown="onKeydown"
    ></textarea>
    <button
      v-if="busy"
      type="button"
      class="send-button stop-button"
      aria-label="停止生成"
      @click="emit('stop')"
    >
      <Square :size="15" fill="currentColor" />
    </button>
    <button v-else type="submit" class="send-button" :disabled="!text.trim()" aria-label="发送问题">
      <ArrowUpRight :size="21" />
    </button>
  </form>
</template>
