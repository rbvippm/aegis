<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Star, ChevronRight, Activity, Bell, ChartNoAxesColumn } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { dataMode } from '@/shared/api/config'
import SportIcon from '../SportIcon.vue'
import type { OddsFormat } from '../types'
import type { Fixture, Family, Market, Quote } from './model'
import { analysis, number } from './model'
import QuoteMatrix from './QuoteMatrix.vue'
const props = defineProps<{
  fixture: Fixture
  format: OddsFormat
  followed: boolean
  enabled: Family[]
}>()
const emit = defineEmits<{
  follow: [id: string]
  tool: [kind: string, fixture: Fixture, market: Market]
  quote: [fixture: Fixture, market: Market, quote: Quote, index: number]
}>()
const family = ref(props.fixture.sport === 'football' ? 'winner' : props.fixture.markets[0]!.family)
const selected = ref('')
const groups = computed(() =>
  props.fixture.markets.filter(
    (m, i, all) =>
      props.enabled.includes(m.family) && all.findIndex((x) => x.family === m.family) === i,
  ),
)
const actualFamily = computed(() =>
  groups.value.some((m) => m.family === family.value) ? family.value : groups.value[0]?.family,
)
const children = computed(() =>
  props.fixture.markets.filter((m) => m.family === actualFamily.value),
)
const baseMarket = computed(
  () => children.value.find((m) => m.id === selected.value) ?? children.value[0]!,
)
const demoOffsets = ref<Record<string, number>>({})
const card = ref<HTMLElement>()
let demoTimer: ReturnType<typeof setInterval> | undefined
const market = computed(() => {
  const base = baseMarket.value
  if (!base || dataMode !== 'demo') return base
  return {
    ...base,
    quotes: base.quotes.map((q) => ({
      ...q,
      prices: q.prices.map((price, i) =>
        price == null
          ? null
          : Number((price + (demoOffsets.value[`${q.operator}:${i}`] ?? 0)).toFixed(2)),
      ),
    })),
  }
})
function demoTick() {
  if (document.visibilityState !== 'visible' || !market.value) return
  const cells = [
    ...(card.value?.querySelectorAll<HTMLButtonElement>('.pw-matrix .sp-price') ?? []),
  ].filter((cell) => {
    const rect = cell.getBoundingClientRect()
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.left >= 0 &&
      rect.right <= window.innerWidth
    )
  })
  const startUp = Math.random() > 0.5
  for (let n = 0; n < 2 && cells.length; n++) {
    const cell = cells.splice(Math.floor(Math.random() * cells.length), 1)[0]!
    const operator = cell.dataset.operator!
    const index = Number(cell.dataset.selectionIndex)
    const quote = market.value.quotes.find((q) => q.operator === operator)
    const base = baseMarket.value.quotes.find((q) => q.operator === operator)?.prices[index]
    if (quote?.status !== 'active' || base == null || quote.prices[index] == null) continue
    const key = `${operator}:${index}`
    const previous = demoOffsets.value[key] ?? 0
    const step = (n === 0 ? startUp : !startUp) ? 0.02 : -0.02
    const next = Number((previous + step).toFixed(2))
    // Keep the demonstration near its starting quote and decimal odds above 1.
    demoOffsets.value[key] =
      Math.abs(next) > 0.06 || base + next <= 1 ? Number((previous - step).toFixed(2)) : next
  }
}
watch(
  () => baseMarket.value?.id,
  () => {
    demoOffsets.value = {}
  },
)
const value = computed(() => (market.value ? analysis(market.value) : null))
const periods = computed(() => [...new Set(children.value.map((m) => m.period))])
const groupsEl = ref<HTMLElement>()
const groupsFade = ref(false)
let groupsObserver: ResizeObserver | undefined
function measureGroups() {
  const el = groupsEl.value
  groupsFade.value = !!el && el.scrollWidth > el.clientWidth + 1
}
function chooseGroup(value: Family) {
  family.value = value
  selected.value = ''
}
function period(value: string) {
  selected.value = children.value.find((m) => m.period === value)!.id
}
onMounted(() => {
  if (dataMode === 'demo') demoTimer = setInterval(demoTick, 10000)
  measureGroups()
  if (groupsEl.value) {
    groupsObserver = new ResizeObserver(measureGroups)
    groupsObserver.observe(groupsEl.value)
  }
})
onBeforeUnmount(() => {
  groupsObserver?.disconnect()
  clearInterval(demoTimer)
})
watch(groups, measureGroups, { flush: 'post' })
</script>
<template>
  <article
    ref="card"
    class="sp-card sp-match pw-fixture"
    :aria-label="`${fixture.home}对${fixture.away}`"
  >
    <div class="pw-fixture-meta">
      <span class="pw-fixture-meta-copy"
        ><span class="pw-fixture-league"
          ><SportIcon :sport="fixture.sport" :size="14" />{{ fixture.league }}</span
        ></span
      ><button
        :aria-label="`${followed ? '取消关注' : '关注'}${fixture.home}`"
        :aria-pressed="followed"
        @click="emit('follow', fixture.id)"
      >
        <Star :size="18" :fill="followed ? 'currentColor' : 'none'" />
      </button>
    </div>
    <button
      class="pw-fixture-title"
      :aria-label="`${fixture.home}对${fixture.away}比赛中心`"
      @click="emit('tool', '比赛中心', fixture, market)"
    >
      <strong>{{ fixture.home }}</strong
      ><span
        ><b>{{ fixture.score }}</b
        ><small :class="{ 'pw-live': fixture.phase === 'live' }">{{ fixture.stage }}</small></span
      ><strong>{{ fixture.away }}</strong
      ><ChevronRight :size="14" />
    </button>
    <div
      ref="groupsEl"
      class="pw-market-groups"
      :class="{ 'pw-market-groups--fade': groupsFade }"
      aria-label="玩法分组"
    >
      <button
        v-for="m in groups"
        :key="m.family"
        :aria-pressed="m.family === actualFamily"
        :class="{ selected: m.family === actualFamily }"
        @click="chooseGroup(m.family)"
      >
        {{ m.label }}
      </button>
    </div>
    <template v-if="market"
      ><div class="pw-market-controls">
        <div class="pw-periods" aria-label="子玩法">
          <button
            v-for="p in periods"
            :key="p"
            :aria-pressed="market.period === p"
            :class="{ selected: market.period === p }"
            @click="period(p)"
          >
            {{ p }}
          </button>
        </div>
        <GlassSelect
          v-model="selected"
          :display-value="market.line"
          :label="`${fixture.home}盘口线`"
        >
          <option v-for="m in children" :key="m.id" :value="m.id">
            {{ m.period }} · {{ m.line }}
          </option>
        </GlassSelect>
      </div>
      <QuoteMatrix
        :market="market"
        :format="format"
        @quote="(q, i) => emit('quote', fixture, market, q, i)"
      />
      <div class="pw-market-value" v-if="value">
        <span
          >市场百分比 <b>{{ number(value.percentage) }}%</b></span
        ><button v-if="value.roi > 0" @click="emit('tool', '对冲试算', fixture, market)">
          理论价差 +{{ number(value.roi) }}%<ChevronRight :size="12" />
        </button>
      </div>
      <div class="sp-card-actions">
        <button @click="emit('tool', '完整比价', fixture, market)">
          <ChartNoAxesColumn :size="14" />完整比价</button
        ><button @click="emit('tool', '赔率走势', fixture, market)">
          <Activity :size="14" />赔率走势</button
        ><button @click="emit('tool', '提醒设置', fixture, market)"><Bell :size="14" />提醒</button
        ><button @click="emit('tool', '玩法规则', fixture, market)">
          结算规则<ChevronRight :size="12" />
        </button>
      </div>
    </template>
  </article>
</template>
