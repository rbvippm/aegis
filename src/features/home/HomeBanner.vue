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
const active = ref(0)
const track = ref<HTMLDivElement>()
let timer: ReturnType<typeof setTimeout> | undefined
let interacting = false
function stopRotation() {
  clearTimeout(timer)
}
function scheduleRotation() {
  stopRotation()
  if (document.hidden || interacting) return
  timer = setTimeout(() => selectSlide((active.value + 1) % slides.length, true), 5000)
}
function beginInteraction() {
  interacting = true
  stopRotation()
}
function endInteraction() {
  if (!interacting) return
  interacting = false
  scheduleRotation()
}
onMounted(() => {
  scheduleRotation()
  document.addEventListener('visibilitychange', scheduleRotation)
  window.addEventListener('pointerup', endInteraction)
  window.addEventListener('pointercancel', endInteraction)
})
onBeforeUnmount(() => {
  stopRotation()
  document.removeEventListener('visibilitychange', scheduleRotation)
  window.removeEventListener('pointerup', endInteraction)
  window.removeEventListener('pointercancel', endInteraction)
})
function syncSlide() {
  if (!track.value?.clientWidth) return
  active.value = Math.round(track.value.scrollLeft / track.value.clientWidth)
}
function selectSlide(index: number, automatic = false) {
  if (!track.value) return
  const target = (index + slides.length) % slides.length
  // Automatic rotation switches whole slides, so unattended animation never cuts a heading in half.
  const instant = automatic || matchMedia('(prefers-reduced-motion: reduce)').matches
  track.value.scrollTo({
    left: target * track.value.clientWidth,
    behavior: instant ? 'instant' : 'smooth',
  })
  if (instant) syncSlide()
  scheduleRotation()
}
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
    <div ref="track" class="home-banner__track" @scroll.passive="syncSlide">
      <article
        v-for="(slide, index) in slides"
        :key="slide.theme"
        class="home-banner__slide"
        :class="`home-banner__slide--${slide.theme}`"
        :aria-hidden="index !== active"
        :aria-label="`${index + 1} / ${slides.length}：${slide.label}`"
        aria-roledescription="幻灯片"
      >
        <div class="home-banner__copy">
          <component :is="index === 0 ? 'h1' : 'h2'">{{ slide.title }}</component>
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
