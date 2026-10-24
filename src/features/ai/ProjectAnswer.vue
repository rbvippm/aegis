<script setup lang="ts">
import { BookOpen, ChevronRight, CircleAlert } from '@lucide/vue'
import type { ProjectReport, DetailPanel } from './conversation-types'
defineProps<{ report: ProjectReport }>()
const emit = defineEmits<{ detail: [panel: DetailPanel] }>()
</script>
<template>
  <div class="ac-project">
    <section class="ac-card ac-project-intro" :aria-label="report.title">
      <span class="ac-project-label">项目数据解读</span>
      <h2>{{ report.title }}</h2>
      <p class="ac-card-note">{{ report.scope }}</p>
      <p class="ac-prose">{{ report.takeaway }}</p>
    </section>
    <section class="ac-card" aria-label="分析理由">
      <h2>为什么这样看</h2>
      <div v-for="(reason, i) in report.reasons" :key="reason.title" class="ac-project-reason">
        <span>{{ String(i + 1).padStart(2, '0') }}</span>
        <div>
          <h3>{{ reason.title }}</h3>
          <p>{{ reason.text }}</p>
        </div>
      </div>
      <button class="ac-text-link" @click="emit('detail', 'analysis')">
        完整分析与依据<ChevronRight :size="16" />
      </button>
    </section>
    <section v-if="report.table" class="ac-card" :aria-label="report.table.title">
      <h2>{{ report.table.title }}</h2>
      <table class="ac-table ac-project-table">
        <caption class="ac-sr-only">
          {{
            report.table.title
          }}
        </caption>
        <thead>
          <tr>
            <th v-for="col in report.table.columns" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in report.table.rows" :key="index">
            <td v-for="(cell, j) in row" :key="j">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <section class="ac-card ac-plan" aria-label="内部推荐方案">
      <h2>内部推荐方案</h2>
      <ol class="ac-project-plan">
        <li v-for="step in report.plan" :key="step">{{ step }}</li>
      </ol>
      <div class="ac-project-actions">
        <RouterLink
          v-for="action in report.actions"
          :key="action.to"
          :to="action.to"
          class="ac-soft-button"
          >{{ action.label }}<ChevronRight :size="16"
        /></RouterLink>
      </div>
    </section>
    <div class="ac-warning">
      <CircleAlert :size="16" /><span>{{ report.caveat }}</span>
    </div>
    <button class="ac-text-link" @click="emit('detail', 'sources')">
      <BookOpen :size="16" />来源与更新时间<ChevronRight :size="16" />
    </button>
    <p class="ac-card-note">基于项目固定数据的 mock 分析；未连接真实模型和实时外部服务。</p>
  </div>
</template>
