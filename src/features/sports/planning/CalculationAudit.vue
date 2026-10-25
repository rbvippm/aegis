<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { planningSnapshot } from '@/mocks/sports-planning'
import {
  rankOperators,
  metricNames,
  number,
  type Fixture,
  type Operator,
  type Metric,
} from './model'
const props = defineProps<{ fixtures: Fixture[]; operators: Operator[]; metric: Metric }>()
const selected = ref(props.operators[0]?.id ?? 'A'),
  step = ref(0),
  expanded = ref(false)
const rows = computed(() => rankOperators(props.fixtures, props.operators, props.metric))
const row = computed(() => rows.value.find((r) => r.operator.id === selected.value))
const titles = [
  '固定输入快照',
  '逐盘口计算',
  '玩法与范围',
  '指标取值',
  '汇总结果',
  '同范围平台对照',
  '核验完成',
]
watch(selected, () => {
  step.value = 0
})
</script>
<template>
  <div class="pw-audit">
    <label class="sp-field"
      >核验平台<GlassSelect v-model="selected" label="核验平台" searchable
        ><option v-for="p in operators" :key="p.id" :value="p.id">{{ p.name }}</option></GlassSelect
      ></label
    >
    <p class="pw-muted">{{ planningSnapshot }} · 同一份本地快照重新计算</p>
    <div class="pw-step-dots">
      <i v-for="(_, i) in titles" :key="i" :class="{ selected: i <= step }" />
    </div>
    <h3>{{ step + 1 }} / 7 · {{ titles[step] }}</h3>
    <template v-if="row"
      ><p v-if="step === 0" class="pw-body">
        {{ row.operator.name }} · {{ row.games }} 场赛事 ·
        {{ row.lines.length }} 条完整盘口。以下显示固定快照中的原始十进制价格。
      </p>
      <p v-else-if="step === 1" class="pw-body">
        {{
          metric === 'share'
            ? '最优占比 = 所选平台取得最优赔率的结果数 ÷ 该平台完整盘口中的结果总数 ×100%；并列最优分别计入。'
            : '单盘口抽水 =（各赛果隐含概率之和 − 1）× 100%；隐含概率 = 1 ÷ 十进制赔率。'
        }}
      </p>
      <p v-else-if="step === 2" class="pw-body">
        核验范围与当前排名筛选一致。{{
          metric === 'moneyline' ? '仅使用胜负盘。' : '使用可覆盖完整互斥赛果的玩法。'
        }}
        双重机会、走盘和退款类玩法不套用这个简单公式。
      </p>
      <p v-else-if="step === 3" class="pw-body">
        {{
          metric === 'share'
            ? '汇总每个完整盘口的最优结果数和总结果数，再计算占比。'
            : metric === 'sharp'
              ? '最优赔率指标取盘口抽水的第 10 百分位。'
              : '典型与胜负盘指标取对应盘口抽水的中位数。'
        }}
        排序前先对每个平台分别计算。
      </p>
      <p v-else-if="step === 4" class="pw-audit-result">
        {{ metricNames[metric] }}<strong>{{ number(row.value) }}%</strong>
      </p>
      <div v-else-if="step === 5">
        <div v-for="r in rows" :key="r.operator.id" class="pw-audit-compare">
          <span>{{ r.operator.name }}</span
          ><b>{{ number(r.value) }}%</b>
        </div>
      </div>
      <p v-else class="pw-audit-result">
        与当前排名结果一致<strong>{{ number(row.value) }}%</strong
        ><small>核验使用相同数据范围与相同计算函数。</small>
      </p>
      <div v-if="step < 4" class="pw-matrix-scroll">
        <table class="pw-audit-table">
          <thead>
            <tr>
              <th>赛事 / 玩法</th>
              <th>原始赔率</th>
              <th v-if="step > 0">抽水</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in row.lines.slice(0, expanded ? undefined : 6)"
              :key="`${line.fixture.id}-${line.market.id}`"
            >
              <th>
                {{ line.fixture.home }} vs {{ line.fixture.away
                }}<small>{{ line.market.label }} · {{ line.market.line }}</small>
              </th>
              <td>{{ line.prices.map((p) => p.toFixed(2)).join(' / ') }}</td>
              <td v-if="step > 0">{{ number(line.margin) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <button
        v-if="step < 4 && row.lines.length > 6"
        class="sp-sheet-link"
        @click="expanded = !expanded"
      >
        {{ expanded ? '收起记录' : `查看全部 ${row.lines.length} 条` }}
      </button></template
    >
    <p v-else class="pw-muted">所选平台在此范围暂无可计算盘口。</p>
    <div class="sp-split-actions">
      <button class="sp-secondary" :disabled="step === 0" @click="step--">上一步</button
      ><button class="sp-primary" :disabled="step === 6 || !row" @click="step++">
        {{ step === 6 ? '已完成' : '下一步' }}
      </button>
    </div>
  </div>
</template>
