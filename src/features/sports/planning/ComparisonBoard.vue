<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import QuoteMatrix from './QuoteMatrix.vue'
import { planningMatches, planningOperators } from '@/mocks/sports-planning'
import {
  familyNames,
  categoryNames,
  type Fixture,
  type Family,
  type Category,
  type Quote,
  type Market,
} from './model'
import type { OddsFormat } from '../types'
const props = defineProps<{ selected: Record<string, string>; format: OddsFormat }>()
const emit = defineEmits<{
  change: [selected: Record<string, string>]
  quote: [fixture: Fixture, market: Market, quote: Quote, index: number]
}>()
const league = ref(''),
  family = ref<Family | 'all'>('all'),
  category = ref<Category>('all')
const chosen = computed(() =>
  Object.keys(props.selected)
    .map((id) => planningMatches.find((f) => f.id === id))
    .filter((f): f is Fixture => !!f),
)
const leagues = computed(() => [...new Set(planningMatches.map((f) => f.league))])
function add(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  if (id)
    emit('change', {
      ...props.selected,
      [id]: planningMatches.find((f) => f.id === id)!.markets[0]!.id,
    })
}
function remove(id: string) {
  const next = { ...props.selected }
  delete next[id]
  emit('change', next)
}
function selectMarket(id: string, event: Event) {
  emit('change', { ...props.selected, [id]: (event.target as HTMLSelectElement).value })
}
function market(f: Fixture) {
  const filtered = f.markets.filter((m) => family.value === 'all' || m.family === family.value)
  const m = filtered.find((m) => m.id === props.selected[f.id]) ?? filtered[0]
  return m
    ? {
        ...m,
        quotes: m.quotes.filter(
          (q) =>
            category.value === 'all' ||
            planningOperators.find((p) => p.id === q.operator)?.category === category.value,
        ),
      }
    : null
}
</script>
<template>
  <div class="sp-compare-count">
    <strong>已选 {{ chosen.length }} 场赛事</strong><small>同场同盘独立比较</small>
  </div>
  <label class="sp-field"
    >联赛<GlassSelect v-model="league" label="比价联赛" searchable
      ><option value="">全部联赛</option>
      <option v-for="name in leagues" :key="name">{{ name }}</option></GlassSelect
    ></label
  ><label class="sp-field"
    >添加赛事<GlassSelect label="添加比价赛事" searchable @change="add"
      ><option value="">选择赛事</option>
      <option
        v-for="f in planningMatches.filter((f) => !league || f.league === league)"
        :key="f.id"
        :value="f.id"
        :disabled="f.id in selected"
      >
        {{ f.home }} vs {{ f.away }} · {{ f.league }}{{ f.id in selected ? ' · 已选' : '' }}
      </option></GlassSelect
    ></label
  >
  <div class="pw-two">
    <label class="sp-field"
      >比较玩法<GlassSelect v-model="family" label="比价玩法"
        ><option value="all">各赛事当前玩法</option>
        <option v-for="(name, id) in familyNames" :key="id" :value="id">
          {{ name }}
        </option></GlassSelect
      ></label
    ><label class="sp-field"
      >平台类型<GlassSelect v-model="category" label="比价平台类型"
        ><option v-for="(name, id) in categoryNames" :key="id" :value="id">
          {{ name }}
        </option></GlassSelect
      ></label
    >
  </div>
  <article v-for="f in chosen" :key="f.id" class="sp-card">
    <div class="sp-section-title">
      <h3>{{ f.home }} vs {{ f.away }}</h3>
      <button :aria-label="`移除${f.id}`" @click="remove(f.id)"><X :size="17" /></button>
    </div>
    <p class="pw-muted">{{ f.league }} · {{ f.stage }}</p>
    <label class="sp-field"
      >盘口与时段<GlassSelect
        :model-value="market(f)?.id ?? ''"
        :label="`${f.home}比价盘口`"
        searchable
        @change="selectMarket(f.id, $event)"
        ><option
          v-for="m in f.markets.filter((m) => family === 'all' || m.family === family)"
          :key="m.id"
          :value="m.id"
        >
          {{ m.label }} · {{ m.scope }} · {{ m.line }}
        </option></GlassSelect
      ></label
    ><QuoteMatrix
      v-if="market(f)"
      :market="market(f)!"
      :format="format"
      @quote="(q, i) => emit('quote', f, market(f)!, q, i)"
    />
    <p v-else class="pw-muted">此赛事暂无该玩法。</p>
  </article>
  <p v-if="!chosen.length" class="pw-muted">尚未选择赛事，可按联赛搜索并添加。</p>
</template>
