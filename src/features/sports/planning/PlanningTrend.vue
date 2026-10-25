<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { ArrowDown, ArrowUp } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { quoteHistory } from '@/mocks/compare'
import { planningOperators } from '@/mocks/sports-planning'
import { formatOdds } from '../logic'
import type { OddsFormat } from '../types'
import type { Fixture, Market } from './model'
const props = defineProps<{ match: Fixture; market: Market; format: OddsFormat }>()
const platform = ref(props.market.quotes.find((q) => q.status === 'active')?.operator ?? 'A')
const side = ref(0)
const quote = computed(() => props.market.quotes.find((q) => q.operator === platform.value))
const history = computed(() => {
  const base = quote.value?.prices[side.value]
  if (base == null || quote.value?.status !== 'active') return []
  return quoteHistory.map((row, i) => ({
    ...row,
    value: i === 0 ? base : Number((base + (row.home - quoteHistory[0]!.home)).toFixed(2)),
  }))
})
const fillId = useId()
const chronological = computed(() => history.value.slice().reverse())
const extent = computed(() => {
  const values = history.value.map((row) => row.value)
  const low = Math.min(...values),
    high = Math.max(...values)
  const padding = Math.max((high - low) * 0.2, 0.01)
  return { low: Math.max(1.001, low - padding), high: high + padding }
})
const chartPoints = computed(() =>
  chronological.value.map((row, i, all) => ({
    x: 48 + (i * 256) / Math.max(1, all.length - 1),
    y: 114 - ((row.value - extent.value.low) / (extent.value.high - extent.value.low)) * 100,
  })),
)
const points = computed(() => chartPoints.value.map((p) => `${p.x},${p.y}`).join(' '))
const area = computed(
  () => `M48,114 L${chartPoints.value.map((p) => `${p.x},${p.y}`).join(' L')} L304,114 Z`,
)
const change = computed(() =>
  history.value.length ? history.value[0]!.value - history.value.at(-1)!.value : 0,
)
const selectedOperator = computed(() => planningOperators.find((p) => p.id === platform.value))
</script>
<template>
  <div class="sp-trend pw-trend">
    <div class="pw-trend-context">
      <p>{{ match.league }}</p>
      <h3>{{ match.home }} <span>vs</span> {{ match.away }}</h3>
      <div class="pw-trend-tags">
        <span>{{ market.label }}</span
        ><span>{{ market.scope }}</span>
      </div>
    </div>
    <div class="sp-trend-controls">
      <label
        ><span>对比平台</span
        ><GlassSelect v-model="platform" label="走势平台">
          <option v-for="q in market.quotes" :key="q.operator" :value="q.operator">
            {{ planningOperators.find((p) => p.id === q.operator)?.name }}
          </option>
        </GlassSelect></label
      >
      <label
        ><span>赛果选项</span
        ><GlassSelect v-model="side" label="走势选项">
          <option v-for="(name, i) in market.selections" :key="i" :value="i">{{ name }}</option>
        </GlassSelect></label
      >
    </div>
    <div v-if="history.length" class="sp-card sp-trend-chart">
      <div class="sp-trend-summary">
        <div>
          <small>初盘</small><strong>{{ formatOdds(history.at(-1)!.value, format) }}</strong>
        </div>
        <div>
          <small>即时</small><strong>{{ formatOdds(history[0]!.value, format) }}</strong>
        </div>
        <div>
          <small>较初盘</small
          ><b :class="change > 0 ? 'sp-change-up' : change < 0 ? 'sp-change-down' : ''"
            ><component v-if="change" :is="change > 0 ? ArrowUp : ArrowDown" :size="14" />{{
              change > 0 ? '+' : ''
            }}{{ change.toFixed(2) }}</b
          >
        </div>
      </div>
      <svg
        viewBox="0 0 320 140"
        role="img"
        :aria-label="`${market.selections[side]}赔率时间走势 · ${format}`"
      >
        <defs>
          <linearGradient :id="fillId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#1686ff" stop-opacity="0.16" />
            <stop offset="100%" stop-color="#1686ff" stop-opacity="0.01" />
          </linearGradient>
        </defs>
        <g v-for="(ratio, i) in [1, 0.5, 0]" :key="i">
          <path :d="`M48 ${14 + i * 50}H304`" stroke="#d8e7f8" stroke-dasharray="3 4" />
          <text x="40" :y="18 + i * 50" text-anchor="end">
            {{ formatOdds(extent.low + (extent.high - extent.low) * ratio, format) }}
          </text>
        </g>
        <path :d="area" :fill="`url(#${fillId})`" />
        <polyline
          :points="points"
          fill="none"
          stroke="#1686ff"
          stroke-width="2.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle
          v-if="chartPoints.length"
          :cx="chartPoints.at(-1)!.x"
          :cy="chartPoints.at(-1)!.y"
          r="4"
          fill="#1686ff"
          stroke="#fff"
          stroke-width="2"
        />
        <text x="48" y="135">{{ chronological[0]?.time.slice(0, 5) }}</text>
        <text x="304" y="135" text-anchor="end">{{ history[0]?.time.slice(0, 5) }}</text>
      </svg>
      <div class="pw-trend-caption">
        <span>{{ format }} 赔率</span><span>时间 · UTC+8</span>
      </div>
    </div>
    <p v-else class="sp-notice">
      {{
        quote?.status === 'stale'
          ? '封盘'
          : quote?.status === 'suspended'
            ? '锁盘'
            : '暂无有效记录'
      }}，不绘制有效价格走势。
    </p>
    <div class="sp-trend-heading">
      <div>
        <h4>变动记录</h4>
        <span class="pw-brand"
          ><i>{{ selectedOperator?.mark }}</i
          >{{ selectedOperator?.name }}</span
        >
      </div>
      <span>{{ format }} · 时间倒序</span>
    </div>
    <div v-if="history.length" class="pw-trend-records">
      <table v-if="history.length" class="sp-full-quotes sp-trend-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>盘口</th>
            <th>{{ market.selections[side] }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in history" :key="row.time">
            <td>{{ row.time }}</td>
            <td>{{ market.line }}</td>
            <td
              :class="
                row.value > (history[i + 1]?.value ?? row.value)
                  ? 'sp-change-up'
                  : row.value < (history[i + 1]?.value ?? row.value)
                    ? 'sp-change-down'
                    : ''
              "
            >
              {{ formatOdds(row.value, format)
              }}<component
                :is="row.value >= (history[i + 1]?.value ?? row.value) ? ArrowUp : ArrowDown"
                :size="12"
                v-if="i < history.length - 1 && row.value !== history[i + 1]?.value"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="sp-small-note pw-trend-note">固定报价记录 · 对比页本地数据，非平台实时行情。</p>
  </div>
</template>
