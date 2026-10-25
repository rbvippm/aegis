<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'
import type { StyleValue } from 'vue'
import { Check, ChevronDown } from '@lucide/vue'
import { useRoute } from 'vue-router'
defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    modelModifiers?: { number?: boolean }
    label?: string
    displayValue?: string
    plain?: boolean
    hideChevron?: boolean
    searchable?: boolean
  }>(),
  { label: '' },
)
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [event: Event]
}>()
const attrs = useAttrs()
const route = useRoute()
const id = useId()
const root = ref<HTMLElement>()
const native = ref<HTMLSelectElement>()
const trigger = ref<HTMLButtonElement>()
const menu = ref<HTMLElement>()
const open = ref(false)
const selected = ref('')
const labelText = ref(props.label)
const options = ref<{ value: string; label: string; disabled: boolean }[]>([])
const teleportTarget = ref<HTMLElement | string>('body')
const position = ref<Record<string, string>>({})
const highlighted = ref(-1)
const query = ref('')
const searchInput = ref<HTMLInputElement>()
const visibleOptions = computed(() =>
  options.value
    .map((item, index) => ({ item, index }))
    .filter(
      ({ item }) =>
        !query.value.trim() || item.label.toLowerCase().includes(query.value.trim().toLowerCase()),
    ),
)
function searchKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close(true)
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlighted.value = visibleOptions.value.find((o) => !o.item.disabled)?.index ?? -1
    menu.value?.focus()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    choose(visibleOptions.value.find((o) => !o.item.disabled)?.index ?? -1)
  }
}
const current = computed(
  () => options.value.find((item) => item.value === selected.value)?.label ?? '',
)
const accessibleLabel = computed(
  () => String(attrs['aria-label'] ?? props.label ?? '') || labelText.value || '选择选项',
)
let observer: MutationObserver | undefined
function sync() {
  if (!native.value) return
  const items = Array.from(native.value.options).map((option) => ({
    value: option.value,
    label: option.text,
    disabled: option.disabled,
  }))
  if (JSON.stringify(items) !== JSON.stringify(options.value)) options.value = items
  selected.value = native.value.value
}
function close(restore = false) {
  open.value = false
  if (restore) trigger.value?.focus({ preventScroll: true })
}
function placeMenu() {
  if (!trigger.value) return
  const rect = trigger.value!.getBoundingClientRect()
  const dialog = root.value?.closest('dialog')
  const bounds = dialog?.getBoundingClientRect()
  teleportTarget.value = dialog ?? document.body
  const viewportWidth = document.documentElement.clientWidth
  const topEdge = bounds ? bounds.top + 8 : 8
  const bottomEdge = bounds ? bounds.bottom - 8 : (window.visualViewport?.height ?? innerHeight) - 8
  const below = bottomEdge - rect.bottom - 6
  const above = rect.top - topEdge - 6
  const upwards = below < Math.min(200, options.value.length * 44 + 12) && above > below
  const menuHeight = Math.min(280, Math.max(44, upwards ? above : below))
  const width = Math.min(Math.max(rect.width, 160), (bounds?.width ?? viewportWidth) - 24)
  const left = Math.max(
    (bounds?.left ?? 0) + 8,
    Math.min(rect.left, (bounds?.right ?? viewportWidth) - width - 8),
  )
  position.value = {
    position: dialog ? 'absolute' : 'fixed',
    width: `${width}px`,
    maxHeight: `${menuHeight}px`,
    left: `${left - (bounds?.left ?? 0)}px`,
    top: `${(upwards ? rect.top - 6 : rect.bottom + 6) - (bounds?.top ?? 0)}px`,
    transform: upwards ? 'translateY(-100%)' : 'none',
  }
}
async function show() {
  if (attrs.disabled === true || attrs.disabled === '') return
  query.value = ''
  sync()
  placeMenu()
  highlighted.value = Math.max(
    0,
    options.value.findIndex((item) => item.value === selected.value && !item.disabled),
  )
  open.value = true
  await nextTick()
  // Opening options must not summon the mobile keyboard. Search is opt-in.
  menu.value?.focus({ preventScroll: true })
  revealOption(highlighted.value)
}
function revealOption(index: number) {
  const option = menu.value?.querySelector<HTMLElement>(`[data-index="${index}"]`)
  if (!option || !menu.value) return
  if (option.offsetTop < menu.value.scrollTop) menu.value.scrollTop = option.offsetTop
  else if (option.offsetTop + option.offsetHeight > menu.value.scrollTop + menu.value.clientHeight)
    menu.value.scrollTop = option.offsetTop + option.offsetHeight - menu.value.clientHeight
}
function choose(index: number) {
  const option = options.value[index]
  if (!option || option.disabled || !native.value) return
  native.value.value = option.value
  native.value.dispatchEvent(new Event('change', { bubbles: true }))
  close(true)
}
function change(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  selected.value = value
  emit(
    'update:modelValue',
    props.modelModifiers?.number || typeof props.modelValue === 'number' ? Number(value) : value,
  )
  emit('change', event)
  void nextTick(sync)
}
function navigate(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close(true)
    return
  }
  if (event.key === 'Tab') {
    if (props.searchable && event.target === menu.value && !event.shiftKey) {
      event.preventDefault()
      searchInput.value?.focus({ preventScroll: true })
      return
    }
    close(true)
    return
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    choose(highlighted.value)
    return
  }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const enabled = visibleOptions.value
    .map(({ item, index }) => (item.disabled ? -1 : index))
    .filter((index) => index >= 0)
  const currentIndex = enabled.indexOf(highlighted.value)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? enabled.length - 1
        : (currentIndex + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length
  highlighted.value = enabled[next] ?? -1
  revealOption(highlighted.value)
}
function outside(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node) && !menu.value?.contains(event.target as Node))
    close()
}
function scroll(event: Event) {
  if (open.value && !menu.value?.contains(event.target as Node)) placeMenu()
}
watch(
  () => props.modelValue,
  () => void nextTick(sync),
)
watch(
  () => route.fullPath,
  () => close(),
)
onMounted(() => {
  const label = root.value?.closest('label')?.cloneNode(true) as HTMLElement | undefined
  label?.querySelectorAll('.glass-select').forEach((el) => el.remove())
  labelText.value = label?.textContent?.trim() ?? ''
  sync()
  observer = new MutationObserver(sync)
  if (native.value)
    observer.observe(native.value, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })
  document.addEventListener('pointerdown', outside)
  window.addEventListener('scroll', scroll, true)
  window.addEventListener('resize', scroll)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('pointerdown', outside)
  window.removeEventListener('scroll', scroll, true)
  window.removeEventListener('resize', scroll)
})
</script>
<template>
  <span
    ref="root"
    class="glass-select"
    :class="[attrs.class, { 'glass-select--plain': plain }]"
    :style="attrs.style as StyleValue"
  >
    <select
      ref="native"
      v-bind="
        Object.fromEntries(
          Object.entries(attrs).filter(([key]) => !['class', 'style', 'aria-label'].includes(key)),
        )
      "
      class="glass-select__native"
      :value="modelValue ?? selected"
      tabindex="-1"
      aria-hidden="true"
      @change="change"
      @invalid.prevent="trigger?.focus()"
    >
      <slot />
    </select>
    <button
      ref="trigger"
      type="button"
      class="glass-select__trigger"
      role="combobox"
      :aria-label="accessibleLabel"
      :aria-expanded="open"
      :aria-required="attrs.required !== undefined ? true : undefined"
      aria-haspopup="listbox"
      :aria-controls="`${id}-options`"
      :disabled="attrs.disabled === true || attrs.disabled === ''"
      @click="open ? close() : show()"
      @keydown.down.prevent="show"
      @keydown.up.prevent="show"
    >
      <slot name="leading" /><span>{{ displayValue ?? current }}</span
      ><ChevronDown v-if="!hideChevron" :size="14" aria-hidden="true" />
    </button>
    <Teleport :to="teleportTarget"
      ><ul
        v-if="open"
        :id="`${id}-options`"
        ref="menu"
        class="glass-select__menu"
        :style="position"
        role="listbox"
        :aria-label="accessibleLabel"
        tabindex="-1"
        :aria-activedescendant="`${id}-${highlighted}`"
        @keydown="navigate"
      >
        <li v-if="searchable" role="presentation" class="glass-select__search">
          <input
            ref="searchInput"
            v-model="query"
            type="search"
            :aria-label="`搜索${accessibleLabel}`"
            placeholder="输入关键词筛选"
            @keydown.stop="searchKey"
            @click.stop
          />
        </li>
        <li v-if="!visibleOptions.length" role="presentation" class="glass-select__empty">
          暂无匹配选项
        </li>
        <li
          v-for="{ item: option, index } in visibleOptions"
          :id="`${id}-${index}`"
          :key="`${option.value}-${index}`"
          role="option"
          :aria-selected="selected === option.value"
          :aria-disabled="option.disabled"
          :data-index="index"
          :class="{ 'is-highlighted': highlighted === index }"
          @click.stop="choose(index)"
        >
          <span>{{ option.label }}</span
          ><Check v-if="selected === option.value" :size="16" aria-hidden="true" />
        </li></ul
    ></Teleport>
  </span>
</template>
<style>
.glass-select {
  position: relative;
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
  vertical-align: middle;
}
.glass-select .glass-select__native {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  opacity: 0 !important;
  pointer-events: none !important;
  clip-path: inset(50%);
  padding: 0 !important;
  border: 0 !important;
}
.glass-select__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  border: 1px solid #d7e6f8;
  border-radius: 14px;
  padding: 8px 12px;
  background: #f8fbff;
  color: #14213d;
  font: inherit;
  cursor: pointer;
  text-align: left;
}
.glass-select__trigger > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.glass-select__trigger svg {
  flex-shrink: 0;
}
.glass-select--plain .glass-select__trigger {
  background: transparent;
  border: 0;
  padding: 0 6px;
  justify-content: center;
  font-size: 14px;
}
.glass-select__trigger:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
.glass-select__trigger:disabled {
  opacity: 0.5;
  cursor: default;
}
.glass-select__menu {
  z-index: 200;
  margin: 0;
  padding: 6px;
  list-style: none;
  overflow-y: auto;
  overscroll-behavior: contain;
  border: 1px solid white;
  border-radius: 16px;
  background: #f8fbff;
  box-shadow:
    inset 0 1px #fff,
    0 12px 32px #14365c28;
  outline: none;
  color: #14213d;
}
.glass-select__menu li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 44px;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.glass-select__menu li[aria-selected='true'] {
  color: #0864ff;
  background: #e7f2ff;
}
.glass-select__menu:focus-visible li.is-highlighted:not([aria-selected='true']) {
  box-shadow: inset 0 0 0 1px #bad5f6;
}
.glass-select__menu li[aria-disabled='true'] {
  opacity: 0.45;
  cursor: default;
}
:is(.research-field, .sp-field, .pf-field, .svc-form label) > .glass-select {
  width: 100%;
}
.glass-select__menu .glass-select__search {
  position: sticky;
  top: -6px;
  z-index: 1;
  padding: 4px 0 8px;
  background: #f8fbff;
  cursor: default;
}
.glass-select__search input {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid #d7e6f8;
  border-radius: 10px;
  padding: 8px;
  background: white;
  font-size: 16px;
  color: #14213d;
}
.glass-select__menu .glass-select__empty {
  font-size: 12px;
  color: var(--ae-muted);
  cursor: default;
}
</style>
