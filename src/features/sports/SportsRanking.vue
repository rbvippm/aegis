<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight, Info, ArrowDown } from '@lucide/vue'
import { sportsRankings } from '@/mocks/sports'
const emit = defineEmits<{ explain: []; platform: [id: string] }>()
const metric = ref<'hold' | 'edge' | 'share'>('hold')
const names = { hold: '典型抽水', edge: '优势报价', share: '最优占比' }
const ranked = computed(() =>
  sportsRankings
    .filter((p) => p.status === 'active')
    .sort((a, b) =>
      metric.value === 'share' ? b.share! - a.share! : a[metric.value]! - b[metric.value]!,
    ),
)
</script>
<template>
  <div class="sp-ranking">
    <div class="sp-ranking-scope">足球 · 全场亚洲让球 · 近7天 · 相同覆盖赛事</div>
    <div class="sp-card sp-ranking-metric">
      <div class="sp-pill-tabs">
        <button
          v-for="(name, key) in names"
          :key="key"
          :class="{ active: metric === key }"
          :aria-pressed="metric === key"
          @click="metric = key"
        >
          {{ name }}
        </button>
      </div>
      <button class="sp-ranking-explain" @click="emit('explain')">
        {{
          metric === 'share'
            ? '取得最优报价的结果占比'
            : metric === 'hold'
              ? '抽水越低，报价成本通常越低'
              : '观察较低抽水分位的报价水平'
        }}<Info :size="15" />
      </button>
    </div>
    <div class="sp-section-title">
      <h2>平台赔率排名</h2>
      <span>{{ metric === 'share' ? '占比降序' : '抽水升序' }}<ArrowDown :size="13" /></span>
    </div>
    <article
      v-for="(row, index) in ranked"
      :key="row.id"
      class="sp-card sp-rank-row"
      :class="{ 'sp-rank-first': index === 0 }"
    >
      <span class="sp-rank-number">{{ index + 1 }}</span
      ><span class="sp-avatar" :class="`sp-avatar--${row.id}`">{{ row.id }}</span>
      <div class="sp-rank-main">
        <div>
          <h3>平台 {{ row.id }}</h3>
          <strong>{{ row[metric]?.toFixed(metric === 'share' ? 0 : 2) }}%</strong>
        </div>
        <div class="sp-rank-bar">
          <i
            :style="{
              width: `${metric === 'share' ? row.share : (1 - (row[metric] ?? 0) / 8) * 100}%`,
            }"
          ></i>
        </div>
        <p>{{ names[metric] }} · 共同样本 {{ row.samples }} 场</p>
        <div class="sp-rank-bottom">
          <span>最优报价占比 {{ row.share }}%</span
          ><button @click="emit('platform', row.id)">查看报价<ChevronRight :size="13" /></button>
        </div>
      </div>
    </article>
    <h3 class="sp-unranked-title">未参与排名</h3>
    <div
      v-for="row in sportsRankings.filter((p) => p.status !== 'active')"
      :key="row.id"
      class="sp-card sp-unranked"
    >
      <span class="sp-avatar" :class="`sp-avatar--${row.id}`">{{ row.id }}</span
      ><strong>平台 {{ row.id }}</strong
      ><span :class="{ 'sp-amber': row.status === 'stale' }">{{
        row.status === 'stale' ? '报价过期' : '样本不足'
      }}</span>
    </div>
    <p class="sp-small-note"><Info :size="14" />赔率排名与平台安全分分别展示</p>
  </div>
</template>
