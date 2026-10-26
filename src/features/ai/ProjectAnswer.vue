<script setup lang="ts">
import { ref } from 'vue'
import { usePlatformFollows } from '@/features/monitoring/follows'
import { useProfile } from '@/features/profile/store'
import { dataMode } from '@/shared/api/config'
import { BookOpen, ChevronRight, CircleAlert } from '@lucide/vue'
import type { ProjectReport, DetailPanel, ProjectCommand } from './conversation-types'
defineProps<{ report: ProjectReport }>()
const follows = usePlatformFollows()
const profile = useProfile()
const taskStatus = ref('')
function execute(command: ProjectCommand) {
  if (dataMode !== 'demo') {
    taskStatus.value = '暂时无法办理，请稍后重试。'
    return
  }
  if (command.kind === 'read-platform') {
    const unread = profile.notices.filter((n) => n.type === 'platform' && !n.read)
    unread.forEach((n) => {
      n.read = true
    })
    taskStatus.value = unread.length
      ? `已将 ${unread.length} 条平台消息标为已读。`
      : '当前没有未读的平台消息。'
    return
  }
  const platform = follows.catalog.find((p) => p.id === command.platform)
  if (!platform) {
    taskStatus.value = '找不到该平台，请重新选择。'
    return
  }
  const wanted = command.kind === 'follow'
  if (follows.ids.includes(platform.id) !== wanted) follows.toggle(platform.id)
  taskStatus.value = wanted
    ? `已关注${platform.name}。${profile.preferences.platform ? '异常动态可在消息中心查看。' : '平台通知当前已关闭，可在“我的”通知偏好中开启。'}`
    : `已取消关注${platform.name}，保留历史消息。`
}
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
    <section
      v-if="report.recommendations?.length"
      class="ac-card ac-recommendations"
      aria-label="推荐候选"
    >
      <h2>优先了解的平台</h2>
      <article
        v-for="candidate in report.recommendations"
        :key="candidate.platform"
        class="ac-candidate"
      >
        <header>
          <h3>{{ candidate.name }}</h3>
          <span>{{ candidate.badge }}</span>
        </header>
        <dl>
          <div v-for="fact in candidate.facts" :key="fact.label">
            <dt>{{ fact.label }}</dt>
            <dd>{{ fact.value }}</dd>
          </div>
        </dl>
        <p>{{ candidate.reason }}</p>
        <RouterLink :to="candidate.to">查看详情与数据依据<ChevronRight :size="16" /></RouterLink>
      </article>
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
    <section
      v-if="report.commands?.length"
      class="ac-card ac-business-tasks"
      aria-label="可办理事项"
    >
      <h2>可办理事项</h2>
      <p class="ac-card-note">确认目标后点击执行，结果显示在下方。</p>
      <button
        v-for="(command, index) in report.commands"
        :key="index"
        class="ac-soft-button"
        @click="execute(command)"
      >
        {{ command.label }}<ChevronRight :size="16" />
      </button>
      <p v-if="taskStatus" class="ac-task-status" role="status">{{ taskStatus }}</p>
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

<style scoped>
.ac-business-tasks button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  margin-top: 8px;
  padding: 10px 12px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 14px;
  background: #fff;
  color: var(--ae-highlight);
  font-size: 14px;
  text-align: left;
}
.ac-task-status {
  font-size: 13px;
  color: var(--ae-text);
  line-height: 1.7;
}
.ac-candidate {
  padding: 12px 0;
  border-bottom: 1px solid var(--ae-border, #d7e6f8);
}
.ac-candidate:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}
.ac-candidate header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ac-candidate h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  color: var(--ae-text);
}
.ac-candidate header > span {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 8px;
  background: #e7f2ff;
  font-size: 12px;
  color: var(--ae-highlight);
}
.ac-candidate dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}
.ac-candidate dl > div {
  padding: 8px 10px;
  border-radius: 12px;
  background: #f5f8ff;
  min-width: 0;
}
.ac-candidate dt {
  font-size: 12px;
  color: var(--ae-muted);
}
.ac-candidate dd {
  margin: 5px 0 0;
  font-size: 17px;
  font-weight: 650;
  color: var(--ae-text);
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.ac-candidate p {
  margin: 8px 0;
  color: var(--ae-muted);
  font-size: 13px;
  line-height: 1.8;
}
.ac-candidate > a {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 44px;
  color: var(--ae-highlight);
  font-size: 13px;
  text-decoration: none;
}
</style>
