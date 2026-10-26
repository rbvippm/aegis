<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Info, ShieldCheck, ArrowUpRight, Clock3 } from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import PlatformFollowButton from '@/features/monitoring/PlatformFollowButton.vue'
import { usePlatformFollows } from '@/features/monitoring/follows'
import { median } from '@/features/monitoring/activity'
import { money, dateLabel } from '@/features/monitoring/analytics-model'
import { withdrawalObservations } from '@/mocks/monitoring-withdrawals'
import { dataMode } from '@/shared/api/config'
import type { PlatformActivity } from '@/features/monitoring/activity'
import './funding.css'
const follows = usePlatformFollows()
const platforms = computed(() =>
  [...follows.catalog].sort(
    (a, b) => (b.score ?? -1) - (a.score ?? -1) || a.id.localeCompare(b.id),
  ),
)
const broadcast = computed(() =>
  [...follows.activities]
    .sort((a, b) => b.time - a.time || a.id.localeCompare(b.id))
    .flatMap((activity) => {
      const platform = platforms.value.find((p) => p.id === activity.platform)
      return platform ? [{ activity, platform }] : []
    })
    .slice(0, 20),
)
const selected = ref('')
const eventPlatform = computed(() => follows.catalog.find((p) => p.id === event.value?.platform))
const tickerMoney = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
const track = ref<HTMLElement>()
const index = computed(() =>
  Math.max(
    0,
    broadcast.value.findIndex((item) => item.activity.id === selected.value),
  ),
)
watch(
  () => broadcast.value.map((item) => item.activity.id).join(','),
  async () => {
    if (!broadcast.value.some((item) => item.activity.id === selected.value))
      selected.value = broadcast.value[0]?.activity.id ?? ''
    await nextTick()
    track.value?.scrollTo({ left: index.value * track.value.clientWidth, behavior: 'instant' })
  },
  { immediate: true },
)
function move(direction: number) {
  const length = broadcast.value.length
  if (length < 2 || !track.value) return
  const next = (index.value + direction + length) % length
  track.value.scrollTo({
    left: next * track.value.clientWidth,
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
function scrolled() {
  if (!track.value?.clientWidth) return
  const next = Math.round(track.value.scrollLeft / track.value.clientWidth)
  selected.value = broadcast.value[next]?.activity.id ?? selected.value
}
let drag: { id: number; x: number; y: number; left: number; horizontal: boolean } | null = null
let suppressClick = false
function dragStart(event: PointerEvent) {
  if (
    event.pointerType === 'touch' ||
    event.button !== 0 ||
    !track.value ||
    broadcast.value.length < 2 ||
    (event.target as HTMLElement).closest('a')
  )
    return
  drag = {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    left: track.value.scrollLeft,
    horizontal: false,
  }
  suppressClick = false
}
function dragMove(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId || !track.value) return
  const dx = event.clientX - drag.x,
    dy = event.clientY - drag.y
  if (!drag.horizontal) {
    if (Math.hypot(dx, dy) < 8) return
    if (Math.abs(dy) > Math.abs(dx)) {
      drag = null
      return
    }
    drag.horizontal = true
    track.value.setPointerCapture(event.pointerId)
  }
  suppressClick = true
  track.value.scrollTo({ left: drag.left - dx, behavior: 'instant' })
}
function dragEnd(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId || !track.value) return
  const origin = Math.round(drag.left / track.value.clientWidth)
  const direction = event.clientX - drag.x < 0 ? 1 : -1
  const next =
    Math.abs(event.clientX - drag.x) > 48 && event.type !== 'pointercancel'
      ? Math.max(0, Math.min(broadcast.value.length - 1, origin + direction))
      : origin
  drag = null
  track.value.scrollTo({ left: next * track.value.clientWidth, behavior: 'smooth' })
  window.setTimeout(() => {
    suppressClick = false
  }, 0)
}
function guardClick(event: MouseEvent) {
  if (suppressClick) {
    event.preventDefault()
    event.stopPropagation()
  }
}
const allEvents = computed(() =>
  follows.activities.filter((e) => platforms.value.some((p) => p.id === e.platform)),
)
const observations = computed(() =>
  withdrawalObservations.filter((o) => platforms.value.some((p) => p.id === o.platform)),
)
const metrics = computed<
  { title: string; icon: typeof ShieldCheck; stats: Omit<SummarySelection, 'ids' | 'scope'>[] }[]
>(() => [
  {
    title: '资金动态',
    icon: ArrowUpRight,
    stats: [
      {
        key: 'whale' as const,
        label: '大鳄提款',
        value: allEvents.value.filter((e) => e.kind === 'whale').length,
        unit: '笔',
        detail: '单笔出款 ≥ $100,000',
      },
      {
        key: 'movement' as const,
        label: '资金异动',
        value: allEvents.value.filter((e) => e.kind !== 'whale').length,
        unit: '笔',
        detail: '含热钱包转移与净流出预警',
      },
    ],
  },
  {
    title: '平台评级',
    icon: ShieldCheck,
    stats: [
      {
        key: 'purity' as const,
        label: 'S级出金纯净度',
        value: platforms.value.filter((p) => p.grade === 'S').length,
        unit: '家',
        detail: '近7天 · ≤3跳关联',
      },
      {
        key: 'score' as const,
        label: '盾牌分 ≥ 9',
        value: platforms.value.filter((p) => (p.score ?? 0) >= 9).length,
        unit: '家',
        detail: '独立评分 · 满分10分',
      },
    ],
  },
  {
    title: '实测出款效率',
    icon: Clock3,
    stats: [
      {
        key: 'small' as const,
        label: '小额中位数 ≤ 3分钟',
        value: observations.value.filter((o) => {
          const v = median(o.small)
          return v !== null && v <= 3
        }).length,
        unit: '家',
        detail: '小额 < 1,000 U',
      },
      {
        key: 'large' as const,
        label: '大额中位数 ≤ 10分钟',
        value: observations.value.filter((o) => {
          const v = median(o.large)
          return v !== null && v <= 10
        }).length,
        unit: '家',
        detail: '大额 ≥ 1,000 U',
      },
    ],
  },
])
type SummaryKey = 'whale' | 'movement' | 'purity' | 'score' | 'small' | 'large'
interface SummarySelection {
  key: SummaryKey
  label: string
  value: number
  unit: string
  detail: string
  ids: string[]
  scope: string
}
const summary = ref<SummarySelection | null>(null)
function openSummary(metric: Omit<SummarySelection, 'ids' | 'scope'>) {
  summary.value = {
    ...metric,
    ids: platforms.value.map((p) => p.id),
    scope: '全部平台',
  }
}
const summaryRows = computed(() => {
  const selection = summary.value
  if (!selection) return []
  return selection.ids.flatMap((id) => {
    const platform = follows.catalog.find((p) => p.id === id)
    if (!platform) return []
    const activity = follows.activities.filter(
      (e) =>
        e.platform === id && (selection.key === 'whale' ? e.kind === 'whale' : e.kind !== 'whale'),
    )
    const observation = withdrawalObservations.find((o) => o.platform === id)
    let stat = '',
      note = '',
      target = `/monitor?platform=${id}`
    if (selection.key === 'whale' || selection.key === 'movement') {
      if (!activity.length) return []
      stat = `${activity.length} 笔${selection.key === 'whale' ? '大额出款' : '资金异动'}`
      const total = activity.reduce((sum, e) => sum + (e.usd ?? 0), 0)
      note = `${total ? `已知转账金额 ${money(total)} · ` : ''}最近 ${dateLabel(activity[0]!.time, true)} UTC+8`
      target += `&event=${encodeURIComponent(activity[0]!.id)}`
    } else if (selection.key === 'purity') {
      if (platform.grade !== 'S') return []
      stat = `S级纯净度 · ${platform.taint ?? '—'}%`
      note = '近7天 · ≤3跳关联'
    } else if (selection.key === 'score') {
      if (platform.score === null || platform.score < 9) return []
      stat = `盾牌分 ${platform.score} / 10`
      note = '综合评分与出款速度分别核验'
    } else {
      const samples = selection.key === 'small' ? observation?.small : observation?.large
      const value = samples ? median(samples) : null
      if (value === null || value > (selection.key === 'small' ? 3 : 10)) return []
      stat = `${selection.key === 'small' ? '小额' : '大额'}中位数 ${value} 分钟`
      note = `${samples!.length} 笔已完成实测 · ${selection.detail}`
    }
    return [{ platform, stat, note, target }]
  })
})
const details = ref(false)
const event = ref<PlatformActivity | null>(null)
</script>
<template>
  <section class="hr-card hf-card" aria-label="平台出金监测">
    <StatePanel
      v-if="dataMode !== 'demo'"
      title="暂无监测数据"
      description="资金与出金服务尚未接入。"
    />
    <template v-else>
      <header class="hf-context">
        <p>
          <span>全部平台</span>
          <b>{{ platforms.length }}<small>家平台</small></b>
          <span class="hf-window">近7天</span>
        </p>
        <button aria-label="出金监测统计口径" @click="details = true">
          <span><Info :size="16" /></span>
        </button>
      </header>
      <div class="hf-summary" aria-label="出金监测汇总">
        <button
          v-for="metric in metrics.flatMap((group) => group.stats)"
          :key="metric.label"
          class="hf-summary-item"
          :class="`hf-summary-item--${metric.key}`"
          type="button"
          :aria-label="`查看${metric.label}明细，${metric.value}${metric.unit}`"
          aria-haspopup="dialog"
          @click="openSummary(metric)"
        >
          <span>{{
            metric.label.replace('中位数 ≤ ', ' ≤').replace('S级出金纯净度', 'S级纯净度')
          }}</span>
          <strong
            >{{ metric.value }}<small>{{ metric.unit }}</small></strong
          >
          <ChevronRight :size="14" />
        </button>
      </div>
      <div class="hf-dynamic-heading">
        <span>平台动态</span>
        <div class="hf-dynamic-controls">
          <div class="hf-pager" aria-label="平台动态切换">
            <button aria-label="上一条平台动态" :disabled="broadcast.length < 2" @click="move(-1)">
              <ChevronLeft :size="16" :stroke-width="2.5" />
            </button>
            <span class="hf-pager-count"
              ><b>{{ broadcast.length ? index + 1 : 0 }}</b> / {{ broadcast.length }}</span
            >
            <button aria-label="下一条平台动态" :disabled="broadcast.length < 2" @click="move(1)">
              <ChevronRight :size="16" :stroke-width="2.5" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref="track"
        class="hf-track"
        aria-label="平台动态内容"
        @scroll.passive="scrolled"
        @pointerdown="dragStart"
        @pointermove="dragMove"
        @pointerup="dragEnd"
        @pointercancel="dragEnd"
        @click.capture="guardClick"
      >
        <article
          v-for="{ activity: item, platform: p } in broadcast"
          :key="item.id"
          class="hf-pane"
          :aria-label="`${p.name}动态`"
          :inert="selected !== item.id"
        >
          <div class="hf-feed">
            <button
              class="hf-event"
              :class="`hf-event--${item.kind}`"
              :aria-label="`${p.name} · ${item.title} · ${item.usd === null ? '资金预警' : money(item.usd)}`"
              @click="event = item"
            >
              <span class="hf-event-mark" aria-hidden="true">
                <component :is="item.kind === 'whale' ? ArrowUpRight : ShieldCheck" :size="16" />
              </span>
              <span class="hf-event-copy">
                <small class="hf-event-kind">{{
                  item.kind === 'transfer' ? '钱包转移' : item.title
                }}</small>
                <span class="hf-platform-name" :title="p.name">{{ p.name }}</span>
              </span>
              <strong :class="{ 'hf-down': item.usd === null }">{{
                item.usd === null ? `${p.flowPercent ?? '—'}%` : tickerMoney(item.usd)
              }}</strong>
              <ChevronRight :size="16" />
            </button>
          </div>
          <footer class="hf-footer">
            <span>{{ dateLabel(item.time, true) }} UTC+8</span
            ><RouterLink :to="`/monitor?platform=${p.id}`"
              >查看平台详情<ChevronRight :size="14"
            /></RouterLink>
          </footer>
        </article>
      </div>
      <p v-if="!broadcast.length" class="hf-empty">暂无平台动态</p>
    </template>
  </section>
  <BottomDrawer
    :open="!!summary"
    :title="`${summary?.label ?? '监测'} · 平台明细`"
    @close="summary = null"
  >
    <div v-if="summary" class="hf-summary-drawer">
      <header class="hf-result-heading">
        <strong
          >{{ summary.value }}<small>{{ summary.unit }}</small></strong
        ><span>{{ summaryRows.length }} 家符合条件的平台</span>
      </header>
      <p class="hf-result-scope">
        打开时范围：{{ summary.scope }} · {{ summary.ids.length }} 家平台 · 近7天
      </p>
      <p class="hf-result-rule">
        {{ summary.detail
        }}{{ summary.key === 'small' || summary.key === 'large' ? ' · 按实测中位数统计' : '' }}
      </p>
      <div v-if="summaryRows.length" class="hf-results">
        <article
          v-for="row in summaryRows"
          :key="row.platform.id"
          class="hf-result"
          :aria-label="`${row.platform.name}指标明细`"
        >
          <div class="hf-result-platform">
            <span class="hf-avatar">{{
              row.platform.id.length <= 2 ? row.platform.id : row.platform.name.slice(-1)
            }}</span>
            <h3>{{ row.platform.name }}</h3>
            <PlatformFollowButton
              class="hf-follow"
              :id="row.platform.id"
              :name="row.platform.name"
            /><span class="hf-platform-score"
              ><ShieldCheck :size="15" /><b>{{ row.platform.score ?? '—' }}</b
              ><small v-if="row.platform.score !== null">/10</small></span
            >
          </div>
          <strong class="hf-result-stat">{{ row.stat }}</strong>
          <p>{{ row.note }}</p>
          <RouterLink :to="row.target" class="hf-result-link" @click="summary = null"
            >{{
              summary.key === 'whale' || summary.key === 'movement'
                ? '查看平台动态与来源'
                : '查看平台详情'
            }}<ChevronRight :size="16"
          /></RouterLink>
        </article>
      </div>
      <div v-else class="hf-result-empty">
        <ShieldCheck :size="28" />
        <h3>暂无符合条件的平台</h3>
        <p>当前统计范围内没有该指标的记录，缺失数据不计入。</p>
        <RouterLink to="/monitor" @click="summary = null"
          >查看全部平台<ChevronRight :size="15"
        /></RouterLink>
      </div>
    </div>
  </BottomDrawer>
  <BottomDrawer :open="details" title="出金监测 · 统计口径" @close="details = false"
    ><div class="hf-source">
      <h3>统一统计范围</h3>
      <p>
        统一展示全部平台，按盾牌分降序排列，暂无评分的平台排在末尾。关注仅用于接收异常提醒，不改变汇总、明细和动态轮播的范围；缺失数据不计入对应指标。
      </p>
      <h3>动态与评级</h3>
      <p>
        动态窗口为快照前7天。大鳄提款为单笔链上出款 ≥
        $100,000，不识别玩家身份。资金异动包含已标记钱包转移及余额净流出达到25%的快照预警，内部转账不计入出款额。
      </p>
      <p>S级指近7天出金纯净度等级；盾牌分采用10分制，两者分别统计。</p>
      <h3>出款中位数</h3>
      <p>
        按近7天已完成实测从申请到到账的分钟数计算，每个平台小额与大额分别5笔观测。它与平台卡片原有平均耗时口径不同，耗时不等同安全评级。
      </p>
      <p>当前快照：10/25 20:00 UTC+8。通知进入站内消息，不代表已接入实时链上推送。</p>
    </div></BottomDrawer
  >
  <BottomDrawer
    :open="!!event"
    :title="`${follows.catalog.find((p) => p.id === event?.platform)?.name ?? '平台'} · ${event?.title ?? '动态'}`"
    @close="event = null"
    ><div v-if="event" class="hf-source">
      <div v-if="eventPlatform" class="hf-event-platform">
        <span class="hf-platform-score"
          ><ShieldCheck :size="16" />盾牌分 <b>{{ eventPlatform.score ?? '—' }}</b
          ><small v-if="eventPlatform.score !== null">/10</small></span
        ><PlatformFollowButton
          class="hf-follow"
          :id="eventPlatform.id"
          :name="eventPlatform.name"
        />
      </div>
      <strong class="hf-event-amount">{{
        event.usd === null ? '资金预警' : money(event.usd)
      }}</strong>
      <p>{{ event.description }}</p>
      <p>
        {{ dateLabel(event.time, true) }} UTC+8 · {{ event.chain ?? '全链' }}
        {{ event.token ?? '' }}
      </p>
      <p v-if="event.wallet" class="hf-wallet">关联地址：{{ event.wallet }}</p>
      <RouterLink
        class="hf-detail-link"
        :to="`/monitor?platform=${event.platform}&event=${encodeURIComponent(event.id)}`"
        @click="event = null"
        >查看平台动态与来源<ChevronRight :size="16"
      /></RouterLink></div
  ></BottomDrawer>
</template>
