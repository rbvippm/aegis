<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import type { Series } from './analytics-model'
import { count, dateLabel, money } from './analytics-model'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
const props = withDefaults(
  defineProps<{
    series: Series[]
    times: number[]
    title?: string
    label?: (key: string) => string
    percent?: boolean
    balance?: boolean
    unit?: 'money' | 'count' | 'percent'
  }>(),
  {
    title: '链上存款',
    label: (key: string) => key,
    percent: false,
    balance: false,
    unit: 'money',
  },
)
const kind = ref('line')
const selected = ref(0),
  point = ref(0)
watch(
  () => [props.series, props.times],
  () => {
    selected.value = 0
    point.value = Math.max(0, props.times.length - 1)
  },
  { immediate: true },
)
const colors = [
  '#0864ff',
  '#087f6b',
  '#7955bd',
  '#a66615',
  '#bd526d',
  '#3d5d86',
  '#357b8e',
  '#925e7a',
  '#687c3c',
]
const values = computed(() =>
  props.series.map((row) => ({
    ...row,
    values: row.values.map((value) =>
      props.percent
        ? row.values[0] === 0
          ? null
          : ((value - row.values[0]!) / Math.abs(row.values[0]!)) * 100
        : value,
    ),
  })),
)
const hasComparable = computed(
  () => !props.percent || values.value.some((row) => row.values.some((v) => v !== null)),
)
const range = computed(() => {
  const all = values.value.flatMap((row) => row.values).filter((v): v is number => v !== null)
  const min = Math.min(0, ...all),
    max = Math.max(0, ...all)
  return { min, max: max === min ? max + 1 : max }
})
const x = (i: number) => 12 + (i / Math.max(1, props.times.length - 1)) * 266
const y = (v: number) => 120 - ((v - range.value.min) / (range.value.max - range.value.min)) * 108
const path = (row: (number | null)[]) =>
  row
    .map((v, i) =>
      v === null ? '' : `${i === 0 || row[i - 1] === null ? 'M' : 'L'}${x(i)},${y(v)}`,
    )
    .join(' ')
const display = (value: number | null) =>
  value === null
    ? '无可比基期'
    : props.percent || props.unit === 'percent'
      ? `${value.toFixed(1)}%`
      : props.unit === 'count'
        ? count(value)
        : money(value)
const total = (values: (number | null)[]) =>
  values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
const active = computed(() => values.value[selected.value])
const painted = computed(() =>
  values.value
    .map((row, index) => ({ row, index }))
    .sort((a, b) => Number(a.index === selected.value) - Number(b.index === selected.value)),
)
function tone(value: number | null) {
  if (!props.percent || value === null || value === 0) return ''
  return value > 0 ? 'ma-up' : 'ma-down'
}
const ticks = computed(() =>
  [...new Set([0, Math.floor(props.times.length / 2), props.times.length - 1])].filter(
    (i) => i >= 0,
  ),
)
function move(direction: number) {
  point.value = Math.min(props.times.length - 1, Math.max(0, point.value + direction))
}
function selectPoint(event: PointerEvent) {
  const box = (event.currentTarget as SVGElement).getBoundingClientRect()
  point.value = Math.max(
    0,
    Math.min(
      props.times.length - 1,
      Math.round(
        ((((event.clientX - box.left) / box.width) * 340 - 12) / 266) * (props.times.length - 1),
      ),
    ),
  )
}
</script>
<template>
  <section class="ma-card ma-chart" :aria-label="`${title}趋势`">
    <header class="ma-heading">
      <h2>{{ title }}</h2>
      <GlassSelect v-model="kind" label="图形"
        ><option value="line">折线</option>
        <option value="bar">柱状</option>
        <option value="bubble">气泡</option>
        <option value="boxes">分块</option></GlassSelect
      >
    </header>
    <slot name="controls" />
    <div class="ma-legend" role="group" aria-label="曲线图例">
      <button
        v-for="(row, i) in values"
        :key="row.key"
        :aria-pressed="selected === i"
        :style="selected === i ? { borderColor: colors[i % colors.length] } : undefined"
        @click="selected = i"
      >
        <i :style="{ background: colors[i % colors.length] }" />{{ label(row.key) }}
      </button>
    </div>
    <p v-if="!series.length || !hasComparable" class="ma-empty" role="status">
      {{ !series.length ? '当前筛选范围暂无数据。' : '当前范围没有可比基期，请切回金额查看。' }}
    </p>
    <div v-else-if="kind === 'boxes'" class="ma-boxes">
      <div
        v-for="(row, i) in values"
        :key="row.key"
        :style="{ borderColor: colors[i % colors.length] }"
      >
        <span>{{ label(row.key) }}</span
        ><strong>{{
          display(
            percent
              ? (row.values.at(-1) ?? null)
              : balance
                ? (row.values.at(-1) ?? null)
                : total(row.values),
          )
        }}</strong>
      </div>
    </div>
    <template v-else>
      <div v-if="active" class="ma-chart-readout" aria-live="polite">
        <button
          type="button"
          class="ma-chart-step"
          aria-label="上一时间点"
          :disabled="point === 0"
          @click="move(-1)"
        >
          <ChevronLeft :size="16" />
        </button>
        <span class="ma-chart-readout__meta">
          <i :style="{ background: colors[selected % colors.length] }" />
          <b>{{ label(active.key) }}</b>
          <small>{{ dateLabel(times[point] ?? 0, times.length === 24) }}</small>
        </span>
        <strong :class="tone(active.values[point] ?? null)">{{
          display(active.values[point] ?? null)
        }}</strong>
        <button
          type="button"
          class="ma-chart-step"
          aria-label="下一时间点"
          :disabled="point >= times.length - 1"
          @click="move(1)"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
      <svg
        v-if="series.length"
        viewBox="0 0 340 154"
        role="img"
        :aria-label="`${title}；${active ? label(active.key) : ''} ${display(active?.values[point] ?? null)}；左右方向键查看时间点`"
        tabindex="0"
        @keydown.left.prevent="move(-1)"
        @keydown.right.prevent="move(1)"
        @pointerdown="selectPoint"
        @pointermove="
          (event) => {
            if (event.buttons || event.pointerType === 'mouse') selectPoint(event)
          }
        "
      >
        <g v-for="f in [0, 0.5, 1]" :key="f">
          <line
            x1="12"
            x2="278"
            :y1="12 + f * 108"
            :y2="12 + f * 108"
            stroke="#d7e6f8"
            stroke-dasharray="3 3"
          />
          <text x="284" :y="16 + f * 108">
            {{ display(range.max - f * (range.max - range.min)) }}
          </text>
        </g>
        <line x1="12" x2="278" :y1="y(0)" :y2="y(0)" stroke="#9eb6cf" />
        <g v-for="{ row, index: r } in painted" :key="row.key" :opacity="selected === r ? 1 : 0.2">
          <path
            v-if="kind === 'line'"
            :d="path(row.values)"
            fill="none"
            :stroke="colors[r % colors.length]"
            :stroke-width="selected === r ? 3 : 1.5"
            stroke-linejoin="round"
            :stroke-linecap="selected === r ? 'round' : undefined"
          />
          <template v-for="(v, i) in row.values" :key="i">
            <rect
              v-if="kind === 'bar' && v !== null"
              :x="
                x(i) - 2 + (r - values.length / 2) * Math.max(1, 220 / times.length / values.length)
              "
              :y="Math.min(y(v), y(0))"
              :width="Math.max(1, 220 / times.length / values.length)"
              :height="Math.max(1, Math.abs(y(v) - y(0)))"
              :fill="colors[r % colors.length]"
              rx="1"
            />
            <circle
              v-if="kind === 'bubble' && v !== null"
              :cx="x(i)"
              :cy="y(v)"
              :r="
                2 +
                Math.sqrt(Math.abs(v) / Math.max(1, Math.abs(range.max), Math.abs(range.min))) * 6
              "
              :fill="colors[r % colors.length]"
              fill-opacity=".7"
            />
          </template>
        </g>
        <line
          :x1="x(point)"
          :x2="x(point)"
          y1="12"
          y2="120"
          stroke="#8bb9ef"
          stroke-dasharray="3 3"
        />
        <circle
          v-if="active && active.values[point] !== null && active.values[point] !== undefined"
          :cx="x(point)"
          :cy="y(active.values[point]!)"
          r="4"
          :fill="colors[selected % colors.length]"
          stroke="white"
          stroke-width="2"
        />
        <text
          v-for="i in ticks"
          :key="i"
          :x="x(i)"
          y="145"
          :text-anchor="i === 0 ? 'start' : i === times.length - 1 ? 'end' : 'middle'"
        >
          {{ dateLabel(times[i]!, times.length === 24) }}
        </text>
      </svg>
    </template>
    <p class="ma-note">
      {{
        percent
          ? '相对首个时间桶；基期为零时不计算涨跌幅。'
          : balance
            ? '按所选链和币种汇总的期末余额。'
            : '按时间桶汇总 · 已剔除内部转账。'
      }}
    </p>
  </section>
</template>
