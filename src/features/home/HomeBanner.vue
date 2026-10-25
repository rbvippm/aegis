<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const slides = [
  {
    title: '看清平台，再做选择',
    description: '链上数据 · 出金监测 · 透明对比',
    theme: 'glacier',
    label: '平台概览',
  },
  {
    title: '赛事分析，有据可循',
    description: '多维分析 · 盘口解读 · 依据可查',
    theme: 'ai',
    label: 'AI 分析',
  },
  {
    title: '同场同盘，清晰对比',
    description: '多平台赔率 · 同盘口比较',
    theme: 'sports',
    label: '赔率对比',
  },
  {
    title: '关注出金，读懂变化',
    description: '到账耗时 · 样本观察 · 来源可追溯',
    theme: 'funding',
    label: '出金观察',
  },
]
const renderedSlides = [slides[slides.length - 1]!, ...slides, slides[0]!]
const active = ref(0)
const track = ref<HTMLDivElement>()
const dragging = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
let settleTimer: ReturnType<typeof setTimeout> | undefined
let interacting = false
let mouseStart: { x: number; left: number; pointer: number } | undefined
let observer: ResizeObserver | undefined
function stopRotation() {
  clearTimeout(timer)
}
function scheduleRotation() {
  stopRotation()
  if (document.hidden || interacting || dragging.value) return
  timer = setTimeout(() => moveTo(active.value + 2), 5000)
}
function beginInteraction() {
  interacting = true
  stopRotation()
}
function endInteraction() {
  if (mouseStart) {
    const start = mouseStart
    mouseStart = undefined
    dragging.value = false
    if (track.value?.hasPointerCapture(start.pointer))
      track.value.releasePointerCapture(start.pointer)
    if (track.value?.clientWidth) {
      const distance = track.value.scrollLeft - start.left
      const step =
        Math.abs(distance) > Math.min(48, track.value.clientWidth * 0.18) ? Math.sign(distance) : 0
      moveTo(Math.round(start.left / track.value.clientWidth) + step)
    }
  }
  if (!interacting) return
  interacting = false
  scheduleRotation()
}
function settle() {
  if (!track.value?.clientWidth || dragging.value) return
  const position = Math.round(track.value.scrollLeft / track.value.clientWidth)
  active.value = (position - 1 + slides.length) % slides.length
  // Identical end slides allow one continuous step, then reset offscreen without animation.
  if (position === 0 || position === slides.length + 1) {
    track.value.scrollTo({
      left: (active.value + 1) * track.value.clientWidth,
      behavior: 'instant',
    })
  }
  scheduleRotation()
}
function syncSlide() {
  if (!track.value?.clientWidth) return
  stopRotation()
  const position = Math.round(track.value.scrollLeft / track.value.clientWidth)
  active.value = (position - 1 + slides.length) % slides.length
  clearTimeout(settleTimer)
  settleTimer = setTimeout(settle, 140)
}
function moveTo(position: number) {
  if (!track.value?.clientWidth) return
  clearTimeout(settleTimer)
  stopRotation()
  const instant = matchMedia('(prefers-reduced-motion: reduce)').matches
  track.value.scrollTo({
    left: Math.max(0, Math.min(slides.length + 1, position)) * track.value.clientWidth,
    behavior: instant ? 'instant' : 'smooth',
  })
  if (instant) settle()
}
function selectSlide(index: number) {
  moveTo(index < 0 ? 0 : index >= slides.length ? slides.length + 1 : index + 1)
}
function startDrag(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || event.button !== 0 || !track.value) return
  track.value.scrollTo({ left: track.value.scrollLeft, behavior: 'instant' })
  mouseStart = { x: event.clientX, left: track.value.scrollLeft, pointer: event.pointerId }
}
function drag(event: PointerEvent) {
  if (!mouseStart || !track.value) return
  const distance = event.clientX - mouseStart.x
  if (Math.abs(distance) < 5 && !dragging.value) return
  dragging.value = true
  if (!track.value.hasPointerCapture(event.pointerId))
    track.value.setPointerCapture(event.pointerId)
  track.value.scrollLeft = mouseStart.left - distance
}
onMounted(() => {
  if (track.value) {
    track.value.scrollTo({ left: track.value.clientWidth, behavior: 'instant' })
    observer = new ResizeObserver(() => {
      if (!track.value || dragging.value) return
      track.value.scrollTo({
        left: (active.value + 1) * track.value.clientWidth,
        behavior: 'instant',
      })
    })
    observer.observe(track.value)
  }
  scheduleRotation()
  document.addEventListener('visibilitychange', scheduleRotation)
  window.addEventListener('pointerup', endInteraction)
  window.addEventListener('pointercancel', endInteraction)
})
onBeforeUnmount(() => {
  stopRotation()
  clearTimeout(settleTimer)
  observer?.disconnect()
  document.removeEventListener('visibilitychange', scheduleRotation)
  window.removeEventListener('pointerup', endInteraction)
  window.removeEventListener('pointercancel', endInteraction)
})
</script>

<template>
  <section
    class="home-banner"
    aria-label="平台能力介绍"
    aria-roledescription="轮播图"
    @pointerdown="beginInteraction"
    @focusin="
      (event) => {
        if ((event.target as HTMLElement).matches(':focus-visible')) beginInteraction()
      }
    "
    @focusout="endInteraction"
  >
    <div
      ref="track"
      class="home-banner__track"
      :class="{ 'is-dragging': dragging }"
      @scroll.passive="syncSlide"
      @pointerdown="startDrag"
      @pointermove="drag"
      @dragstart.prevent
    >
      <article
        v-for="(slide, index) in renderedSlides"
        :key="`${slide.theme}-${index}`"
        class="home-banner__slide"
        :class="`home-banner__slide--${slide.theme}`"
        :aria-hidden="index === 0 || index === slides.length + 1 || index - 1 !== active"
        :aria-label="`${((index - 1 + slides.length) % slides.length) + 1} / ${slides.length}：${slide.label}`"
        aria-roledescription="幻灯片"
      >
        <div class="home-banner__copy">
          <component :is="index === 1 ? 'h1' : 'h2'">{{ slide.title }}</component>
          <p>{{ slide.description }}</p>
        </div>
      </article>
    </div>
    <div
      class="home-banner__indicators"
      aria-label="切换平台能力介绍"
      @keydown.right.prevent="selectSlide(active + 1)"
      @keydown.left.prevent="selectSlide(active - 1)"
    >
      <button
        v-for="(slide, index) in slides"
        :key="slide.theme"
        type="button"
        :aria-label="`查看${slide.label}`"
        :aria-current="active === index ? 'true' : undefined"
        @click="selectSlide(index)"
      >
        <span></span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.home-banner {
  position: relative;
  margin: 0 -12px -5px;
  isolation: isolate;
}
.home-banner__track {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  touch-action: pan-x pan-y pinch-zoom;
  user-select: none;
  cursor: grab;
}
.home-banner__track.is-dragging {
  scroll-snap-type: none;
  cursor: grabbing;
}
.home-banner__track::-webkit-scrollbar {
  display: none;
}
.home-banner__slide {
  position: relative;
  isolation: isolate;
  flex: 0 0 100%;
  min-width: 0;
  height: 142px;
  padding: 23px 20px 28px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
  background: url('../../shared/assets/glacier-hero.jpg') center/100% 100% no-repeat;
}
.home-banner__slide::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(#f4faff55, transparent 30%, transparent 70%, #e8f4ff);
  pointer-events: none;
}
.home-banner__copy {
  position: relative;
  z-index: 1;
}
.home-banner h1,
.home-banner h2 {
  font-size: 25px;
  line-height: 1.4;
  letter-spacing: -0.6px;
  font-weight: 700;
  color: #081b4d;
  white-space: nowrap;
}
.home-banner p {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 600;
  color: #0759e6;
}
.home-banner__indicators {
  position: absolute;
  z-index: 2;
  bottom: 2px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 0;
  height: 44px;
}
.home-banner__indicators button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 44px;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}
.home-banner__indicators button span {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: 99px;
  background: #6f8ba8;
  transition:
    width 180ms ease,
    background-color 180ms ease;
}
.home-banner__indicators button[aria-current='true'] span {
  width: 12px;
  background: #3988e6;
}
.home-banner__indicators button:focus-visible {
  outline: 2px solid #1477ff;
  outline-offset: -2px;
  border-radius: 12px;
}
@media (max-width: 374px) {
  .home-banner h1,
  .home-banner h2 {
    font-size: 23px;
  }
  .home-banner p {
    font-size: 12px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .home-banner__indicators button span {
    transition: none;
  }
}
</style>
