<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { X } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
const props = defineProps<{
  modelValue: string[]
  options: { id: string; label: string }[]
  label: string
  showSelection?: boolean
}>()
const control = ref<InstanceType<typeof GlassSelect>>()
async function remove(id: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((v) => v !== id),
  )
  await nextTick()
  ;(control.value?.$el as HTMLElement | undefined)
    ?.querySelector<HTMLButtonElement>('[role=combobox]')
    ?.focus({ preventScroll: true })
}
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()
const selected = computed(() => props.options.filter((o) => props.modelValue.includes(o.id)))
const display = computed(() =>
  !props.options.length
    ? `暂无${props.label}`
    : selected.value.length === props.options.length
      ? `全部${props.label}`
      : `${selected.value.length} ${props.label === '平台' ? '家' : props.label === '公链' ? '条' : '种'}${props.label}`,
)
function selectAll() {
  emit('update:modelValue', [...new Set([...props.modelValue, ...props.options.map((o) => o.id)])])
}
function clear() {
  emit(
    'update:modelValue',
    props.modelValue.filter((id) => !props.options.some((o) => o.id === id)),
  )
}
function toggle(value: string | number) {
  if (!value) return
  const id = String(value)
  emit(
    'update:modelValue',
    props.modelValue.includes(id)
      ? props.modelValue.filter((v) => v !== id)
      : [...props.modelValue, id],
  )
}
</script>
<template>
  <div
    class="ma-multi"
    :class="{
      'ma-multi--detailed': showSelection,
      'ma-multi--custom': options.length > 0 && selected.length !== options.length,
    }"
  >
    <div v-if="showSelection" class="ma-multi__heading">
      <h3>{{ label }}</h3>
      <span v-if="showSelection" class="ma-multi__count"
        >已选 {{ selected.length }}/{{ options.length }}</span
      >
      <span class="ma-multi__actions">
        <button class="ma-text" :disabled="!options.length" @click="selectAll">全选</button>
        <button class="ma-text" :disabled="!selected.length" @click="clear">清空</button>
      </span>
    </div>
    <GlassSelect
      ref="control"
      model-value=""
      :selected-values="modelValue"
      :label="label"
      :display-value="display"
      searchable
      @update:model-value="toggle"
    >
      <option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option>
    </GlassSelect>
    <div v-if="showSelection" class="ma-multi__choices">
      <button
        v-for="o in selected"
        :key="o.id"
        :aria-label="`移除${o.label}`"
        @click="remove(o.id)"
      >
        {{ o.label }}<X :size="13" aria-hidden="true" />
      </button>
      <p v-if="!selected.length" class="ma-note">尚未选择{{ label }}。</p>
    </div>
  </div>
</template>
