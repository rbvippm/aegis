<script setup lang="ts">
import { rebatePercent } from '@/features/rewards/rebate'
import PlatformFollowButton from '@/features/monitoring/PlatformFollowButton.vue'
import { usePlatformFollows } from '@/features/monitoring/follows'
import { dateLabel } from '@/features/monitoring/analytics-model'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  Info,
  Sparkles,
  ChartColumn,
  Wallet,
  FileText,
  Copy,
  Check,
} from '@lucide/vue'
import ResearchAnalytics from '@/features/monitoring/ResearchAnalytics.vue'
import { money, count, percent, change } from '@/features/monitoring/analytics-model'
import type { AnalyticsScope } from '@/features/monitoring/ResearchAnalytics.vue'
import ResearchPlatformCard from '@/features/monitoring/ResearchPlatformCard.vue'
import type { ResearchPlatform } from '@/features/monitoring/research'
import { analyticsCatalog } from '@/mocks/monitoring-analytics'
import { researchSnapshot } from '@/mocks/monitoring-research'
import { monitoringPlatforms as researchPlatforms } from '@/mocks/monitoring-platforms'
import { dataMode } from '@/shared/api/config'
import StatePanel from '@/shared/ui/StatePanel.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'

const route = useRoute()
const platformFollows = usePlatformFollows()
const analytics = ref<InstanceType<typeof ResearchAnalytics>>()
const scope = ref<AnalyticsScope>({
  snapshot: researchSnapshot,
  period: '30d',
  ids: ['A', 'B', 'C'],
  values: {},
})
const hasUnratedScope = computed(() =>
  scope.value.ids.some((id) => !researchPlatforms.some((p) => p.id === id)),
)
const window = computed(() =>
  ['24h', '7d', '30d'].includes(scope.value.period)
    ? (scope.value.period as '24h' | '7d' | '30d')
    : '30d',
)
const search = ref('')
const grade = ref('')
const completeOnly = ref(false)
const sort = ref('score')
const ascending = ref(false)
const platformLimit = ref(10)
watch(
  [search, grade, completeOnly, () => scope.value.period, () => scope.value.ids.join(',')],
  () => {
    platformLimit.value = 10
  },
)
function matchesPlatform(platform: ResearchPlatform) {
  return (
    platform.name.toLowerCase().includes(search.value.trim().toLowerCase()) &&
    scope.value.ids.includes(platform.id) &&
    (!grade.value || platform.grade === grade.value) &&
    (!completeOnly.value || platform.score !== null)
  )
}
function withScope(platform: ResearchPlatform): ResearchPlatform {
  const value = scope.value.values[platform.id]
  if (!value) return platform
  return {
    ...platform,
    wallet: value.wallet,
    flow: value.flow,
    flowPercent: value.flowPercent,
    windows: {
      ...platform.windows,
      [window.value]: {
        deposit: value.deposit,
        amount: value.amount,
        change: value.change ?? 0,
      },
    },
  }
}
const visiblePlatforms = computed(() => {
  const known = researchPlatforms.map(withScope).filter(matchesPlatform)
  const extras = scope.value.ids.flatMap((id) => {
    if (researchPlatforms.some((item) => item.id === id)) return []
    const meta = analyticsCatalog.find((item) => item.id === id)
    const value = scope.value.values[id]
    if (!meta || !value) return []
    const blank = { deposit: '—', amount: 0, change: 0 }
    const platform: ResearchPlatform = {
      id,
      name: meta.name,
      score: null,
      chains: [],
      grade: null,
      taint: null,
      wallet: value.wallet,
      flow: value.flow,
      flowPercent: value.flowPercent,
      samples: 0,
      smallMinutes: null,
      largeMinutes: null,
      commission: null,
      playerShare: null,
      windows: {
        '24h': { ...blank },
        '7d': { ...blank },
        '30d': { ...blank },
        [window.value]: {
          deposit: value.deposit,
          amount: value.amount,
          change: value.change ?? 0,
        },
      },
    }
    return matchesPlatform(platform) ? [platform] : []
  })
  const numericValue = (p: ResearchPlatform) => {
    if (sort.value === 'score') return p.score
    if (sort.value === 'rebate') return rebatePercent(p.commission, p.playerShare)
    const value = scope.value.values[p.id]
    if (!value) return null
    return sort.value === 'deposit'
      ? value.amount
      : sort.value === 'withdrawal'
        ? value.withdrawals
        : sort.value === 'net'
          ? value.net
          : value.balance
  }
  return [...known, ...extras].sort((a, b) => {
    const av = numericValue(a),
      bv = numericValue(b)
    if (av === null) return bv === null ? a.name.localeCompare(b.name, 'zh-CN') : 1
    if (bv === null) return -1
    return (ascending.value ? 1 : -1) * (av - bv) || a.name.localeCompare(b.name, 'zh-CN')
  })
})
type Panel = { kind: string; platform?: ResearchPlatform; scroll?: number; focus?: string }
const panel = ref<Panel | null>(null)
const panelVisible = ref(false)
const panelBody = ref<HTMLElement>()
const balancesExpanded = ref(false)
const detailSections = ref<Record<string, boolean>>({})
const panelHistory = ref<Panel[]>([])
let pendingEvidence: { id: string; kind: string } | null = null
let evidenceParent: Panel | null = null
const overview = computed(() =>
  panel.value?.platform ? analytics.value?.platformOverview(panel.value.platform.id) : null,
)
const detailMetrics = computed(() => {
  const r = overview.value
  return r
    ? [
        ['存款额', money(r.deposits)],
        ['出款额', money(r.withdrawals)],
        ['净流量', money(r.net)],
        ['热钱包余额', money(r.balance)],
      ]
    : []
})
const transactionMetrics = computed(() => {
  const r = overview.value
  return r
    ? [
        ['存款笔数', count(r.depositCount)],
        ['出款笔数', count(r.withdrawalCount)],
        ['平均单笔存款', money(r.averageDeposit)],
        ['平均单笔出款', money(r.averageWithdrawal)],
        ['最大单笔存款', money(r.largestDeposit)],
        ['最大单笔出款', money(r.largestWithdrawal)],
        ['范围内存款占比', r.share == null ? '—' : `${r.share.toFixed(1)}%`],
        ['余额变化', percent(r.balanceGrowth)],
      ]
    : []
})
const walletMetrics = computed(() => {
  const r = overview.value
  return r
    ? [
        ['独立存款钱包', count(r.uniqueDepositors)],
        ['独立出款钱包', count(r.uniqueWithdrawers)],
        ['新增存款钱包', count(r.newDepositors)],
        ['新增出款钱包', count(r.newWithdrawers)],
      ]
    : []
})
const scopeRanks = computed(() => {
  const platform = panel.value?.platform
  const list = visiblePlatforms.value
  const current = platform ? list.find((item) => item.id === platform.id) : undefined
  const metricValue = (
    item: ResearchPlatform,
    key: 'score' | 'deposit' | 'net' | 'balance',
  ): number | null => {
    if (key === 'score') return item.score
    const value = scope.value.values[item.id]
    if (!value) return null
    return key === 'deposit' ? value.amount : key === 'net' ? value.net : value.balance
  }
  const place = (key: 'score' | 'deposit' | 'net' | 'balance') => {
    if (!current || metricValue(current, key) === null) return null
    const ordered = [...list].sort((a, b) => {
      const av = metricValue(a, key)
      const bv = metricValue(b, key)
      if (av === null) return bv === null ? a.name.localeCompare(b.name, 'zh-CN') : 1
      if (bv === null) return -1
      return bv - av || a.name.localeCompare(b.name, 'zh-CN')
    })
    const index = ordered.findIndex((item) => item.id === current.id)
    return index < 0 ? null : index + 1
  }
  const peak = overview.value
  return {
    total: list.length,
    scoreRank: place('score'),
    items: [
      { label: '盾牌分', rank: place('score'), peak: null },
      {
        label: '存款额',
        rank: place('deposit'),
        peak: peak?.depositPeak
          ? {
              label: '存款高点日',
              date: peak.depositPeak.date,
              amount: money(peak.depositPeak.deposits),
            }
          : null,
      },
      {
        label: '净流量',
        rank: place('net'),
        peak: peak?.netPeak
          ? {
              label: '净流入高点日',
              date: peak.netPeak.date,
              amount: money(peak.netPeak.net),
            }
          : null,
      },
      { label: '热钱包余额', rank: place('balance'), peak: null },
    ],
  }
})
const copiedWalletKey = ref('')
const copyStatus = ref('')
let copyTimer: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(copyTimer))
async function copyWalletAddress(address: string, key: string) {
  let ok = false
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
    await navigator.clipboard.writeText(address)
    ok = true
  } catch {
    try {
      const field = document.createElement('textarea')
      field.value = address
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      const host = document.querySelector('dialog[open]') ?? document.body
      host.append(field)
      field.focus()
      field.select()
      field.setSelectionRange(0, address.length)
      ok = document.execCommand('copy')
      field.remove()
    } catch {
      ok = false
    }
  }
  copiedWalletKey.value = ok ? key : ''
  copyStatus.value = ok ? '已复制' : '复制失败，请长按文本手动复制'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => {
    copiedWalletKey.value = ''
    copyStatus.value = ''
  }, 1600)
}
const evidenceKinds = [
  '深度分析',
  '存款流水',
  '出款流水',
  '大额存款',
  '大额出款',
  '资金异动',
  '地址清单',
  '数据来源',
]
let returnToCompare = false
function openCard(kind: string, platform: ResearchPlatform) {
  returnToCompare = false
  open(kind, platform)
}
function openPlatformDetail(id: string, fromCompare = false) {
  returnToCompare = fromCompare
  const platform = visiblePlatforms.value.find((p) => p.id === id)
  if (platform) open('详情', platform)
}
function capturePanel(): Panel | null {
  if (!panel.value) return null
  return {
    ...panel.value,
    scroll: panelBody.value?.closest('.ae-drawer__body')?.scrollTop ?? 0,
    focus:
      document.activeElement instanceof HTMLElement
        ? document.activeElement.textContent?.trim()
        : undefined,
  }
}
async function restorePanel(value: Panel, reopen = true) {
  panel.value = value
  panelVisible.value = reopen
  await nextTick()
  await nextTick()
  panelBody.value?.closest('.ae-drawer__body')?.scrollTo({ top: value.scroll ?? 0 })
  const target = [...(panelBody.value?.querySelectorAll<HTMLElement>('button, a') ?? [])].find(
    (el) => el.textContent?.trim() === value.focus,
  )
  target?.focus({ preventScroll: true })
}
function returnFromEvidence() {
  if (!evidenceParent) return
  const value = evidenceParent
  evidenceParent = null
  void restorePanel(value)
}
function back() {
  const previous = panelHistory.value.pop()
  if (previous) void restorePanel(previous)
}
const uid = ref('')
const report = ref('')
const feedback = ref('')
function open(kind: string, platform?: ResearchPlatform) {
  if (platform && evidenceKinds.includes(kind) && analytics.value) {
    if (panel.value) {
      evidenceParent = capturePanel()
      pendingEvidence = { id: platform.id, kind }
      panelVisible.value = false
    } else analytics.value.showPlatformEvidence(platform.id, kind)
    return
  }
  if (kind === '详情' && !panel.value) {
    balancesExpanded.value = false
    detailSections.value = {}
  }
  const currentPanel = capturePanel()
  if (currentPanel) panelHistory.value.push(currentPanel)
  panel.value = { kind, platform }
  panelVisible.value = true
  uid.value = ''
  report.value = ''
  feedback.value = ''
}
async function close() {
  panelVisible.value = false
  if (pendingEvidence) {
    const request = pendingEvidence
    pendingEvidence = null
    panel.value = null
    if (request.kind === '深度分析') analytics.value?.showPlatformAnalysis(request.id)
    else analytics.value?.showPlatformEvidence(request.id, request.kind, true)
    return
  }
  const previous = panelHistory.value.pop()
  if (previous) {
    await nextTick()
    await restorePanel(previous)
  } else {
    panel.value = null
    if (returnToCompare) {
      returnToCompare = false
      analytics.value?.openCompare()
    }
  }
}
function resetFilters() {
  grade.value = ''
  completeOnly.value = false
  search.value = ''
}
function submitDemo() {
  feedback.value = panel.value?.kind === '绑定 UID' ? 'UID 已校验。' : '异常说明已提交。'
}
watch(
  () => route.fullPath,
  () => {
    if (dataMode !== 'demo') return
    const platform = platformFollows.catalog.find((item) => item.id === route.query.platform)
    if (platform) {
      open('详情', platform)
      if (route.query.event) open('资金动态', platform)
      else if (route.query.panel === 'flow') open('异动详情', platform)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="monitor-research">
    <template v-if="dataMode === 'demo'">
      <ResearchAnalytics
        ref="analytics"
        :search="search"
        :grade="grade"
        :complete-only="completeOnly"
        @scope="scope = $event"
        @platform-detail="openPlatformDetail"
        @evidence-close="returnFromEvidence"
        @reset="resetFilters"
        @update:grade="grade = $event"
        @update:complete-only="completeOnly = $event"
      >
        <template #filter-result="{ hasResults }"
          ><p class="research-filter-result" role="status">
            筛选结果 <strong>{{ hasResults ? visiblePlatforms.length : 0 }}</strong> 家平台
          </p></template
        >
        <template #platforms>
          <div class="research-list-heading">
            <GlassSelect
              class="research-period-select"
              :model-value="scope.period"
              label="统计时间范围"
              @update:model-value="analytics?.setOverviewPeriod($event)"
            >
              <option value="24h">近24小时</option>
              <option value="7d">近7天</option>
              <option value="30d">近30天</option>
              <option value="90d">近90天</option>
              <option value="365d">近365天</option>
            </GlassSelect>
            <div class="research-sort-controls">
              <GlassSelect v-model="sort" label="平台排序"
                ><option value="score">盾牌分</option>
                <option value="deposit">存款额</option>
                <option value="withdrawal">出款额</option>
                <option value="net">净流量</option>
                <option value="balance">热钱包余额</option>
                <option value="rebate">返利优势</option></GlassSelect
              >
              <button
                class="research-sort-direction"
                :aria-label="ascending ? '切换为降序' : '切换为升序'"
                @click="ascending = !ascending"
              >
                <ArrowUp v-if="ascending" :size="18" /><ArrowDown v-else :size="18" />
              </button>
            </div>
          </div>
          <div class="research-platforms">
            <ResearchPlatformCard
              v-for="(platform, index) in visiblePlatforms.slice(0, platformLimit)"
              :key="platform.id"
              :platform="platform"
              :window="window"
              :period-label="scope.period"
              :snapshot="scope.snapshot"
              :growth="scope.values[platform.id]?.change"
              :share="scope.values[platform.id]?.share ?? null"
              :rank="platform.score === null && !platform.wallet ? undefined : index + 1"
              @open="openCard"
            />
            <div v-if="!visiblePlatforms.length" class="research-empty">
              <StatePanel
                :title="hasUnratedScope ? '当前范围暂无评级样本' : '暂无匹配平台'"
                :description="
                  hasUnratedScope
                    ? '评分、纯净度与耗时需要独立评级样本。'
                    : '试试其他平台名称、公链或纯净度条件。'
                "
              /><button v-if="!hasUnratedScope" @click="resetFilters">重置筛选</button>
            </div>
          </div>
          <button
            v-if="visiblePlatforms.length > 10"
            class="ma-secondary ma-platform-expand"
            :aria-expanded="platformLimit > 10"
            @click="platformLimit = platformLimit === 10 ? visiblePlatforms.length : 10"
          >
            {{
              platformLimit === 10 ? `展开全部平台（${visiblePlatforms.length}）` : '收起平台卡片'
            }}
          </button>
        </template>
      </ResearchAnalytics>
    </template>
    <StatePanel v-else title="暂无监测数据" description="稍后再查看链上监测与平台研究。" />

    <BottomDrawer
      :open="panelVisible"
      :title="panel?.platform ? `${panel.platform.name} · ${panel.kind}` : (panel?.kind ?? '')"
      close-label="关闭弹窗"
      @close="close"
    >
      <template v-if="panel">
        <div
          ref="panelBody"
          class="research-sheet__body"
          :class="{ 'research-sheet__body--detail': panel.kind === '详情' }"
        >
          <button v-if="panelHistory.length" class="research-detail-back" @click="back">
            <ChevronLeft :size="16" />返回上一级
          </button>
          <template v-if="panel.kind === '绑定 UID'">
            <p>额外返水为渠道佣金中的玩家分成，并非投注额返还比例。资格与结算以平台规则为准。</p>
            <form @submit.prevent="submitDemo">
              <label class="research-field"
                >{{ panel.platform?.name }} UID<input
                  v-model="uid"
                  required
                  maxlength="64"
                  pattern="[A-Za-z0-9_-]{3,64}"
                  placeholder="输入 UID，至少3位字母或数字"
                  autocomplete="off"
              /></label>
              <button class="research-primary" type="submit">校验</button>
            </form>
          </template>
          <template v-else-if="panel.kind === '上报异常'">
            <p>请描述金额、提币申请时间及异常情况，不要填写助记词或私钥。</p>
            <form @submit.prevent="submitDemo">
              <label class="research-field"
                >异常说明<textarea
                  v-model="report"
                  required
                  minlength="5"
                  maxlength="1000"
                  rows="4"
                  placeholder="例如：申请出款后尚未到账……"
                ></textarea></label
              ><button class="research-primary" type="submit">提交</button>
            </form>
          </template>
          <template v-else-if="panel.kind === '出金安全体检卡'">
            <div
              class="research-inspection"
              :class="{ warning: panel.platform?.grade === 'B', unknown: !panel.platform?.grade }"
            >
              <ShieldCheck :size="42" /><strong
                >{{ panel.platform?.grade ?? '待检测'
                }}{{ panel.platform?.grade ? '级' : '' }}</strong
              ><span
                >污染占比 {{ panel.platform?.taint ?? '暂无数据'
                }}{{ panel.platform?.taint == null ? '' : '%' }}</span
              >
            </div>
            <p>
              统计近7天热钱包流入中，与黑客、电诈、混币器标记地址 ≤3
              跳关联的污染占比。不代表交易所放行或资金安全承诺。
            </p>
            <button class="research-sheet-link" @click="open('评级口径与来源', panel.platform)">
              查看评级口径 <ChevronRight :size="15" />
            </button>
          </template>
          <template v-else-if="panel.kind === '异动详情'">
            <p>
              {{ panel.platform?.name }} · {{ scope.period }} 净流量
              {{ panel.platform?.flow ?? '暂无数据' }}。
            </p>
            <p>当前范围的逐笔依据可在“资金流水”中查看。资金变化不等同于平台安全评级。</p>
          </template>
          <template v-else-if="panel.kind === '评级口径与来源' || panel.kind === '评分依据'">
            <section class="research-reading-card">
              <h3>盾牌分构成</h3>
              <div class="research-rating-weights">
                <div
                  v-for="[label, weight] in [
                    ['储备充足率', '40%'],
                    ['出金纯净度', '30%'],
                    ['客诉解决率', '30%'],
                  ]"
                  :key="label"
                >
                  <strong>{{ weight }}</strong
                  ><span>{{ label }}</span>
                </div>
              </div>
              <p>分项归一化后计算。独立评分，赞助不影响排名。</p>
              <p>
                储备充足率须结合可核验负债，不能仅用热钱包余额替代；客诉解决率须有真实工单及解决口径。
              </p>
            </section>
            <section class="research-reading-card">
              <h3>纯净度分级</h3>
              <dl class="research-detail-list">
                <div
                  v-for="[grade, range] in [
                    ['S级', '＜0.5%'],
                    ['A级', '0.5%–＜2%'],
                    ['B级', '2%–5%'],
                    ['C级', '＞5%'],
                  ]"
                  :key="grade"
                >
                  <dt>{{ grade }}</dt>
                  <dd>{{ range }}</dd>
                </div>
              </dl>
              <p>缺失、过期或样本不足的数据不参与评分。</p>
            </section>
            <section class="research-reading-card">
              <h3>耗时与资金口径</h3>
              <p>
                耗时为申请至到账的平均值，资产为 USDT。小额 ＜1,000U，大额
                ＞10,000U；中间金额不计入这两档。耗时不等同于安全评级。
              </p>
              <p>
                24h 图表按小时汇总；7d、30d、90d 按日；365d 按周。资金统计剔除内部冷热钱包互转。
              </p>
            </section>
          </template>
          <template v-else-if="panel.kind === '地址清单'">
            <p>覆盖链：{{ panel.platform?.chains.join('、') }}。</p>
          </template>
          <template v-else-if="panel.kind === '历史评测'"
            ><div class="research-detail-empty">
              <FileText :size="26" /><strong>暂无历史评测</strong>
              <p>当前平台尚无可展示的历史评测记录。</p>
            </div></template
          >
          <template v-else-if="panel.kind === '资金动态'">
            <p class="research-activity-note">
              近7天 · 大额出款 ≥ $100,000；热钱包转移不计入出款额。链上出款不直接代表玩家身份。
            </p>
            <article
              v-for="event in platformFollows.activities.filter(
                (e) => e.platform === panel?.platform?.id,
              )"
              :key="event.id"
              class="research-activity"
              :class="{ 'research-activity--selected': route.query.event === event.id }"
            >
              <header>
                <strong>{{ event.title }}</strong
                ><b>{{ event.usd === null ? '余额预警' : money(event.usd) }}</b>
              </header>
              <p>
                {{ dateLabel(event.time, true) }} UTC+8 · {{ event.chain ?? '全链' }}
                {{ event.token ?? '' }}
              </p>
              <p>{{ event.description }}</p>
              <div v-if="event.wallet" class="research-activity-address">
                <code>{{ event.wallet }}</code>
                <button
                  type="button"
                  class="research-address-copy"
                  :data-copied="copiedWalletKey === `event:${event.id}` ? 'true' : undefined"
                  :aria-label="
                    copiedWalletKey === `event:${event.id}`
                      ? `已复制钱包地址 ${event.wallet}`
                      : `复制钱包地址 ${event.wallet}`
                  "
                  @click="event.wallet && copyWalletAddress(event.wallet, `event:${event.id}`)"
                >
                  <Check
                    v-if="copiedWalletKey === `event:${event.id}`"
                    :size="16"
                    aria-hidden="true"
                  /><Copy v-else :size="16" aria-hidden="true" />
                </button>
              </div>
            </article>
            <p
              v-if="!platformFollows.activities.some((e) => e.platform === panel?.platform?.id)"
              class="research-activity-note"
            >
              当前窗口暂无符合阈值的资金动态。
            </p>
            <button class="research-detail-link" @click="open('出款流水', panel.platform)">
              查看资金流水与来源<ChevronRight :size="16" />
            </button>
          </template>
          <template v-else-if="panel.kind === '详情'">
            <div v-if="panel.platform" class="research-detail-follow">
              <span>关注后，异常动态进入消息中心</span
              ><PlatformFollowButton :id="panel.platform.id" :name="panel.platform.name" />
            </div>
            <button class="research-detail-link" @click="open('资金动态', panel.platform)">
              <span
                >资金动态 ·
                {{
                  platformFollows.activities.filter((e) => e.platform === panel?.platform?.id)
                    .length
                }}
                条</span
              ><ChevronRight :size="16" />
            </button>
            <div class="research-detail-hero">
              <div class="research-detail-rating">
                <span><ShieldCheck :size="16" />盾牌分</span
                ><strong
                  >{{ panel.platform?.score ?? '—'
                  }}<small v-if="panel.platform?.score != null">/10</small></strong
                >
              </div>
              <span class="research-detail-status">{{
                panel.platform?.score == null ? '暂无完整评级' : '独立评测'
              }}</span>
              <p>{{ scope.period }} 资金范围<span>·</span>{{ scope.snapshot }}</p>
            </div>
            <div class="research-detail-actions">
              <button class="research-primary" @click="open('深度分析', panel.platform)">
                <ChartColumn :size="17" />深度分析
              </button>
              <RouterLink
                class="research-detail-ai"
                aria-label="让 AI 解读平台数据"
                :to="{
                  path: '/ai',
                  query: {
                    analyze: '1',
                    q: `解读${panel.platform?.name}的盾牌分、热钱包、纯净度与出金评级；${scope.period}；${scope.chains?.join('/') ?? '全部公链'}；${scope.tokens?.map((t) => `币种${t}`).join('/') ?? '全部币种'}`,
                  },
                }"
                ><Sparkles :size="17" />AI 解读</RouterLink
              >
            </div>
            <template v-if="overview">
              <section class="research-detail-section research-detail-funds">
                <h3>资金概览</h3>
                <dl class="research-detail-metrics research-detail-key-metrics">
                  <div v-for="[label, value] in detailMetrics" :key="label">
                    <dt>{{ label }}</dt>
                    <dd
                      :class="
                        label === '净流量'
                          ? overview.net < 0
                            ? 'research-negative'
                            : 'research-positive'
                          : ''
                      "
                    >
                      {{ value }}
                    </dd>
                  </div>
                </dl>
                <p class="research-detail-growth">
                  存款变化
                  <b
                    :class="
                      overview.deposits - overview.before.deposits < 0
                        ? 'research-negative'
                        : 'research-positive'
                    "
                    >{{ percent(change(overview.deposits, overview.before.deposits)) }}</b
                  ><span>较前一等长窗口</span>
                </p>
                <div class="research-detail-shortcuts">
                  <button
                    v-for="kind in ['存款流水', '出款流水', '资金异动']"
                    :key="kind"
                    @click="open(kind, panel.platform)"
                  >
                    {{ kind }}<ChevronRight :size="13" />
                  </button>
                </div>
                <details
                  class="research-detail-inline"
                  :open="detailSections.transactions"
                  @toggle="detailSections.transactions = ($event.target as HTMLDetailsElement).open"
                >
                  <summary>交易统计<ChevronRight :size="16" /></summary>
                  <dl class="research-detail-metrics">
                    <div v-for="[label, value] in transactionMetrics" :key="label">
                      <dt>{{ label }}</dt>
                      <dd>{{ value }}</dd>
                    </div>
                  </dl>
                  <div class="research-detail-shortcuts">
                    <button @click="open('大额存款', panel.platform)">
                      大额存款<ChevronRight :size="13" /></button
                    ><button @click="open('大额出款', panel.platform)">
                      大额出款<ChevronRight :size="13" />
                    </button>
                  </div>
                </details>
              </section>
              <details
                class="research-detail-section research-detail-group"
                :open="detailSections.wallet"
                @toggle="detailSections.wallet = ($event.target as HTMLDetailsElement).open"
              >
                <summary>
                  <span class="research-detail-mark" aria-hidden="true"><Wallet :size="18" /></span
                  ><span
                    >钱包与链上资产<small
                      ><b>{{ count(overview.uniqueDepositors) }}</b> 个独立存款钱包</small
                    ></span
                  ><ChevronRight :size="16" />
                </summary>
                <div class="research-detail-group-body">
                  <dl class="research-detail-metrics">
                    <div v-for="[label, value] in walletMetrics" :key="label">
                      <dt>{{ label }}</dt>
                      <dd>{{ value }}</dd>
                    </div>
                  </dl>
                  <details
                    class="research-detail-inline"
                    :open="balancesExpanded"
                    @toggle="balancesExpanded = ($event.target as HTMLDetailsElement).open"
                  >
                    <summary>公链与币种余额<ChevronRight :size="16" /></summary>
                    <dl class="research-detail-list">
                      <div
                        v-for="balance in overview.balances"
                        :key="`${balance.chain}:${balance.token}`"
                      >
                        <dt>{{ balance.chain }} · {{ balance.token }}</dt>
                        <dd>{{ money(balance.usd) }}</dd>
                      </div>
                    </dl>
                  </details>
                  <h4>主要存款地址</h4>
                  <dl class="research-detail-list">
                    <div
                      v-for="wallet in overview.topWallets"
                      :key="`${wallet.chain}:${wallet.wallet}`"
                    >
                      <dt class="research-detail-address" :title="wallet.wallet">
                        <span>{{ wallet.chain }} · {{ wallet.wallet }}</span>
                        <button
                          type="button"
                          class="research-address-copy"
                          :data-copied="
                            copiedWalletKey === `${wallet.chain}:${wallet.wallet}`
                              ? 'true'
                              : undefined
                          "
                          :aria-label="
                            copiedWalletKey === `${wallet.chain}:${wallet.wallet}`
                              ? `已复制钱包地址 ${wallet.wallet}`
                              : `复制钱包地址 ${wallet.wallet}`
                          "
                          @click="
                            copyWalletAddress(wallet.wallet, `${wallet.chain}:${wallet.wallet}`)
                          "
                        >
                          <Check
                            v-if="copiedWalletKey === `${wallet.chain}:${wallet.wallet}`"
                            :size="16"
                            aria-hidden="true"
                          /><Copy v-else :size="16" aria-hidden="true" />
                        </button>
                      </dt>
                      <dd>{{ money(wallet.amount) }}</dd>
                    </div>
                  </dl>
                  <button
                    class="research-sheet-link"
                    aria-label="地址清单"
                    @click="open('地址清单', panel.platform)"
                  >
                    查看全部地址<ChevronRight :size="16" />
                  </button>
                  <p class="research-sheet-note">
                    金额分布、新增与回访和存款频次在深度分析中统一查看。
                  </p>
                </div>
              </details>
            </template>
            <div v-else class="research-detail-empty">
              <Info :size="22" /><strong>当前范围暂无可统计样本</strong>
              <p>可查看评测资料，或调整公链、币种和平台范围。</p>
            </div>
            <details
              class="research-detail-section research-detail-group"
              :open="detailSections.safety"
              @toggle="detailSections.safety = ($event.target as HTMLDetailsElement).open"
            >
              <summary>
                <span class="research-detail-mark" aria-hidden="true"
                  ><ShieldCheck :size="18" /></span
                ><span
                  >出金评测<small>{{
                    panel.platform?.grade
                      ? `${panel.platform.grade}级 · ${panel.platform.samples} 笔耗时样本`
                      : '暂无完整评测数据'
                  }}</small></span
                ><ChevronRight :size="16" />
              </summary>
              <div class="research-detail-group-body">
                <dl class="research-detail-metrics">
                  <div>
                    <dt>出金纯净度</dt>
                    <dd>
                      {{
                        panel.platform?.grade
                          ? `${panel.platform.grade}级 · ${panel.platform.taint}%`
                          : '—'
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt>耗时样本</dt>
                    <dd>{{ count(panel.platform?.samples ?? 0) }} 笔</dd>
                  </div>
                  <div>
                    <dt>小额出款耗时</dt>
                    <dd>
                      {{
                        panel.platform?.smallMinutes != null
                          ? `${panel.platform.smallMinutes}m`
                          : '—'
                      }}
                    </dd>
                  </div>
                  <div>
                    <dt>大额出款耗时</dt>
                    <dd>
                      {{
                        panel.platform?.largeMinutes != null
                          ? `${panel.platform.largeMinutes}m`
                          : '—'
                      }}
                    </dd>
                  </div>
                </dl>
                <p class="research-sheet-note">
                  纯净度统计近7天、≤3跳关联；出款耗时不等同安全评级。
                </p>
                <button
                  v-for="kind in ['出金安全体检卡', '评分依据', '上报异常']"
                  :key="kind"
                  class="research-sheet-link"
                  @click="open(kind, panel.platform)"
                >
                  {{ kind }}<ChevronRight :size="16" />
                </button>
              </div>
            </details>
            <details
              v-if="overview"
              class="research-detail-section research-detail-group"
              :open="detailSections.ranks"
              @toggle="detailSections.ranks = ($event.target as HTMLDetailsElement).open"
            >
              <summary>
                <span class="research-detail-mark" aria-hidden="true"
                  ><ChartColumn :size="18" /></span
                ><span
                  >高点与范围排名<small>{{
                    scopeRanks.scoreRank != null
                      ? `第 ${scopeRanks.scoreRank} 名 · 当前筛选范围`
                      : `${scope.period} 当前筛选范围`
                  }}</small></span
                ><ChevronRight :size="16" />
              </summary>
              <div class="research-detail-group-body">
                <dl class="research-detail-metrics research-detail-ranks">
                  <div v-for="item in scopeRanks.items" :key="item.label">
                    <dt>{{ item.label }}</dt>
                    <dd>
                      <template v-if="item.rank != null"
                        >第 {{ item.rank }} 名<small>/ {{ scopeRanks.total }}</small></template
                      >
                      <template v-else>—</template>
                    </dd>
                    <small v-if="item.peak" class="research-rank-peak"
                      ><span>{{ item.peak.label }}</span
                      ><span>{{ item.peak.date }}</span
                      ><span>{{ item.peak.amount }}</span></small
                    >
                  </div>
                </dl>
              </div>
            </details>
            <details
              class="research-detail-section research-detail-group"
              :open="detailSections.resources"
              @toggle="detailSections.resources = ($event.target as HTMLDetailsElement).open"
            >
              <summary>
                <span class="research-detail-mark" aria-hidden="true"><FileText :size="18" /></span
                ><span>资料与账户<small>历史评测、数据来源与账户关联</small></span
                ><ChevronRight :size="16" />
              </summary>
              <div class="research-detail-group-body">
                <button
                  v-for="kind in ['历史评测', '数据来源']"
                  :key="kind"
                  class="research-sheet-link"
                  @click="open(kind, panel.platform)"
                >
                  {{ kind }}<ChevronRight :size="16" /></button
                ><button
                  v-if="panel.platform?.score != null"
                  class="research-sheet-link"
                  :aria-label="`绑定${panel.platform.name} UID`"
                  @click="open('绑定 UID', panel.platform)"
                >
                  账户 UID 关联<ChevronRight :size="16" />
                </button>
              </div>
            </details>
          </template>
          <template v-else
            ><p>快照：2026/{{ researchSnapshot }}。</p>
            <p>
              平台 A 共 126 笔、平台 B 共 64 笔耗时样本；平台 C 仅 8 笔，样本不足，不参与排名。
            </p></template
          >
          <p v-if="feedback" class="research-feedback" role="status">{{ feedback }}</p>
          <p class="research-copy-status" role="status">{{ copyStatus }}</p>
        </div>
      </template>
    </BottomDrawer>
  </div>
</template>

<style src="@/features/monitoring/research.css"></style>

<style scoped>
.research-detail-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  margin: 8px 0;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 14px;
  background: white;
  color: var(--ae-highlight);
  font-size: 14px;
  text-align: left;
}
.research-detail-follow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--ae-muted);
}
.research-activity-note {
  font-size: 13px;
  line-height: 1.7;
  color: var(--ae-muted);
}
.research-activity {
  padding: 12px;
  margin: 10px 0;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 16px;
  background: white;
}
.research-activity--selected {
  border-color: var(--ae-highlight);
  background: #f5f8ff;
}
.research-activity header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 14px;
  flex-wrap: wrap;
}
.research-activity p {
  font-size: 12px;
  color: var(--ae-muted);
  line-height: 1.7;
}
.research-activity code {
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
