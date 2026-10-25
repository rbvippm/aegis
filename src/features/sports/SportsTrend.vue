<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import PlatformBadge from '@/shared/ui/PlatformBadge.vue'
import { quoteHistory } from '@/mocks/compare'
import { platformName } from './platforms'
import { formatOdds } from './logic'
import type { OddsFormat, SportsMarket, SportsMatch } from './types'
const props = defineProps<{ match: SportsMatch; market: SportsMarket; format: OddsFormat }>()
const platform = ref(props.market.quotes.find((q) => q.status === 'active')?.platform ?? 'A')
const side = ref<'home' | 'away'>('home')
const quote = computed(() => props.market.quotes.find((q) => q.platform === platform.value))
const history = computed(() => {
  if (!quote.value || quote.value[side.value] === null || quote.value.status !== 'active') return []
  const base = quote.value[side.value]!
  return quoteHistory.map((row, i) => ({
    ...row,
    value:
      i === 0 ? base : Number((base + (row[side.value] - quoteHistory[0]![side.value])).toFixed(2)),
  }))
})
const points = computed(() =>
  history.value
    .slice()
    .reverse()
    .map((row, i) => `${20 + i * 40},${115 - (row.value - (quote.value?.[side.value] ?? 2)) * 650}`)
    .join(' '),
)
</script>
<template>
  <div class="sp-trend">
    <p class="sp-small-note">{{ match.league }} · {{ market.label }} · {{ market.scope }}</p>
    <h3>{{ match.home }} vs {{ match.away }}</h3>
    <div class="sp-trend-controls">
      <GlassSelect v-model="platform" label="走势平台"
        ><option v-for="q in market.quotes" :key="q.platform" :value="q.platform">
          {{ platformName(q.platform) }}
        </option></GlassSelect
      ><GlassSelect v-model="side" label="走势选项"
        ><option value="home">{{ market.selections[0] }}</option>
        <option value="away">{{ market.selections[1] }}</option></GlassSelect
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
          <small>变化</small
          ><b
            :class="history[0]!.value >= history.at(-1)!.value ? 'sp-change-up' : 'sp-change-down'"
            >{{ (history[0]!.value - history.at(-1)!.value).toFixed(2) }}</b
          >
        </div>
      </div>
      <svg viewBox="0 0 320 170" role="img" aria-label="赔率时间走势">
        <path d="M20 35H300M20 80H300M20 125H300" stroke="#d8e7f8" stroke-dasharray="3 4" />
        <polyline
          :points="points"
          fill="none"
          stroke="#1677ff"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
        <text x="20" y="160">19:02</text>
        <text x="140" y="160">时间 · UTC+8</text>
        <text x="264" y="160">19:32</text>
      </svg>
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
      <PlatformBadge :platform="platform" /><span>{{ format }} · 时间倒序</span>
    </div>
    <table v-if="history.length" class="sp-full-quotes sp-trend-table">
      <thead>
        <tr>
          <th>时间</th>
          <th>盘口</th>
          <th>{{ market.selections[side === 'home' ? 0 : 1] }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in history" :key="row.time">
          <td>{{ row.time }}</td>
          <td>{{ market.line }}</td>
          <td
            :class="
              row.value >= (history[i + 1]?.value ?? row.value) ? 'sp-change-up' : 'sp-change-down'
            "
          >
            {{ formatOdds(row.value, format)
            }}<component
              :is="row.value >= (history[i + 1]?.value ?? row.value) ? ArrowUp : ArrowDown"
              :size="12"
              v-if="i < history.length - 1"
            />
          </td>
        </tr>
      </tbody>
    </table>
    <p class="sp-small-note">固定报价记录 · 对比页本地数据，非平台实时行情。</p>
  </div>
</template>
