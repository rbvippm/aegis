<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Info, Share2 } from '@lucide/vue'
import {
  rankOperators,
  metricNames,
  number,
  type Fixture,
  type Operator,
  type Metric,
} from './model'
defineOptions({ name: 'SportsPlanningRankings' })
const props = defineProps<{
  fixtures: Fixture[]
  operators: Operator[]
  metric: Metric
  scope: string
}>()
const emit = defineEmits<{
  'update:metric': [value: Metric]
  operator: [id: string]
  audit: []
  report: []
}>()
const rows = computed(() => rankOperators(props.fixtures, props.operators, props.metric))
const sortLabel = computed(() => (props.metric === 'share' ? '占比降序' : '抽水升序'))
function barWidth(value: number) {
  if (props.metric === 'share') return Math.min(100, Math.max(8, value))
  const low = Math.min(...rows.value.map((row) => row.value))
  if (!(value > 0) || !(low > 0)) return 46
  return Math.max(16, Math.min(100, (low / value) * 100))
}
</script>
<template>
  <div class="pw-ranking">
    <p class="pw-scope">
      <span v-for="(part, index) in scope.split(' · ')" :key="`${part}-${index}`">{{ part }}</span>
      <b>{{ fixtures.length }} 场赛事</b>
    </p>
    <div class="pw-tabs pw-metric-tabs">
      <button
        v-for="(name, id) in metricNames"
        :key="id"
        :aria-pressed="metric === id"
        :class="{ selected: metric === id }"
        @click="emit('update:metric', id)"
      >
        {{ name }}
      </button>
    </div>
    <div class="pw-ranking-tools">
      <button @click="emit('audit')"><Info :size="14" />公开计算核验</button
      ><button @click="emit('report')"><Share2 :size="14" />导出报告</button>
    </div>
    <div class="sp-section-title">
      <h2>平台赔率排名</h2>
      <span class="pw-sort">{{ sortLabel }}</span>
    </div>
    <article
      v-for="(row, i) in rows"
      :key="row.operator.id"
      class="sp-card pw-rank-row"
      :class="{ 'pw-rank-row--first': i === 0, 'pw-rank-row--top': i < 3 }"
    >
      <span class="sp-rank-number">{{ i + 1 }}</span
      ><span class="pw-brand-mark">{{ row.operator.mark }}</span>
      <div class="pw-rank-main">
        <header>
          <h3>{{ row.operator.name }}</h3>
          <b>{{ number(row.value) }}%</b>
        </header>
        <div class="pw-rank-meta">
          <p>{{ metricNames[metric] }} · {{ row.games }} 场 · {{ row.lines.length }} 条盘口</p>
          <button @click="emit('operator', row.operator.id)">
            查看赔率<ChevronRight :size="14" />
          </button>
        </div>
        <div class="sp-rank-bar">
          <i :style="{ width: `${barWidth(row.value)}%` }" />
        </div>
      </div>
    </article>
    <p v-if="!rows.length" class="pw-muted">当前范围暂无完整报价，可调整体育、联赛或平台类型。</p>
  </div>
</template>
