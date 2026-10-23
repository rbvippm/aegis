<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Star,
  ChevronDown,
  ChevronRight,
  ChartNoAxesColumn,
  Bell,
  LockKeyhole,
  Trophy,
  Activity,
} from '@lucide/vue'
import type { OddsFormat, SportsMatch, SportsMarket, SportsQuote } from './types'
import { bestPrice, formatOdds } from './logic'
const props = defineProps<{
  match: SportsMatch
  format: OddsFormat
  platform: string
  followed: boolean
}>()
const emit = defineEmits<{
  follow: [id: string]
  quote: [match: SportsMatch, market: SportsMarket, platform: string, side: 'home' | 'away']
  tool: [kind: string, match: SportsMatch, market: SportsMarket]
}>()
const marketId = ref('handicap')
const expanded = ref(false)
const market = computed(
  () => props.match.markets.find((m) => m.id === marketId.value) ?? props.match.markets[0]!,
)
const eligibleMarket = computed(() => ({
  ...market.value,
  quotes: market.value.quotes.filter((q) => !props.platform || q.platform === props.platform),
}))
const quotes = computed(() =>
  expanded.value ? eligibleMarket.value.quotes : eligibleMarket.value.quotes.slice(0, 3),
)
const best = (side: 'home' | 'away') => bestPrice(eligibleMarket.value, side)
function direction(q: SportsQuote) {
  return q.previousHome !== undefined && q.home !== null
    ? q.home < q.previousHome
      ? '↓'
      : q.home > q.previousHome
        ? '↑'
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
        v-for="item in match.markets"
        :key="item.id"
        :class="{ active: item.id === market.id }"
        :aria-pressed="item.id === market.id"
        @click="marketId = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <button class="sp-market-scope" @click="emit('tool', '盘口与结算规则', match, market)">
      {{ market.scope }} · {{ market.line }}<ChevronDown :size="13" />
    </button>
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
            <span class="sp-avatar" :class="`sp-avatar--${q.platform}`">{{ q.platform }}</span
            ><span>平台 {{ q.platform }}</span>
          </th>
          <td v-for="side in ['home', 'away'] as const" :key="side">
            <button
              v-if="q.status === 'active' && q[side] !== null"
              class="sp-price"
              :class="{ best: q[side] === best(side) }"
              :aria-label="`平台 ${q.platform} ${market.selections[side === 'home' ? 0 : 1]} ${formatOdds(q[side], format)}`"
              @click="emit('quote', match, market, q.platform, side)"
            >
              <strong
                >{{ formatOdds(q[side], format)
                }}<small v-if="side === 'home' && direction(q)" class="sp-negative">{{
                  direction(q)
                }}</small></strong
              ><span v-if="q[side] === best(side)" class="sp-best-tag">最优</span>
            </button>
            <span v-else class="sp-paused"
              ><LockKeyhole :size="12" />{{ q.status === 'stale' ? '过期' : '暂停' }}</span
            >
          </td>
        </tr>
        <tr v-if="!quotes.length">
          <td colspan="3" class="sp-table-empty">该平台暂无此市场报价</td>
        </tr>
      </tbody>
    </table>
    <p class="sp-rule-note"><InfoIcon />同盘口与结算规则一致</p>
    <div class="sp-card-actions">
      <button @click="emit('tool', '完整比价', match, market)">
        <ChartNoAxesColumn :size="15" />完整比价<ChevronRight :size="12" /></button
      ><button @click="emit('tool', '赔率走势', match, market)">
        <Activity :size="15" />赔率走势</button
      ><button @click="emit('tool', '设置变动提醒', match, market)"><Bell :size="15" />提醒</button>
    </div>
    <button v-if="eligibleMarket.quotes.length > 3" class="sp-expand" @click="expanded = !expanded">
      {{ expanded ? '收起平台' : '展开其余平台'
      }}<ChevronDown :size="14" :class="{ 'sp-rotate': expanded }" />
    </button>
  </article>
</template>
<script lang="ts">
import { Info as InfoIcon } from '@lucide/vue'
</script>
