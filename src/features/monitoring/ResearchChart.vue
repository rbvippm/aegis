<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ResearchWindow } from './research'
import { researchSeries } from '@/mocks/monitoring-research'

const props = defineProps<{ window: ResearchWindow }>()
const relative = ref(false)
const point = ref(4)
const selected = ref(0)
const series = computed(() => researchSeries[props.window])
watch(
  () => props.window,
  () => {
    point.value = 4
  },
)
const colors = ['#0874ff', '#08b7aa']
const chartTop = computed(() => (props.window === '24h' ? 20 : 100))
const values = computed(() =>
  series.value.values.map((row) =>
    row.map((value) => (relative.value ? (value / row[0]! - 1) * 100 : value)),
  ),
)
const min = computed(() => (relative.value ? -50 : 0))
const max = computed(() => (relative.value ? 250 : chartTop.value))
const x = (index: number) => 8 + index * 47
const y = (value: number) => 110 - ((value - min.value) / (max.value - min.value)) * 102
const line = (row: number[]) => {
  let path = `M${x(0)},${y(row[0]!)}`
  for (let index = 1; index < row.length; index++) {
    const middle = (x(index - 1) + x(index)) / 2
    path += ` C${middle},${y(row[index - 1]!)} ${middle},${y(row[index]!)} ${x(index)},${y(row[index]!)}`
  }
  return path
}
const activeValue = computed(() => values.value[selected.value]?.[point.value] ?? 0)
const tooltip = computed(() =>
  relative.value ? `${activeValue.value.toFixed(1)}%` : `$${activeValue.value}M`,
)
function move(direction: number) {
  point.value = Math.min(6, Math.max(0, point.value + direction))
}
</script>

<template>
  <section class="research-chart" aria-label="真实链上存款趋势">
    <div class="research-chart__heading">
      <h2>真实链上存款</h2>
      <div class="research-toggle" aria-label="图表显示方式">
        <button :aria-pressed="!relative" :class="{ active: !relative }" @click="relative = false">
          金额
        </button>
        <button :aria-pressed="relative" :class="{ active: relative }" @click="relative = true">
          涨跌幅
        </button>
      </div>
    </div>
    <div class="research-legend">
      <button
        v-for="(color, index) in colors"
        :key="color"
        :aria-pressed="selected === index"
        @click="selected = index"
      >
        <i :style="{ background: color }"></i>平台 {{ index === 0 ? 'A' : 'B' }}
      </button>
      <span>全链汇总</span>
    </div>
    <svg
      viewBox="0 0 340 147"
      role="img"
      :aria-label="`${window} ${series.labels[point]} 平台${selected === 0 ? 'A' : 'B'} ${tooltip}；左右方向键查看时间点`"
      tabindex="0"
      @keydown.left.prevent="move(-1)"
      @keydown.right.prevent="move(1)"
    >
      <defs>
        <linearGradient id="research-blue-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#2890ff" stop-opacity=".22" />
          <stop offset="1" stop-color="#2890ff" stop-opacity=".02" />
        </linearGradient>
        <linearGradient id="research-teal-fill" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#04b6a6" stop-opacity=".16" />
          <stop offset="1" stop-color="#04b6a6" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-for="fraction in [0, 0.5, 1]" :key="fraction">
        <line
          x1="8"
          :y1="8 + fraction * 102"
          x2="290"
          :y2="8 + fraction * 102"
          stroke="#dce9f6"
          stroke-dasharray="3 3"
        />
        <text x="296" :y="12 + fraction * 102">
          {{
            relative
              ? `${max - fraction * (max - min)}%`
              : `$${max * (1 - fraction)}${fraction === 1 ? '' : 'M'}`
          }}
        </text>
      </g>
      <g v-for="(row, index) in values" :key="index">
        <path
          :d="`${line(row)} L290,110 L8,110 Z`"
          :fill="index === 0 ? 'url(#research-blue-fill)' : 'url(#research-teal-fill)'"
        />
        <path
          :d="line(row)"
          fill="none"
          :stroke="colors[index]"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </g>
      <line :x1="x(point)" :x2="x(point)" y1="8" y2="110" stroke="#8bc4ff" stroke-dasharray="3 3" />
      <circle
        :cx="x(point)"
        :cy="y(activeValue)"
        r="4"
        :fill="colors[selected]"
        stroke="white"
        stroke-width="2"
      />
      <g
        :transform="`translate(${Math.min(209, Math.max(8, x(point) - 48))},${Math.max(1, y(activeValue) - 29)})`"
      >
        <rect width="88" height="22" rx="7" fill="white" stroke="#e2effc" />
        <text x="44" y="15" text-anchor="middle" class="research-chart__tooltip">
          {{ selected === 0 ? 'A' : 'B' }} · {{ tooltip }}
        </text>
      </g>
      <text
        v-for="index in [0, 2, 4, 6]"
        :key="index"
        :x="index === 6 ? 290 : x(index)"
        y="137"
        :text-anchor="index === 0 ? 'start' : index === 6 ? 'end' : 'middle'"
      >
        {{ series.labels[index] }}
      </text>
      <rect
        v-for="index in 7"
        :key="`hit-${index}`"
        :x="Math.max(0, x(index - 1) - 22)"
        y="6"
        width="47"
        height="110"
        fill="transparent"
        @click="point = index - 1"
      />
    </svg>
    <p>{{ window === '24h' ? '分时入金' : '每日入金' }} · 剔除内部转账</p>
  </section>
</template>

<style scoped>
.research-chart {
  padding: 10px 12px 8px;
  border: 1px solid white;
  border-radius: 18px;
  background: #ffffffdf;
  box-shadow: 0 4px 14px #729ed810;
}
.research-chart__heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
h2 {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.4px;
}
.research-toggle {
  display: flex;
  padding: 2px;
  border: 1px solid #d9e9ff;
  background: #eef6ff;
  border-radius: 18px;
}
button {
  border: 0;
  background: none;
}
.research-toggle button {
  min-height: 44px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: 16px;
}
.research-toggle .active {
  color: white;
  background: linear-gradient(#60b0ff, #0872ff 65%, #54a8ff);
  box-shadow:
    inset 0 1px 2px #fff,
    0 2px 5px #88b8ff80;
}
.research-legend {
  display: flex;
  align-items: center;
  gap: 14px;
}
.research-legend button {
  display: flex;
  gap: 6px;
  align-items: center;
  min-height: 44px;
  padding: 0;
  font-size: 12px;
}
.research-legend i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.research-legend span {
  margin-left: auto;
  font-size: 11px;
  color: #617b9f;
}
svg {
  height: 130px;
  display: block;
  width: 100%;
  overflow: visible;
}
svg text {
  font:
    11px -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  fill: #60799c;
}
svg .research-chart__tooltip {
  font-size: 11px;
  font-weight: 600;
  fill: #14213d;
}
p {
  text-align: center;
  color: #647fa4;
  font-size: 11px;
  line-height: 1.5;
}
</style>
