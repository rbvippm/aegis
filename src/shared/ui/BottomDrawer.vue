<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'

const props = withDefaults(
  defineProps<{ open: boolean; title: string; subtitle?: string; closeLabel?: string }>(),
  { subtitle: '', closeLabel: '关闭面板' },
)
const emit = defineEmits<{ close: [] }>()
const titleId = useId()
const dialog = ref<HTMLDialogElement>()
const body = ref<HTMLDivElement>()
const content = ref<HTMLDivElement>()
const closingHeight = ref(0)
const detent = ref<'expanded' | 'half'>('expanded')
const viewport = ref(844)
const dragging = ref(false)
const closing = ref(false)
const entering = ref(false)
const dragHeight = ref(0)
const expandedHeight = computed(() => Math.round(viewport.value * 0.9))
const halfHeight = computed(() => Math.round(viewport.value * 0.5))
const height = computed(() =>
  closing.value
    ? closingHeight.value
    : dragging.value
      ? dragHeight.value
      : detent.value === 'half'
        ? halfHeight.value
        : expandedHeight.value,
)
let startY = 0
let startHeight = 0
let moved = false
let pointerId: number | null = null
let closeTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let closeNotified = false

function resize() {
  viewport.value = window.visualViewport?.height ?? window.innerHeight
  if (viewport.value < window.innerHeight * 0.75) detent.value = 'expanded'
}
function finishClose() {
  if (!dialog.value?.open) return
  dialog.value.close()
  onClosed()
}
function close() {
  if (closing.value || !dialog.value?.open) return
  closingHeight.value = dialog.value.getBoundingClientRect().height
  closing.value = true
  dragging.value = false
  closeTimer = setTimeout(
    finishClose,
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 240,
  )
}
function onClosed() {
  // A native close event can arrive after a different panel has already opened.
  if (dialog.value?.open || closeNotified) return
  closeNotified = true
  clearTimeout(closeTimer)
  closing.value = false
  window.visualViewport?.removeEventListener('resize', resize)
  window.removeEventListener('resize', resize)
  if (!disposed) emit('close')
}
function handleClick() {
  if (moved) {
    moved = false
    return
  }
  close()
}
function start(event: PointerEvent) {
  if (event.button !== 0 || pointerId !== null || closing.value) return
  pointerId = event.pointerId
  startY = event.clientY
  startHeight = height.value
  moved = false
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function move(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  const distance = event.clientY - startY
  if (Math.abs(distance) < 6 && !moved) return
  moved = true
  dragging.value = true
  dragHeight.value = Math.min(expandedHeight.value + 12, Math.max(100, startHeight - distance))
}
function end(event: PointerEvent, cancelled = false) {
  if (event.pointerId !== pointerId) return
  pointerId = null
  dragging.value = false
  if (!moved || cancelled) return
  const distance = event.clientY - startY
  if ((detent.value === 'half' && distance > 70) || distance > expandedHeight.value * 0.65) close()
  else if (distance > 65) detent.value = 'half'
  else if (distance < -45) detent.value = 'expanded'
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (detent.value === 'expanded') detent.value = 'half'
    else close()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    detent.value = 'expanded'
  }
}
watch(
  () => props.open,
  async (open) => {
    await nextTick()
    if (disposed) return
    if (!open) {
      close()
      return
    }
    if (dialog.value?.open) {
      if (closing.value) {
        clearTimeout(closeTimer)
        closing.value = false
      }
      return
    }
    closeNotified = false
    clearTimeout(closeTimer)
    resize()
    closing.value = false
    entering.value = true
    detent.value = 'expanded'
    dialog.value?.showModal()
    window.visualViewport?.addEventListener('resize', resize)
    window.addEventListener('resize', resize)
    await nextTick()
    // Short tools open halfway; longer forms retain a full, independently scrollable view.
    const headerHeight = dialog.value?.querySelector('header')?.offsetHeight ?? 116
    if (content.value && content.value.offsetHeight + headerHeight + 24 < halfHeight.value) {
      detent.value = 'half'
    }
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        entering.value = false
      }),
    )
  },
  { immediate: true },
)
watch(
  () => props.title,
  () => {
    if (dialog.value?.open) {
      detent.value = 'expanded'
      body.value?.scrollTo({ top: 0 })
    }
  },
)
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(closeTimer)
  window.visualViewport?.removeEventListener('resize', resize)
  window.removeEventListener('resize', resize)
  dialog.value?.close()
})
</script>

<template>
  <dialog
    ref="dialog"
    class="ae-drawer"
    :class="{ 'is-dragging': dragging, 'is-closing': closing, 'is-entering': entering }"
    :data-detent="detent"
    :style="{ height: `${height}px` }"
    :aria-labelledby="titleId"
    @cancel.prevent="close"
    @close="onClosed"
    @click="
      (event) => {
        if (event.target === dialog) close()
      }
    "
  >
    <div class="ae-drawer__surface">
      <header class="ae-drawer__header">
        <button
          type="button"
          class="ae-drawer__handle"
          aria-label="收起抽屉"
          @click="handleClick"
          @keydown="keydown"
          @pointerdown="start"
          @pointermove="move"
          @pointerup="end($event)"
          @pointercancel="end($event, true)"
        >
          <span aria-hidden="true"></span>
        </button>
        <div class="ae-drawer__heading">
          <p v-if="subtitle">{{ subtitle }}</p>
          <h2 :id="titleId">{{ title }}</h2>
        </div>
        <button type="button" class="ae-drawer__close" :aria-label="closeLabel" @click="close">
          <X :size="20" />
        </button>
      </header>
      <div ref="body" class="ae-drawer__body">
        <div ref="content"><slot /></div>
      </div>
    </div>
  </dialog>
</template>

<style>
.ae-drawer {
  position: fixed;
  inset: auto 0 0;
  margin: 0 auto;
  width: min(100%, 430px);
  max-width: 100%;
  max-height: calc(100dvh - env(safe-area-inset-top, 0px) - 12px);
  min-height: 100px;
  padding: 0;
  border: 1px solid #ffffffed;
  border-bottom: 0;
  border-radius: 30px 30px 0 0;
  color: #14213d;
  background: #f5faff;
  box-shadow:
    0 -10px 48px #14365c30,
    inset 0 1px #fff;
  overflow: hidden;
  transition:
    height 300ms cubic-bezier(0.22, 0.8, 0.25, 1),
    transform 240ms cubic-bezier(0.22, 0.8, 0.25, 1);
}
.ae-drawer::backdrop {
  background: #10284758;
  backdrop-filter: blur(3px);
}
.ae-drawer.is-dragging {
  transition: none;
  user-select: none;
}
.ae-drawer.is-closing,
.ae-drawer.is-entering {
  transform: translateY(100%);
}
.ae-drawer__surface {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.ae-drawer__header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 12px;
  min-height: 98px;
  padding: 44px 18px 12px;
  border-bottom: 1px solid #dce8f5;
  background: linear-gradient(125deg, #ffffffed, #eaf4ffdf);
  box-shadow: inset 0 1px #fff;
}
.ae-drawer__handle {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: grid;
  place-items: center;
  width: 88px;
  height: 44px;
  border: 0;
  border-radius: 20px;
  padding: 0;
  background: transparent;
  touch-action: none;
  cursor: grab;
}
.ae-drawer__handle span {
  width: 38px;
  height: 5px;
  border-radius: 5px;
  background: #8ea7bd;
}
.ae-drawer__handle:active {
  cursor: grabbing;
}
.ae-drawer__heading {
  min-width: 0;
}
.ae-drawer__heading p {
  color: #526581;
  font-size: 12px;
  margin-bottom: 4px;
}
.ae-drawer__heading h2 {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.ae-drawer__close {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border: 1px solid #ffffffef;
  border-radius: 50%;
  color: #526581;
  background: #e7f0f9;
  box-shadow: inset 0 1px #fff;
}
.ae-drawer__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  scroll-padding: 16px;
}
.ae-drawer button:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -3px;
}
.ae-drawer input:not([type='checkbox']),
.ae-drawer select,
.ae-drawer textarea {
  font-size: 16px;
}
html:has(.ae-drawer[open]) {
  overflow: hidden;
}
[data-transparency='reduced'] .ae-drawer::backdrop {
  backdrop-filter: none;
}
[data-transparency='reduced'] .ae-drawer__header {
  background: #edf5ff;
}
@media (prefers-reduced-motion: reduce) {
  .ae-drawer {
    transition: none;
  }
}
@media (prefers-reduced-transparency: reduce) {
  .ae-drawer::backdrop {
    backdrop-filter: none;
  }
}
</style>
