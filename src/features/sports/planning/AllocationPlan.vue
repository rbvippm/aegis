<script setup lang="ts">
import { computed, ref } from 'vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { allocateBudget, formatOdds } from '../logic'
import type { OddsFormat } from '../types'
import type { Fixture, Market, Quote } from './model'
import { bestQuote, valid, number } from './model'
import { planningOperators } from '@/mocks/sports-planning'
const props = defineProps<{
  fixture: Fixture
  market: Market
  format: OddsFormat
  selected?: { quote: Quote; index: number }
}>()
const budget = ref(1000),
  cost = ref<number | ''>('')
const choices = ref<Record<number, string>>(
  props.selected ? { [props.selected.index]: props.selected.quote.operator } : {},
)
const name = (id: string) => planningOperators.find((p) => p.id === id)?.name ?? id
const legs = computed(() =>
  props.market.selections.map((label, i) => ({
    label,
    index: i,
    quote: choices.value[i]
      ? props.market.quotes.find((q) => q.operator === choices.value[i] && valid(q))
      : bestQuote(props.market, i),
  })),
)
const result = computed(() =>
  props.market.calculable && legs.value.every((l) => l.quote?.prices[l.index] != null)
    ? allocateBudget(
        budget.value,
        legs.value.map((l) => l.quote!.prices[l.index]!),
      )
    : null,
)
const net = computed(() =>
  result.value && typeof cost.value === 'number' && cost.value >= 0 && Number.isFinite(cost.value)
    ? result.value.gross - cost.value
    : null,
)
</script>
<template>
  <div class="pw-plan">
    <p class="pw-muted">{{ fixture.league }} · {{ market.label }}</p>
    <h3>{{ fixture.home }} vs {{ fixture.away }}</h3>
    <p class="pw-muted">{{ market.scope }} · {{ market.line }}</p>
    <p v-if="!market.calculable" class="sp-notice">
      {{ market.rule }} 此玩法不采用完整互斥赛果的预算分配公式。
    </p>
    <template v-else>
      <label v-for="leg in legs" :key="leg.index" class="sp-field"
        >{{ leg.label
        }}<GlassSelect v-model="choices[leg.index]" :label="`${leg.label}对冲平台`" searchable
          ><option value="">自动选择最优赔率</option>
          <option v-for="q in market.quotes.filter(valid)" :key="q.operator" :value="q.operator">
            {{ name(q.operator) }} · {{ formatOdds(q.prices[leg.index] ?? null, format) }}
          </option></GlassSelect
        ></label
      >
      <label class="sp-field"
        >总预算（USDT）<input
          v-model.number="budget"
          type="number"
          min="0.02"
          max="1000000000"
          step="0.01"
          aria-label="总预算"
      /></label>
      <template v-if="result"
        ><div class="pw-matrix-scroll">
          <table class="sp-allocation">
            <thead>
              <tr>
                <th>平台 / 选项</th>
                <th>金额</th>
                <th>理论返还</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(leg, i) in legs" :key="i">
                <th>
                  {{ name(leg.quote!.operator) }} · {{ leg.label
                  }}<small>{{ formatOdds(leg.quote!.prices[i]!, format) }}</small>
                </th>
                <td>{{ number(result.stakes[i]!) }}</td>
                <td>{{ number(result.returns[i]!) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="sp-gross">
          <strong>理论毛收益</strong
          ><b :class="{ 'sp-negative': result.gross < 0 }"
            >{{ result.gross >= 0 ? '+' : '' }}{{ number(result.gross) }} USDT</b
          >
        </div>
        <p class="pw-muted">理论毛收益率 {{ number(result.roi) }}%</p>
        <label class="sp-field"
          >预计总成本（USDT）<input
            v-model.number="cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="填写预计成本"
            aria-label="预计总成本"
        /></label>
        <div class="sp-net-result">
          <strong>理论净收益</strong
          ><b v-if="net != null" :class="{ 'sp-negative': net < 0 }"
            >{{ net >= 0 ? '+' : '' }}{{ number(net) }} USDT</b
          ><b v-else>待核算</b><small>基于所选报价与填写成本的数学试算。</small>
        </div></template
      >
      <p v-else class="sp-notice">请输入有效预算，并选择覆盖完整赛果的有效报价。</p></template
    >
    <p class="pw-muted">绑定对应平台 UID，补充返水与奖励收益测算。</p>
    <div class="pw-inline-links">
      <RouterLink
        v-for="id in [...new Set(legs.map((l) => l.quote?.operator).filter(Boolean))]"
        :key="id"
        :to="{ path: '/me', query: { section: 'earnings', panel: 'binding', platform: id } }"
        >绑定 {{ name(id!) }} UID →</RouterLink
      >
    </div>
  </div>
</template>
