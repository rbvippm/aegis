<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ArrowUp, ArrowDown, Ban, ChevronDown, LockKeyhole } from '@lucide/vue'
import { formatOdds } from '../logic'
import type { OddsFormat } from '../types'
import type { Market, Quote } from './model'
import { valid, bestQuote } from './model'
import { planningOperators } from '@/mocks/sports-planning'
const props = defineProps<{ market: Market; format: OddsFormat; full?: boolean }>()
const emit = defineEmits<{ quote: [quote: Quote, index: number] }>()
const expanded = ref(false)
const visible = computed(() =>
  props.full || expanded.value ? props.market.quotes : props.market.quotes.slice(0, 5),
)
const operator = (id: string) => planningOperators.find((p) => p.id === id)!
const changes = ref<Record<string, { direction: 'up' | 'down'; version: number }>>({})
const timers = new Map<string, ReturnType<typeof setTimeout>>()
let version = 0
const changeKey = (q: Quote, i: number) => `${q.operator}:${i}`
const change = (q: Quote, i: number) => changes.value[changeKey(q, i)]
function clearChanges() {
  timers.forEach(clearTimeout)
  timers.clear()
  changes.value = {}
}
watch(
  () => ({
    id: props.market.id,
    quotes: props.market.quotes.map((q) => ({ ...q, prices: [...q.prices] })),
  }),
  (current, previous) => {
    if (current.id !== previous.id) {
      clearChanges()
      return
    }
    for (const q of current.quotes) {
      const old = previous.quotes.find((item) => item.operator === q.operator)
      q.prices.forEach((price, i) => {
        const key = changeKey(q, i)
        const before = old?.prices[i]
        if (q.status !== 'active' || price == null || old?.status !== 'active' || before == null) {
          clearTimeout(timers.get(key))
          timers.delete(key)
          delete changes.value[key]
          return
        }
        if (price === before) return
        clearTimeout(timers.get(key))
        changes.value[key] = { direction: price > before ? 'up' : 'down', version: ++version }
        timers.set(
          key,
          setTimeout(() => {
            delete changes.value[key]
            timers.delete(key)
          }, 3000),
        )
      })
    }
  },
)
onBeforeUnmount(clearChanges)
</script>
<template>
  <div class="pw-matrix-scroll" :class="{ 'pw-matrix-scroll--wide': market.selections.length > 3 }">
    <table
      class="sp-quotes pw-matrix"
      :style="
        market.selections.length > 3
          ? { minWidth: `${130 + market.selections.length * 72}px` }
          : undefined
      "
    >
      <thead>
        <tr>
          <th>平台</th>
          <th v-for="(selection, i) in market.selections" :key="i">{{ selection }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="q in visible" :key="q.operator">
          <th>
            <span class="pw-brand"
              ><i>{{ operator(q.operator).mark }}</i
              ><span>{{ operator(q.operator).name }}</span></span
            >
          </th>
          <td v-for="(_, i) in market.selections" :key="i">
            <button
              v-if="q.status === 'active' && q.prices[i] != null"
              class="sp-price"
              :data-operator="q.operator"
              :data-selection-index="i"
              :class="{ best: valid(q) && q.operator === bestQuote(market, i)?.operator }"
              :aria-label="`${operator(q.operator).name} ${market.selections[i]} ${formatOdds(q.prices[i]!, format)}`"
              @click="emit('quote', q, i)"
            >
              <strong
                :class="{
                  'pw-odds-up': change(q, i)?.direction === 'up',
                  'pw-odds-down': change(q, i)?.direction === 'down',
                }"
                >{{ formatOdds(q.prices[i]!, format)
                }}<component
                  v-if="change(q, i)"
                  :is="change(q, i)?.direction === 'up' ? ArrowUp : ArrowDown"
                  :key="change(q, i)?.version"
                  :size="13"
                  :stroke-width="2.5"
                  class="sp-price-arrow"
                  :class="
                    change(q, i)?.direction === 'up' ? 'sp-change-up' : 'sp-change-down'
                  " /></strong
              ><small
                v-if="valid(q) && q.prices[i] === bestQuote(market, i)?.prices[i]"
                class="sp-best-tag"
                >最优</small
              ><small v-if="!q.matched" class="pw-micro">独立规则</small></button
            ><span
              v-else
              class="sp-paused"
              :class="{
                'sp-paused--locked': q.status === 'suspended',
                'sp-paused--sealed': q.status === 'stale',
              }"
              ><span class="pw-status-tag"
                ><LockKeyhole v-if="q.status === 'suspended'" :size="13" /><Ban
                  v-else-if="q.status === 'stale'"
                  :size="13"
                />{{
                  q.status === 'stale' ? '封盘' : q.status === 'suspended' ? '锁盘' : '暂无'
                }}</span
              ></span
            >
          </td>
        </tr>
        <tr v-if="!visible.length">
          <td :colspan="market.selections.length + 1">暂无匹配平台</td>
        </tr>
      </tbody>
    </table>
  </div>
  <button v-if="market.quotes.length > 5 && !full" class="sp-expand" @click="expanded = !expanded">
    {{ expanded ? '收起平台' : `展开其余平台（${market.quotes.length - 5}）`
    }}<ChevronDown :size="14" :class="{ 'sp-rotate': expanded }" />
  </button>
</template>
