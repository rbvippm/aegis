<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Info, ChevronRight } from '@lucide/vue'
import { allocateBudget, bestPrice, formatOdds, isValidQuote } from './logic'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { platformName } from './platforms'
import type { OddsFormat, SportsMatch, SportsMarket } from './types'
const props = defineProps<{
  match: SportsMatch
  market: SportsMarket
  format: OddsFormat
  selected?: { platform: string; side: 'home' | 'away' }
}>()
const budget = ref(1000)
const estimatedCosts = ref<number | ''>('')
const choices = ref({
  home: props.selected?.side === 'home' ? props.selected.platform : '',
  away: props.selected?.side === 'away' ? props.selected.platform : '',
})
const legs = computed(() =>
  (['home', 'away'] as const).map((side) => {
    const selectedQuote = choices.value[side]
      ? props.market.quotes.find(
          (q) => q.platform === choices.value[side] && isValidQuote(q) && q[side] !== null,
        )
      : undefined
    if (choices.value[side] && !selectedQuote) return null
    const quote =
      selectedQuote ??
      props.market.quotes.find((q) => isValidQuote(q) && q[side] === bestPrice(props.market, side))
    return quote && quote[side] !== null
      ? {
          platform: quote.platform,
          maxStake: quote.maxStake,
          feeRate: quote.feeRate,
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
const net = computed(() =>
  result.value &&
  typeof estimatedCosts.value === 'number' &&
  Number.isFinite(estimatedCosts.value) &&
  estimatedCosts.value >= 0
    ? result.value.gross - estimatedCosts.value
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
      <h3>对冲分配试算</h3>
      <p class="sp-small-note"><Check :size="14" />同赛事 · 同盘口 · 完整两项结果</p>
      <div class="sp-hedge-choices">
        <label v-for="side in ['home', 'away'] as const" :key="side" class="sp-field"
          >{{ market.selections[side === 'home' ? 0 : 1]
          }}<GlassSelect
            v-model="choices[side]"
            :label="`对冲${side === 'home' ? '主侧' : '客侧'}平台`"
            ><option value="">自动选择最优赔率</option>
            <option
              v-for="q in market.quotes.filter(isValidQuote)"
              :key="q.platform"
              :value="q.platform"
            >
              {{ platformName(q.platform) }} · {{ formatOdds(q[side], format) }}
            </option></GlassSelect
          ></label
        >
      </div>

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
                {{ platformName(leg?.platform ?? '') }} · {{ leg?.label
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
        <p
          v-for="leg in legs.filter((l) => l?.maxStake)"
          :key="leg?.platform"
          class="sp-small-note"
        >
          {{ platformName(leg!.platform) }} · 单侧深度 {{ leg?.maxStake }} USDT · 费用参考
          {{ ((leg?.feeRate ?? 0) * 100).toFixed(1) }}%<b
            v-if="
              result.stakes[legs.findIndex((l) => l?.platform === leg?.platform)]! > leg!.maxStake!
            "
            class="sp-negative"
          >
            · 分配金额超出深度</b
          >
        </p>
        <label class="sp-budget"
          >预计总成本<span
            ><input
              v-model.number="estimatedCosts"
              type="number"
              min="0"
              max="1000000000"
              step="0.01"
              placeholder="填写手续费与滑点"
              aria-label="预计总成本"
            /><small>USDT</small></span
          ></label
        >
        <div class="sp-net-result">
          <strong>理论净收益</strong
          ><b v-if="net !== null" :class="{ 'sp-negative': net < 0 }"
            >{{ net >= 0 ? '+' : '' }}{{ amount(net) }} USDT</b
          ><b v-else>待核算</b
          ><small v-if="net !== null">按填写成本试算；报价有效期、费用与限额仍需核验。</small>
        </div></template
      >
      <p v-else class="sp-notice">
        {{
          selected &&
          market.quotes.find((q) => q.platform === selected?.platform)?.settlementMatched === false
            ? '该预测合约的结算规则尚未匹配，暂不能与体育市场对冲。'
            : !market.calculationEligible
              ? '该结算类型暂不支持试算，请选择已支持的完整两项市场。'
              : '请输入有效预算，并确认两侧都有有效报价。'
        }}
      </p>
      <div class="sp-uid-prompt">
        <Info :size="15" /><span
          >绑定对应平台 UID，补充返水与奖励收益测算<small
            >绑定后仍需平台确认奖励比例与资格。</small
          ></span
        >
      </div>
      <div class="sp-uid-links">
        <RouterLink
          v-for="leg in legs.filter(Boolean)"
          :key="leg!.platform"
          :to="{
            path: '/me',
            query: { section: 'earnings', panel: 'binding', platform: leg!.platform },
          }"
          >绑定 {{ platformName(leg!.platform) }} UID<ChevronRight :size="13"
        /></RouterLink>
      </div>
    </section>
  </div>
</template>
