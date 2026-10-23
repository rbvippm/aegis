<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Clock3, Info, TriangleAlert } from '@lucide/vue'
import { allocateBudget, bestPrice, formatOdds } from './logic'
import type { OddsFormat, SportsMatch, SportsMarket } from './types'
const props = defineProps<{
  match: SportsMatch
  market: SportsMarket
  format: OddsFormat
  selected?: { platform: string; side: 'home' | 'away' }
}>()
const budget = ref(1000)
const confirmation = ref('')
const legs = computed(() =>
  (['home', 'away'] as const).map((side) => {
    const selectedQuote =
      props.selected?.side === side
        ? props.market.quotes.find(
            (q) =>
              q.platform === props.selected?.platform && q.status === 'active' && q[side] !== null,
          )
        : undefined
    const quote =
      selectedQuote ??
      props.market.quotes.find(
        (q) => q.status === 'active' && q[side] === bestPrice(props.market, side),
      )
    return quote && quote[side] !== null
      ? {
          platform: quote.platform,
          decimal: quote[side]!,
          label: props.market.selections[side === 'home' ? 0 : 1],
        }
      : null
  }),
)
const result = computed(() =>
  props.market.calculationEligible && legs.value.every(Boolean)
    ? allocateBudget(
        budget.value,
        legs.value.map((l) => l!.decimal),
      )
    : null,
)
const amount = (n: number) =>
  n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
</script>
<template>
  <div class="sp-plan">
    <div class="sp-card sp-context">
      <h3>{{ match.home }} <span>VS</span> {{ match.away }}</h3>
      <p>{{ market.scope }} · {{ market.line }}</p>
      <div v-if="selected" class="sp-context-selected">
        所选报价：平台 {{ selected.platform }} ·
        {{ market.selections[selected.side === 'home' ? 0 : 1] }} ·
        {{
          formatOdds(
            market.quotes.find((q) => q.platform === selected?.platform)?.[
              selected?.side ?? 'home'
            ] ?? null,
            format,
          )
        }}
      </div>
    </div>
    <section class="sp-card">
      <h3>核验清单</h3>
      <div class="sp-check">
        <Check :size="18" /><span>同一赛事 / 市场 / 结算规则</span><b>已匹配</b>
      </div>
      <div class="sp-check">
        <Info :size="18" /><span>报价与时效</span><b class="sp-muted">本地样本</b>
      </div>
      <div class="sp-check sp-amber">
        <Clock3 :size="18" /><span>手续费与可用限额</span><b>待核验</b>
      </div>
    </section>
    <section class="sp-card">
      <h3>方案试算</h3>
      <label class="sp-budget"
        >总预算
        <span
          ><input
            v-model.number="budget"
            type="number"
            min="0.02"
            max="1000000000"
            step="0.01"
            aria-label="总预算"
          /><small>USDT</small></span
        ></label
      >
      <template v-if="result"
        ><table class="sp-allocation">
          <thead>
            <tr>
              <th>选项</th>
              <th>金额</th>
              <th>理论返还</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(leg, i) in legs" :key="i">
              <th>
                平台 {{ leg?.platform }} · {{ leg?.label
                }}<small>{{ formatOdds(leg?.decimal ?? null, format) }}</small>
              </th>
              <td>{{ amount(result.stakes[i]!) }}</td>
              <td>{{ amount(result.returns[i]!) }}</td>
            </tr>
          </tbody>
        </table>
        <p class="sp-unit">金额单位：USDT</p>
        <div class="sp-gross">
          <strong>理论毛收益</strong
          ><b :class="{ 'sp-negative': result.gross < 0 }"
            >{{ result.gross >= 0 ? '+' : '' }}{{ amount(result.gross) }} USDT</b
          >
        </div>
        <div class="sp-summary-row">
          <span>理论毛收益率</span><strong>{{ result.roi.toFixed(2) }}%</strong>
        </div>
        <div class="sp-summary-row">
          <span>手续费 / 滑点 / 限额</span><b class="sp-amber">待核验</b>
        </div>
        <div class="sp-summary-row"><strong>理论净收益</strong><b>待核算</b></div></template
      >
      <p v-else class="sp-notice">
        {{
          !market.calculationEligible
            ? '该结算类型暂不支持试算，请选择已支持的完整两项市场。'
            : '请输入有效预算，并确认两侧都有有效报价。'
        }}
      </p>
      <p class="sp-small-note"><Info :size="13" />返水未核验，不计入收益</p>
      <p class="sp-notice"><TriangleAlert :size="16" />报价或规则变化后，请重新核验</p>
      <button
        class="sp-primary sp-full"
        @click="confirmation = '报价服务尚未接入，无法完成实时核验。'"
      >
        重新核验报价
      </button>
      <p v-if="confirmation" class="sp-feedback" role="status">{{ confirmation }}</p>
    </section>
  </div>
</template>
