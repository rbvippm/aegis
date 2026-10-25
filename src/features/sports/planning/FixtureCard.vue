<script setup lang="ts">
import { computed, ref } from 'vue'
import { Star, ChevronRight, Activity, Bell, ChartNoAxesColumn } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
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
const market = computed(
  () => children.value.find((m) => m.id === selected.value) ?? children.value[0]!,
)
const value = computed(() => (market.value ? analysis(market.value) : null))
const periods = computed(() => [...new Set(children.value.map((m) => m.period))])
function chooseGroup(value: Family) {
  family.value = value
  selected.value = ''
}
function period(value: string) {
  selected.value = children.value.find((m) => m.period === value)!.id
}
</script>
<template>
  <article class="sp-card sp-match pw-fixture" :aria-label="`${fixture.home}对${fixture.away}`">
    <div class="pw-fixture-meta">
      <span class="pw-fixture-meta-copy"
        ><span class="pw-fixture-league"
          ><SportIcon :sport="fixture.sport" :size="14" />{{ fixture.league }}</span
        ><small v-if="market"
          >{{ market.quotes.length }} 家平台 · {{ market.selections.length }} 项结果</small
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
    <div class="pw-market-groups" aria-label="玩法分组">
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
      <p class="pw-market-context">{{ market.scope }}</p>
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
