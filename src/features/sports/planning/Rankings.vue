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
</script>
<template>
  <div class="pw-ranking">
    <p class="pw-scope">{{ scope }} · {{ fixtures.length }} 场赛事</p>
    <div class="pw-tabs">
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
      <small>{{ metric === 'share' ? '占比降序' : '抽水升序' }}</small>
    </div>
    <article v-for="(row, i) in rows" :key="row.operator.id" class="sp-card pw-rank-row">
      <span class="sp-rank-number">{{ i + 1 }}</span
      ><span class="pw-brand-mark">{{ row.operator.mark }}</span>
      <div>
        <header>
          <h3>
            {{ row.operator.name }}
          </h3>
          <b>{{ number(row.value) }}%</b>
        </header>
        <p>{{ metricNames[metric] }} · {{ row.games }} 场 · {{ row.lines.length }} 条盘口</p>
        <div class="sp-rank-bar">
          <i
            :style="{
              width: `${metric === 'share' ? row.value : Math.min(100, Math.max(10, 100 - row.value * 7))}%`,
            }"
          />
        </div>
        <button @click="emit('operator', row.operator.id)">
          查看赔率<ChevronRight :size="13" />
        </button>
      </div>
    </article>
    <p v-if="!rows.length" class="pw-muted">当前范围暂无完整报价，可调整体育、联赛或平台类型。</p>
  </div>
</template>
