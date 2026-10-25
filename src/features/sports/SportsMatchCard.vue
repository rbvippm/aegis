<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Star,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  ChevronRight,
  ChartNoAxesColumn,
  Bell,
  LockKeyhole,
  Trophy,
  Activity,
} from '@lucide/vue'
import type { OddsFormat, SportsMatch, SportsMarket, SportsQuote } from './types'
import { bestPrice, formatOdds, isValidQuote } from './logic'
import PlatformBadge from '@/shared/ui/PlatformBadge.vue'
import { getSportsPlatform } from './platforms'
const props = defineProps<{
  match: SportsMatch
  format: OddsFormat
  platform: string
  followed: boolean
  enabledKinds?: string[]
}>()
const emit = defineEmits<{
  follow: [id: string]
  quote: [match: SportsMatch, market: SportsMarket, platform: string, side: 'home' | 'away']
  tool: [kind: string, match: SportsMatch, market: SportsMarket]
}>()
const marketId = ref('handicap')
const expanded = ref(false)
const kinds = computed(() =>
  props.match.markets.filter(
    (m, i, all) =>
      (!props.enabledKinds || props.enabledKinds.includes(m.kind)) &&
      all.findIndex((x) => x.kind === m.kind) === i,
  ),
)
const kind = ref(props.match.markets[0]!.kind)
const children = computed(() => props.match.markets.filter((m) => m.kind === kind.value))
function pickKind(id: typeof kind.value) {
  kind.value = id
  marketId.value = props.match.markets.find((m) => m.kind === id)!.id
}
watch(kinds, (value) => {
  if (value.length && !value.some((m) => m.kind === kind.value)) pickKind(value[0]!.kind)
})
const market = computed(
  () => props.match.markets.find((m) => m.id === marketId.value) ?? props.match.markets[0]!,
)
const eligibleMarket = computed(() => ({
  ...market.value,
  quotes: market.value.quotes.filter((q) => !props.platform || q.platform === props.platform),
}))
const quotes = computed(() =>
  expanded.value
    ? eligibleMarket.value.quotes
    : eligibleMarket.value.quotes.filter(
        (q, i) => i < 3 || ['azuro', 'overtime'].includes(q.platform),
      ),
)
const best = (side: 'home' | 'away') => bestPrice(eligibleMarket.value, side)
const bestPlatform = computed(
  () =>
    eligibleMarket.value.quotes
      .filter(isValidQuote)
      .map((q) => getSportsPlatform(q.platform))
      .filter((p) => p?.score != null)
      .sort((a, b) => b!.score! - a!.score!)[0]?.id,
)
function direction(q: SportsQuote, side: 'home' | 'away') {
  const previous = side === 'home' ? q.previousHome : q.previousAway
  return previous !== undefined && q[side] !== null
    ? q[side]! > previous
      ? 'up'
      : q[side]! < previous
        ? 'down'
        : ''
    : ''
}
</script>

<template>
  <article class="sp-card sp-match" :aria-label="`${match.home}对${match.away}`">
    <div class="sp-match-meta">
      <span><Trophy :size="14" />{{ match.league }}</span
      ><span :class="{ 'sp-live': match.phase === 'live' }">{{ match.stage }}</span
      ><button
        :aria-label="`${followed ? '取消关注' : '关注'}${match.home}`"
        :aria-pressed="followed"
        @click="emit('follow', match.id)"
      >
        <Star :size="18" :fill="followed ? 'currentColor' : 'none'" />
      </button>
    </div>
    <div class="sp-teams">
      <span class="sp-team-mark" :class="{ 'sp-team-mark--ball': match.sport === 'basketball' }"
        ><Activity v-if="match.sport === 'basketball'" :size="22" /><Trophy
          v-else
          :size="22" /></span
      ><strong>{{ match.home }}</strong
      ><b>{{ match.score }}</b
      ><strong>{{ match.away }}</strong
      ><span class="sp-team-mark sp-team-mark--away"><Trophy :size="22" /></span>
    </div>
    <div class="sp-market-tabs">
      <button
        v-for="item in kinds"
        :key="item.id"
        :class="{ active: item.kind === kind }"
        :aria-pressed="item.kind === kind"
        @click="pickKind(item.kind)"
      >
        {{ item.label }}
      </button>
    </div>
    <div class="sp-submarkets" aria-label="子玩法">
      <button
        v-for="item in children"
        :key="item.id"
        :aria-pressed="market.id === item.id"
        :class="{ selected: market.id === item.id }"
        @click="marketId = item.id"
      >
        <strong>{{ item.scope }}</strong
        ><span>{{ item.line }}</span>
      </button>
    </div>
    <table class="sp-quotes">
      <thead>
        <tr>
          <th>平台</th>
          <th v-for="label in market.selections" :key="label">{{ label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="q in quotes" :key="q.platform">
          <th>
            <PlatformBadge :platform="q.platform" />
            <span class="sp-platform-score"
              ><ShieldCheck :size="11" />{{
                getSportsPlatform(q.platform)?.score?.toFixed(1) ?? '未评分'
              }}<b v-if="q.platform === bestPlatform">平台分最优</b></span
            >
            <small v-if="getSportsPlatform(q.platform)?.type === 'web3'" class="sp-web3-tag"
              >Web3 · {{ q.settlementMatched === false ? '独立规则' : '规则匹配' }}</small
            >
          </th>
          <td v-for="side in ['home', 'away'] as const" :key="side">
            <button
              v-if="q.status === 'active' && q[side] !== null"
              class="sp-price"
              :class="{
                best: isValidQuote(q) && q[side] === best(side),
                'sp-price--up': direction(q, side) === 'up',
                'sp-price--down': direction(q, side) === 'down',
              }"
              :aria-label="`平台 ${q.platform} ${market.selections[side === 'home' ? 0 : 1]} ${formatOdds(q[side], format)}`"
              @click="emit('quote', match, market, q.platform, side)"
            >
              <strong
                >{{ formatOdds(q[side], format)
                }}<component
                  v-if="direction(q, side)"
                  :is="direction(q, side) === 'up' ? ArrowUp : ArrowDown"
                  class="sp-price-arrow"
                  :size="12"
                  :aria-label="direction(q, side) === 'up' ? '上升' : '下降'"
              /></strong>
              <span v-if="isValidQuote(q) && q[side] === best(side)" class="sp-best-tag"
                >赔率最优</span
              >
              <small v-if="q.settlementMatched === false" class="sp-unmatched">独立查看</small>
            </button>
            <span v-else class="sp-paused"
              ><LockKeyhole :size="12" />{{ q.status === 'stale' ? '封盘' : '锁盘' }}</span
            >
          </td>
        </tr>
        <tr v-if="!quotes.length">
          <td colspan="3" class="sp-table-empty">该平台暂无此市场报价</td>
        </tr>
      </tbody>
    </table>
    <p class="sp-rule-note"><InfoIcon />同盘口比价 · 独立规则合约不参与排序</p>
    <div class="sp-card-actions">
      <button @click="emit('tool', '完整比价', match, market)">
        <ChartNoAxesColumn :size="15" />完整比价<ChevronRight :size="12" /></button
      ><button @click="emit('tool', '赔率走势', match, market)">
        <Activity :size="15" />赔率走势</button
      ><button @click="emit('tool', '设置变动提醒', match, market)"><Bell :size="15" />提醒</button>
    </div>
    <button v-if="eligibleMarket.quotes.length > 5" class="sp-expand" @click="expanded = !expanded">
      {{ expanded ? '收起平台' : '展开其余平台'
      }}<ChevronDown :size="14" :class="{ 'sp-rotate': expanded }" />
    </button>
  </article>
</template>
<script lang="ts">
import { Info as InfoIcon } from '@lucide/vue'
</script>
