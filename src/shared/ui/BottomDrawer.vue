<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { X } from '@lucide/vue'

const props = withDefaults(defineProps<{ open: boolean; title: string; closeLabel?: string }>(), {
  closeLabel: '关闭面板',
})
const emit = defineEmits<{ close: [] }>()
const titleId = useId()
const dialog = ref<HTMLDialogElement>()
const body = ref<HTMLDivElement>()
const content = ref<HTMLDivElement>()
const closingHeight = ref(0)
const viewport = ref(844)
const neededHeight = ref(0)
const dragging = ref(false)
const closing = ref(false)
const entering = ref(false)
const dragHeight = ref(0)
const detent = ref<'fit' | 'half' | 'expanded'>('fit')
const safeTop = ref(0)
const floorHeight = computed(() => Math.round(viewport.value * 0.6))
const capHeight = computed(() =>
  Math.max(
    100,
    Math.min(Math.floor(viewport.value * 0.8), Math.round(viewport.value - safeTop.value - 12)),
  ),
)
const restingHeight = computed(() =>
  Math.min(capHeight.value, Math.max(floorHeight.value, neededHeight.value)),
)
const settledHeight = computed(() =>
  detent.value === 'expanded'
    ? capHeight.value
    : detent.value === 'half'
      ? floorHeight.value
      : restingHeight.value,
)
const height = computed(() =>
  closing.value ? closingHeight.value : dragging.value ? dragHeight.value : settledHeight.value,
)
let startY = 0
let startHeight = 0
let moved = false
let pointerId: number | null = null
let captureTarget: HTMLElement | null = null
let closeTimer: ReturnType<typeof setTimeout> | undefined
let disposed = false
let closeNotified = false
let samples: { y: number; t: number }[] = []
let observer: ResizeObserver | undefined

function resize() {
  viewport.value = window.visualViewport?.height ?? window.innerHeight
  safeTop.value = dialog.value
    ? parseFloat(getComputedStyle(dialog.value).getPropertyValue('--ae-safe-top')) || 0
    : 0
}
function measure() {
  const headerHeight = dialog.value?.querySelector('header')?.getBoundingClientRect().height ?? 0
  const contentHeight = content.value?.getBoundingClientRect().height ?? 0
  neededHeight.value = Math.ceil(headerHeight + contentHeight + 20)
}
function finishClose() {
  if (!dialog.value?.open) return
  dialog.value.close()
  onClosed()
}
function releasePointer() {
  if (pointerId !== null && captureTarget?.hasPointerCapture(pointerId)) {
    captureTarget.releasePointerCapture(pointerId)
  }
  captureTarget = null
  pointerId = null
  samples = []
  window.removeEventListener('pointerup', end)
  window.removeEventListener('pointercancel', cancelPointer)
}
function close() {
  if (closing.value || !dialog.value?.open) return
  closingHeight.value = dialog.value.getBoundingClientRect().height
  closing.value = true
  dragging.value = false
  releasePointer()
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
  observer?.disconnect()
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
function downwardVelocity(event: PointerEvent) {
  const recent = samples.filter((sample) => event.timeStamp - sample.t <= 120)
  const first = recent[0] ?? samples[0]
  if (!first) return 0
  const elapsed = Math.max(16, event.timeStamp - first.t)
  return (event.clientY - first.y) / elapsed
}
function start(event: PointerEvent) {
  if (event.button !== 0 || closing.value) return
  if ((event.target as Element | null)?.closest('.ae-drawer__close')) return
  releasePointer()
  pointerId = event.pointerId
  startY = event.clientY
  startHeight = dialog.value?.getBoundingClientRect().height ?? settledHeight.value
  moved = false
  samples = [{ y: event.clientY, t: event.timeStamp }]
  // Capture only after a real drag so a tap still clicks the handle button.
  captureTarget = event.currentTarget as HTMLElement
  window.addEventListener('pointerup', end)
  window.addEventListener('pointercancel', cancelPointer)
}
function cancelPointer(event: PointerEvent) {
  end(event, true)
}
function move(event: PointerEvent) {
  if (event.pointerId !== pointerId) return
  samples.push({ y: event.clientY, t: event.timeStamp })
  const cutoff = event.timeStamp - 120
  while (samples.length > 2 && samples[0]!.t < cutoff) samples.shift()
  const distance = event.clientY - startY
  if (Math.abs(distance) < 6 && !moved) return
  if (!moved && captureTarget) {
    try {
      captureTarget.setPointerCapture(event.pointerId)
    } catch {
      /* Pointer may already be released. */
    }
  }
  moved = true
  dragging.value = true
  dragHeight.value = Math.min(capHeight.value, Math.max(100, startHeight - distance))
}
function end(event: PointerEvent, cancelled = false) {
  if (event.pointerId !== pointerId) return
  const travel = event.clientY - startY
  const velocity = downwardVelocity(event)
  dragging.value = false
  releasePointer()
  if (!moved || cancelled) return
  const distanceLimit = Math.max(112, startHeight * 0.28)
  const flung = velocity >= 0.72 && travel >= 40
  if (flung || travel >= distanceLimit) close()
  else if (travel <= -32 || (velocity <= -0.5 && travel <= -12)) detent.value = 'expanded'
  else if (travel >= 40) detent.value = 'half'
}
function keydown(event: KeyboardEvent) {
  if (event.key === 'ArrowUp' || event.key === 'Home') {
    event.preventDefault()
    detent.value = 'expanded'
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    if (detent.value === 'expanded') detent.value = 'half'
    else close()
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
    detent.value = 'fit'
    entering.value = true
    dialog.value?.showModal()
    // The dialog is the initial focus target; keep the handle's blue ring for keyboard use only.
    dialog.value?.focus({ preventScroll: true })
    measure()
    observer?.disconnect()
    if (content.value && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measure())
      observer.observe(content.value)
    }
    window.visualViewport?.addEventListener('resize', resize)
    window.addEventListener('resize', resize)
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
      body.value?.scrollTo({ top: 0 })
      measure()
    }
  },
)
onBeforeUnmount(() => {
  disposed = true
  clearTimeout(closeTimer)
  releasePointer()
  observer?.disconnect()
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
    tabindex="-1"
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
      <header
        class="ae-drawer__header"
        @pointerdown="start"
        @pointermove="move"
        @pointerup="end($event)"
        @pointercancel="end($event, true)"
      >
        <button
          type="button"
          class="ae-drawer__handle"
          aria-label="收起抽屉"
          @click="handleClick"
          @keydown="keydown"
        >
          <span aria-hidden="true"></span>
        </button>
        <div class="ae-drawer__heading">
          <h2 :id="titleId">{{ title }}</h2>
        </div>
        <button
          type="button"
          class="ae-drawer__close"
          :aria-label="closeLabel"
          @pointerdown.stop
          @click="close"
        >
          <X :size="20" :stroke-width="2.25" aria-hidden="true" />
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
  top: auto;
  right: auto;
  bottom: 0;
  left: 50%;
  margin: 0;
  translate: -50% 0;
  width: min(100%, 430px);
  max-width: 100%;
  max-height: min(80dvh, calc(100dvh - env(safe-area-inset-top, 0px) - 12px));
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
.ae-drawer:focus {
  outline: none;
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
  min-height: 92px;
  padding: 44px 16px 14px;
  border-bottom: 1px solid #d7e6f8;
  background: linear-gradient(180deg, #ffffff, #eef5ff);
  box-shadow: inset 0 1px #fff;
  touch-action: none;
  user-select: none;
}
.ae-drawer__handle {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: auto;
  height: 44px;
  border: 0;
  border-radius: 0;
  padding: 0 0 8px;
  background: transparent;
  touch-action: none;
  cursor: grab;
  -webkit-appearance: none;
  appearance: none;
  -webkit-tap-highlight-color: transparent;
}
.ae-drawer__handle:focus:not(:focus-visible) {
  outline: none;
}
.ae-drawer__handle span {
  width: 48px;
  height: 5px;
  border-radius: 999px;
  background: linear-gradient(180deg, #f7fbff, #b7cce4);
  box-shadow:
    inset 0 1px #fff,
    0 1px 1px #7ea4cc40;
}
.ae-drawer__handle:active {
  cursor: grabbing;
}
.ae-drawer__handle:active span {
  background: #9eb8d4;
}
.ae-drawer__heading {
  min-width: 0;
}
.ae-drawer__heading h2 {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.ae-drawer button.ae-drawer__close {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  appearance: none;
  border: 1px solid #d7e6f8;
  border-radius: 50%;
  color: #0864ff;
  background: #fff;
  box-shadow:
    inset 0 1px #fff,
    0 2px 6px #4b93eb1a;
  cursor: pointer;
  touch-action: manipulation;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease;
}
.ae-drawer button.ae-drawer__close svg {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
@media (hover: hover) {
  .ae-drawer button.ae-drawer__close:hover {
    color: #0864ff;
    background: #f3f8ff;
    border-color: #b9d4f5;
  }
}
.ae-drawer button.ae-drawer__close:active {
  color: #0864ff;
  background: #e7f2ff;
  border-color: #b9d4f5;
}
.ae-drawer button.ae-drawer__close:focus:not(:focus-visible) {
  outline: none;
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
html:has(.ae-drawer[open]) .home-shell .main-content {
  overflow: hidden;
}
[data-transparency='reduced'] .ae-drawer::backdrop {
  backdrop-filter: none;
}
[data-transparency='reduced'] .ae-drawer__header {
  background: #edf5ff;
}
@media (prefers-reduced-motion: reduce) {
  .ae-drawer,
  .ae-drawer button.ae-drawer__close {
    transition: none;
  }
}
@media (prefers-reduced-transparency: reduce) {
  .ae-drawer::backdrop {
    backdrop-filter: none;
  }
}
</style>
