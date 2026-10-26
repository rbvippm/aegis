<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Copy,
  Info,
  RefreshCw,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import PlatformAccountLink from '@/shared/ui/PlatformAccountLink.vue'
import ResearchMultiSelect from './ResearchMultiSelect.vue'
import ResearchChart from './ResearchChart.vue'
import { researchSnapshot } from '@/mocks/monitoring-research'
import { monitoringPlatforms as researchPlatforms } from '@/mocks/monitoring-platforms'
import {
  analyticsAsOf as asOf,
  analyticsCatalog as catalog,
  analyticsLedger as ledger,
  analyticsOpening as opening,
} from '@/mocks/monitoring-analytics'
import {
  analyticsChains,
  analyticsPeriods,
  analyticsTokens,
  change,
  count,
  dailyRecords,
  dateLabel,
  duration,
  firstActivity,
  money,
  percent,
  selectTransfers,
  summarize,
  timeSeries,
  walletBalances,
  wallets,
  type AnalyticsQuery,
  type AnalyticsWindow,
  type FlowMetric,
  type FlowStats,
  type GroupBy,
  type LedgerTransfer,
} from './analytics-model'
import './analytics.css'
const props = defineProps<{
  search: string
  region: string
  grade: string
  completeOnly: boolean
  resultCount: number
}>()
export interface AnalyticsScope {
  snapshot: string
  period: AnalyticsWindow
  ids: string[]
  values: Record<
    string,
    {
      deposit: string
      amount: number
      change: number | null
      wallet: string
      flow: string
      flowPercent: number | null
      share: number | null
    }
  >
}
const emit = defineEmits<{
  scope: [value: AnalyticsScope]
  reset: []
  'update:region': [value: string]
  'update:grade': [value: string]
  'update:completeOnly': [value: boolean]
}>()
const route = useRoute()
const category = ref('crypto'),
  period = ref<AnalyticsWindow>('30d'),
  metric = ref<FlowMetric>('deposit'),
  group = ref<GroupBy>('platform'),
  relative = ref(false)
const chains = ref([...analyticsChains]),
  tokens = ref([...analyticsTokens]),
  platformIds = ref(catalog.map((p) => p.id))
const tabsEl = ref<HTMLElement>()
const contentAnchor = ref<HTMLElement>()
async function switchTab(id: string) {
  const element = tabsEl.value
  const pinned =
    !!element &&
    element.getBoundingClientRect().top <= (parseFloat(getComputedStyle(element).top) || 0) + 4
  tab.value = id
  if (pinned) {
    await nextTick()
    contentAnchor.value?.scrollIntoView({ block: 'start' })
  }
}
const tab = ref('overview'),
  advanced = ref(false),
  tableLimit = ref(5),
  statSort = ref('deposits'),
  descending = ref(true)
const feedDirection = ref('deposit'),
  minimum = ref(0),
  feedPage = ref(0),
  feedChain = ref(''),
  feedPlatform = ref('')
const moversMetric = ref('deposits'),
  moversDirection = ref('gainers'),
  moversPercent = ref(false),
  moversLimit = ref(5)
const walletGroup = ref<GroupBy>('platform'),
  distributionMode = ref('count'),
  distributionPercent = ref(true),
  retentionPercent = ref(false),
  frequencyMode = ref('mix')
const compareControl = ref<InstanceType<typeof GlassSelect>>()
async function removeCompare(id: string) {
  compareIds.value = compareIds.value.filter((value) => value !== id)
  await nextTick()
  ;(compareControl.value?.$el as HTMLElement | undefined)
    ?.querySelector<HTMLButtonElement>('[role=combobox]')
    ?.focus({ preventScroll: true })
}
const compareIds = ref<string[]>([]),
  compareAdd = ref(''),
  compareChain = ref(false)
const evidencePage = ref(0)
const feedSort = ref<'time' | 'usd' | 'platform' | 'chain'>('time')
const feedDescending = ref(true)
function sortFeed(key: typeof feedSort.value) {
  if (feedSort.value === key) feedDescending.value = !feedDescending.value
  else {
    feedSort.value = key
    feedDescending.value = true
  }
}
const detail = ref<{
  title: string
  rows?: LedgerTransfer[]
  wallet?: string
  platform?: string
} | null>(null)
const filtersOpen = ref(false)
const shareOpen = ref(false),
  message = ref(''),
  copied = ref('')
const name = (id: string) => catalog.find((p) => p.id === id)?.name ?? id
const chainOptions = analyticsChains.map((id) => ({ id, label: id })),
  tokenOptions = analyticsTokens.map((id) => ({ id, label: id }))
const scopeCustomized = computed(
  () =>
    category.value !== 'crypto' ||
    chains.value.length !== chainOptions.length ||
    tokens.value.length !== tokenOptions.length ||
    platformIds.value.length !== catalog.length,
)
const eligible = computed(() =>
  catalog.filter(
    (p) =>
      p.category === category.value &&
      p.name.toLowerCase().includes(props.search.trim().toLowerCase()) &&
      (!props.region ||
        (props.region === 'unknown' ? p.region === null : p.region === props.region)) &&
      (!props.completeOnly || p.complete) &&
      (!props.grade || researchPlatforms.find((r) => r.id === p.id)?.grade === props.grade),
  ),
)
const query = computed<AnalyticsQuery>(() => ({
  period: period.value,
  chains: chains.value,
  tokens: tokens.value,
  platforms: eligible.value.filter((p) => platformIds.value.includes(p.id)).map((p) => p.id),
}))
const current = computed(() => selectTransfers(ledger, query.value, asOf)),
  previous = computed(() => selectTransfers(ledger, query.value, asOf, true))
const first = firstActivity(ledger)
const start = computed(() => asOf - duration(period.value))
const stats = computed(() => summarize(current.value, first, start.value))
const balances = computed(() => walletBalances(ledger, opening, query.value, asOf))
const totalBalance = computed(() => balances.value.reduce((s, row) => s + row.usd, 0))
const walletRows = computed(() =>
  wallets(current.value, first, start.value).sort((a, b) => b.amount - a.amount),
)
const rows = computed(() =>
  eligible.value
    .filter((p) => query.value.platforms.includes(p.id) && p.complete)
    .map((p) => {
      const transfers = current.value.filter((row) => row.platform === p.id)
      const value = summarize(transfers, first, start.value),
        before = summarize(
          previous.value.filter((row) => row.platform === p.id),
          first,
          start.value - duration(period.value),
        )
      const balance = balances.value
        .filter((b) => b.platform === p.id)
        .reduce((s, b) => s + b.usd, 0)
      return {
        ...p,
        ...value,
        before,
        balance,
        balanceChange: value.net,
        share: stats.value.deposits ? (value.deposits / stats.value.deposits) * 100 : null,
      }
    }),
)
const validScope = computed(
  () =>
    query.value.platforms.length > 0 &&
    chains.value.length > 0 &&
    tokens.value.length > 0 &&
    rows.value.length > 0 &&
    (current.value.length > 0 || balances.value.length > 0),
)
const ranked = computed(() =>
  [...rows.value].sort((a, b) => {
    const av = a[statSort.value as keyof typeof a] as number | null
    const bv = b[statSort.value as keyof typeof b] as number | null
    if (av === null) return bv === null ? 0 : 1
    if (bv === null) return -1
    return (descending.value ? -1 : 1) * (av - bv)
  }),
)
const series = computed(() =>
  timeSeries(current.value, query.value, asOf, group.value, metric.value),
)
const graphTitle = computed(() =>
  metric.value === 'deposit'
    ? '真实链上存款'
    : metric.value === 'withdrawal'
      ? '链上出款'
      : '链上净流量',
)
const leaders = computed(() => [...rows.value].sort((a, b) => b.deposits - a.deposits))
const biggestDeposits = computed(() =>
  current.value.filter((r) => r.direction === 'deposit').sort((a, b) => b.usd - a.usd),
)
const biggestWithdrawals = computed(() =>
  current.value.filter((r) => r.direction === 'withdrawal').sort((a, b) => b.usd - a.usd),
)
const bestBy = (key: 'depositCount' | 'averageDeposit' | 'newDepositors') =>
  [...rows.value].sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0))[0]
const mostGrowth = computed(() =>
  [...rows.value]
    .filter((r) => change(r.deposits, r.before.deposits) !== null)
    .sort(
      (a, b) => change(b.deposits, b.before.deposits)! - change(a.deposits, a.before.deposits)!,
    ),
)
const feed = computed(() =>
  current.value
    .filter(
      (r) =>
        r.direction === feedDirection.value &&
        r.usd >= (Number.isFinite(minimum.value) ? Math.max(0, minimum.value) : 0) &&
        (!feedChain.value || r.chain === feedChain.value) &&
        (!feedPlatform.value || r.platform === feedPlatform.value),
    )
    .sort(
      (a, b) =>
        (feedDescending.value ? -1 : 1) *
        (typeof a[feedSort.value] === 'number'
          ? Number(a[feedSort.value]) - Number(b[feedSort.value])
          : String(a[feedSort.value]).localeCompare(String(b[feedSort.value]))),
    ),
)
watch(query, () => {
  if (feedChain.value && !chains.value.includes(feedChain.value)) feedChain.value = ''
  if (feedPlatform.value && !query.value.platforms.includes(feedPlatform.value))
    feedPlatform.value = ''
})
const feedPages = computed(() => Math.max(1, Math.ceil(feed.value.length / 10)))
watch([minimum, feedChain, feedPlatform, feedDirection, query, feedSort, feedDescending], () => {
  feedPage.value = 0
})
const records = computed(() => dailyRecords(current.value))
const topDays = (key: 'deposits' | 'net') =>
  rows.value
    .map(
      (p) =>
        records.value
          .filter((r) => r.platform === p.id && r[key] > 0)
          .sort((a, b) => b[key] - a[key])[0],
    )
    .filter((r) => r !== undefined)
    .sort((a, b) => b[key] - a[key])
const movers = computed(() =>
  rows.value
    .map((row) => {
      const key = moversMetric.value as 'deposits' | 'depositCount' | 'withdrawals' | 'net'
      const now = moversMetric.value === 'balance' ? row.balance : row[key]
      const before = moversMetric.value === 'balance' ? row.balance - row.net : row.before[key]
      return { id: row.id, name: row.name, delta: now - before, growth: change(now, before) }
    })
    .filter((r) => (moversDirection.value === 'gainers' ? r.delta > 0 : r.delta < 0))
    .filter((r) => !moversPercent.value || r.growth !== null)
    .sort(
      (a, b) =>
        (moversDirection.value === 'gainers' ? -1 : 1) *
        (moversPercent.value ? a.growth! - b.growth! : a.delta - b.delta),
    ),
)
const alerts = computed(() =>
  rows.value.filter(
    (row) => row.net < 0 || Math.abs(change(row.balance, row.balance - row.net) ?? 0) >= 10,
  ),
)
const balanceTimes = computed(() =>
  series.value.times.map((_, i) => series.value.times[i + 1] ?? asOf),
)
const balanceSeries = computed(() => {
  const checkpoints = series.value.times
  const values = new Map<string, number[]>()
  checkpoints.forEach((time, i) => {
    const end = i === checkpoints.length - 1 ? asOf : checkpoints[i + 1]!
    for (const b of walletBalances(ledger, opening, query.value, end)) {
      const key = walletGroup.value === 'chain' ? b.chain : b.platform
      if (!values.has(key)) values.set(key, Array<number>(checkpoints.length).fill(0))
      values.get(key)![i]! += b.usd
    }
  })
  return [...values].map(([key, values]) => ({ key, values }))
})
const amountBands = [
  { label: '<$10', max: 10 },
  { label: '$10–100', max: 100 },
  { label: '$100–500', max: 500 },
  { label: '$500–5K', max: 5000 },
  { label: '$5K–10K', max: 10000 },
  { label: '$10K–100K', max: 100000 },
  { label: '$100K–1M', max: 1000000 },
  { label: '$1M+', max: Infinity },
]
const frequencyBands = [
  { label: '1次', max: 1 },
  { label: '2–5次', max: 5 },
  { label: '6–10次', max: 10 },
  { label: '11–50次', max: 50 },
  { label: '50次以上', max: Infinity },
]
function distribution(id: string) {
  const wallets = walletRows.value.filter((r) => r.platform === id)
  const total =
    distributionMode.value === 'count' ? wallets.length : wallets.reduce((s, r) => s + r.amount, 0)
  return amountBands.map((band, i) => {
    const hits = wallets.filter(
      (r) => r.amount >= (amountBands[i - 1]?.max ?? 0) && r.amount < band.max,
    )
    const value =
      distributionMode.value === 'count' ? hits.length : hits.reduce((s, r) => s + r.amount, 0)
    return { label: band.label, value, share: total ? (value / total) * 100 : 0 }
  })
}
function frequency(id: string) {
  const wallets = walletRows.value.filter((r) => r.platform === id)
  return frequencyBands.map((band, i) => ({
    label: band.label,
    count: wallets.filter(
      (r) => r.deposits > (frequencyBands[i - 1]?.max ?? 0) && r.deposits <= band.max,
    ).length,
    share: wallets.length
      ? (wallets.filter(
          (r) => r.deposits > (frequencyBands[i - 1]?.max ?? 0) && r.deposits <= band.max,
        ).length /
          wallets.length) *
        100
      : 0,
  }))
}
const returning = computed(() => {
  const times = series.value.times
  const result = [
    { key: '新增钱包', values: [] as number[] },
    { key: '回访钱包', values: [] as number[] },
  ]
  for (let i = 0; i < times.length; i++) {
    const end = times[i + 1] ?? asOf
    const walletsInBucket = wallets(
      current.value.filter((r) => r.time >= times[i]! && r.time < end),
      first,
      times[i]!,
    )
    const newCount = walletsInBucket.filter((r) => r.isNew).length,
      oldCount = walletsInBucket.length - newCount
    result[0]!.values.push(
      retentionPercent.value
        ? walletsInBucket.length
          ? (newCount / walletsInBucket.length) * 100
          : 0
        : newCount,
    )
    result[1]!.values.push(
      retentionPercent.value
        ? walletsInBucket.length
          ? (oldCount / walletsInBucket.length) * 100
          : 0
        : oldCount,
    )
  }
  return result
})
function openShare() {
  copied.value = ''
  shareOpen.value = true
}
function resetScope() {
  emit('reset')
  category.value = 'crypto'
  chains.value = [...analyticsChains]
  tokens.value = [...analyticsTokens]
  platformIds.value = catalog.map((p) => p.id)
}
function openFilters() {
  filtersOpen.value = true
}
function showMethodology() {
  filtersOpen.value = false
  source('统计口径与来源')
}
function setFeed(direction: string) {
  feedDirection.value = direction
  feedPage.value = 0
}
function sortBy(key: string) {
  if (statSort.value === key) descending.value = !descending.value
  else {
    statSort.value = key
    descending.value = true
  }
}
const moneyStatKeys = new Set([
  'deposits',
  'withdrawals',
  'net',
  'averageDeposit',
  'averageWithdrawal',
])
function changeClass(value: number | null) {
  if (value === null || Math.abs(value) < 0.05) return ''
  return value > 0 ? 'ma-up' : 'ma-down'
}
function changeLabel(value: number | null) {
  if (value === null) return '—'
  if (Math.abs(value) < 0.05) return '持平'
  return percent(value)
}
function depositChange(row?: { deposits: number; before: { deposits: number } }) {
  return row ? change(row.deposits, row.before.deposits) : null
}
function balanceChange(row: { balance: number; net: number }) {
  return change(row.balance, row.balance - row.net)
}
function alertMoney(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1000 && abs < 10000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(abs)
  }
  return money(abs)
}
function source(title: string, transfers = current.value, wallet?: string, platform?: string) {
  evidencePage.value = 0
  detail.value = { title, rows: transfers, wallet, platform }
  copied.value = ''
}
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = '已复制'
  } catch {
    copied.value = '复制失败，请长按文本手动复制'
  }
}
const shareUrl = computed(() => {
  const url = new URL('/monitor', location.origin)
  for (const [key, value] of Object.entries({
    period: period.value,
    category: category.value,
    chains: chains.value.join(',') || 'none',
    tokens: tokens.value.join(',') || 'none',
    platforms: platformIds.value.join(',') || 'none',
    metric: metric.value,
    group: group.value,
    relative: relative.value ? '1' : '0',
    view: tab.value,
    compare: compareIds.value.join(','),
    region: props.region,
    search: props.search,
    grade: props.grade,
    complete: props.completeOnly ? '1' : '0',
  }))
    if (value) url.searchParams.set(key, value)
  return url.href
})
function loadQuery() {
  const q = route.query
  if (analyticsPeriods.includes(String(q.period) as AnalyticsWindow))
    period.value = String(q.period) as AnalyticsWindow
  if (['crypto', 'cases'].includes(String(q.category))) category.value = String(q.category)
  for (const [key, target, options] of [
    ['chains', chains, analyticsChains],
    ['tokens', tokens, analyticsTokens],
    ['platforms', platformIds, catalog.map((p) => p.id)],
  ] as const)
    if (q[key] !== undefined)
      target.value = String(q[key])
        .split(',')
        .filter((id) => (options as readonly string[]).includes(id))
  if (['deposit', 'withdrawal', 'net'].includes(String(q.metric)))
    metric.value = String(q.metric) as FlowMetric
  if (['platform', 'chain', 'token'].includes(String(q.group)))
    group.value = String(q.group) as GroupBy
  if (['overview', 'flows', 'wallets', 'compare'].includes(String(q.view)))
    tab.value = String(q.view)
  relative.value = q.relative === '1'
  if (q.compare)
    compareIds.value = String(q.compare)
      .split(',')
      .filter((id) => catalog.some((p) => p.id === id))
      .slice(0, 4)
}
defineExpose({
  openFilters,
  openShare,
  scopeCustomized,
  showPlatformEvidence: (id: string, kind: string) =>
    source(
      `${name(id)} · ${kind}`,
      current.value.filter((r) => r.platform === id),
      undefined,
      id,
    ),
})
loadQuery()
watch(() => route.query, loadQuery)
watch(
  [rows, query],
  () => {
    emit('scope', {
      snapshot: `${dateLabel(asOf, true)} UTC+8`,
      period: period.value,
      ids: query.value.platforms,
      values: Object.fromEntries(
        rows.value.map((r) => [
          r.id,
          {
            deposit: money(r.deposits),
            amount: r.deposits,
            change: change(r.deposits, r.before.deposits),
            wallet: money(r.balance),
            flow: money(r.net),
            flowPercent: change(r.balance, r.balance - r.net),
            share: r.share,
          },
        ]),
      ),
    })
    compareIds.value = compareIds.value.filter((id) => rows.value.some((row) => row.id === id))
    if (!compareIds.value.length) compareIds.value = rows.value.slice(0, 2).map((r) => r.id)
  },
  { immediate: true },
)
const compared = computed(() => rows.value.filter((r) => compareIds.value.includes(r.id)))
function addCompare(value: string | number) {
  if (value && compareIds.value.length < 4 && !compareIds.value.includes(String(value)))
    compareIds.value.push(String(value))
  compareAdd.value = ''
}
const profileOf = (id: string) => researchPlatforms.find((item) => item.id === id)
const compareMetrics = [
  ['deposits', '真实存款'],
  ['balance', '热钱包余额'],
  ['net', '净流量'],
  ['score', '盾牌分'],
  ['grade', '出金纯净度'],
  ['timing', '实测出款耗时'],
  ['share', '范围内占比'],
  ['withdrawals', '出款金额'],
  ['depositCount', '存款笔数'],
  ['withdrawalCount', '出款笔数'],
  ['uniqueDepositors', '独立存款钱包'],
  ['newDepositors', '新增存款钱包'],
] as const
const shownCompareMetrics = computed(() =>
  compareMetrics.filter(
    ([key]) =>
      !['score', 'grade', 'timing'].includes(key) ||
      compared.value.some((item) => profileOf(item.id)?.score != null),
  ),
)
function netLabel(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—'
  return `${value >= 0 ? '净流入' : '净流出'} ${money(Math.abs(value))}`
}
function deltaClass(value: number | null) {
  if (value === null) return ''
  return value >= 0 ? 'ma-up' : 'ma-down'
}
function statChange(row: (typeof rows.value)[number], key: string) {
  return change(row[key as keyof FlowStats], row.before[key as keyof FlowStats])
}
function formattedStat(row: (typeof rows.value)[number], key: string) {
  if (key === 'score') {
    const score = profileOf(row.id)?.score
    return score == null ? '—' : `${score}/10`
  }
  if (key === 'grade') {
    const profile = profileOf(row.id)
    return profile?.grade ? `${profile.grade}级 · ${profile.taint}%` : '—'
  }
  if (key === 'timing') {
    const profile = profileOf(row.id)
    return profile?.smallMinutes != null
      ? `小额 ${profile.smallMinutes}m / 大额 ${profile.largeMinutes}m`
      : '—'
  }
  const value = row[key as keyof typeof row] as number | null
  return key === 'share'
    ? value === null
      ? '—'
      : `${value.toFixed(1)}%`
    : ['deposits', 'withdrawals', 'net', 'balance', 'averageDeposit', 'averageWithdrawal'].includes(
          key,
        )
      ? money(value)
      : count(value ?? 0)
}
const statColumns = computed(() =>
  metric.value === 'deposit'
    ? [
        ['deposits', '存款额'],
        ['depositCount', '笔数'],
        ['uniqueDepositors', '独立钱包'],
        ['newDepositors', '新增钱包'],
        ['averageDeposit', '平均金额'],
      ]
    : metric.value === 'withdrawal'
      ? [
          ['withdrawals', '出款额'],
          ['withdrawalCount', '笔数'],
          ['uniqueWithdrawers', '独立钱包'],
          ['newWithdrawers', '新增钱包'],
          ['averageWithdrawal', '平均金额'],
        ]
      : [
          ['net', '净流量'],
          ['transactions', '交易笔数'],
        ],
)
watch(metric, () => {
  statSort.value =
    metric.value === 'deposit' ? 'deposits' : metric.value === 'withdrawal' ? 'withdrawals' : 'net'
})
</script>

<template>
  <div class="monitor-analytics">
    <div ref="tabsEl" class="ma-viewbar">
      <div class="ma-segments ma-tabs" aria-label="监测分析模块">
        <button
          v-for="item in [
            { id: 'overview', label: '总览' },
            { id: 'flows', label: '资金流水' },
            { id: 'wallets', label: '钱包分析' },
            { id: 'compare', label: '平台对比' },
          ]"
          :key="item.id"
          :aria-pressed="tab === item.id"
          @click="switchTab(item.id)"
        >
          {{ item.label }}
        </button>
      </div>
      <GlassSelect
        class="ma-period-select"
        label="时间范围"
        aria-label="存款统计时间范围"
        :model-value="period"
        @update:model-value="period = $event as AnalyticsWindow"
      >
        <option v-for="p in analyticsPeriods" :key="p" :value="p">{{ p }}</option>
      </GlassSelect>
    </div>
    <div ref="contentAnchor" class="ma-content-anchor" aria-hidden="true"></div>
    <p v-if="!validScope" class="ma-empty" role="status">
      当前范围暂无可统计样本，请调整平台、公链或币种选择。
      <button class="ma-text" @click="resetScope">重置分析范围</button>
    </p>

    <slot
      v-if="
        tab === 'overview' &&
        !validScope &&
        chains.length &&
        tokens.length &&
        (!query.platforms.length ||
          eligible.some((p) => !p.complete && query.platforms.includes(p.id)))
      "
      name="platforms"
    />
    <template v-if="tab === 'overview' && validScope">
      <div class="ma-kpis">
        <div class="ma-kpi--lead">
          <small>存款总额</small><strong>{{ money(stats.deposits) }}</strong>
        </div>
        <div>
          <small>独立存款钱包</small><strong>{{ count(stats.uniqueDepositors) }}</strong>
        </div>
        <div>
          <small>平均单笔存款</small><strong>{{ money(stats.averageDeposit) }}</strong>
        </div>
        <div>
          <small>范围内平台</small
          ><strong
            >{{ rows.length }} <small>/ {{ query.platforms.length }} 已选</small></strong
          >
        </div>
      </div>
      <ResearchChart
        :title="graphTitle"
        :series="series.series"
        :times="series.times"
        :label="group === 'platform' ? name : undefined"
        :percent="relative"
      >
        <template #controls>
          <div class="ma-segments" aria-label="资金指标">
            <button
              v-for="m in [
                { id: 'deposit', label: '存款' },
                { id: 'withdrawal', label: '出款' },
                { id: 'net', label: '净流量' },
              ]"
              :key="m.id"
              :aria-pressed="metric === m.id"
              @click="metric = m.id as FlowMetric"
            >
              {{ m.label }}
            </button>
          </div>
          <div class="ma-filter-grid">
            <GlassSelect v-model="group" label="图表分组"
              ><option value="platform">按平台</option>
              <option value="chain">按公链</option>
              <option value="token">按币种</option></GlassSelect
            >
            <div class="ma-segments" aria-label="图表显示方式">
              <button :aria-pressed="!relative" @click="relative = false">金额</button
              ><button :aria-pressed="relative" @click="relative = true">涨跌幅</button>
            </div>
          </div>
        </template>
      </ResearchChart>
      <button class="ma-secondary" :aria-expanded="advanced" @click="advanced = !advanced">
        {{ advanced ? '收起高级统计' : '展开高级统计' }}
      </button>
      <section v-if="advanced" class="ma-card ma-stats">
        <header class="ma-heading">
          <h2>高级统计</h2>
          <span>{{ ranked.length }} 家</span>
        </header>
        <div class="ma-table-scroll">
          <table>
            <thead>
              <tr>
                <th>平台</th>
                <th v-for="col in statColumns" :key="col[0]">
                  <button :aria-pressed="statSort === col[0]" @click="sortBy(col[0]!)">
                    {{ col[1] }}
                    <ChevronDown
                      v-if="statSort === col[0] && descending"
                      :size="14"
                      aria-hidden="true"
                    />
                    <ChevronUp
                      v-else-if="statSort === col[0]"
                      :size="14"
                      aria-hidden="true"
                    />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in ranked.slice(0, tableLimit)" :key="row.id">
                <th><PlatformAccountLink :platform="row.id" :name="row.name" label /></th>
                <td
                  v-for="col in statColumns"
                  :key="col[0]"
                  :class="{
                    'ma-amount': moneyStatKeys.has(col[0]!),
                    'ma-stat-active': statSort === col[0],
                  }"
                >
                  <b>{{ formattedStat(row, col[0]!) }}</b>
                  <small :class="changeClass(statChange(row, col[0]!))">{{
                    changeLabel(statChange(row, col[0]!))
                  }}</small>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <button
          v-if="rows.length > 5"
          class="ma-secondary ma-platform-expand"
          @click="tableLimit = tableLimit === 5 ? rows.length : 5"
        >
          {{ tableLimit === 5 ? `展开全部平台（${ranked.length}）` : '收起平台' }}
        </button>
        <p v-if="!rows.length" class="ma-empty">暂无可统计样本。</p>
      </section>
      <slot name="platforms" />
      <section class="ma-card">
        <h2>范围洞察</h2>
        <div class="ma-insights">
          <div class="ma-insight ma-insight--value">
            <small>前三平台存款占比</small>
            <strong>{{
              stats.deposits
                ? (
                    (leaders.slice(0, 3).reduce((s, r) => s + r.deposits, 0) / stats.deposits) *
                    100
                  ).toFixed(1) + '%'
                : '—'
            }}</strong>
          </div>
          <div class="ma-insight">
            <small>最活跃平台</small>
            <strong>{{ bestBy('depositCount')?.name ?? '—' }}</strong>
            <span>{{ count(bestBy('depositCount')?.depositCount ?? 0) }} 笔</span>
          </div>
          <div class="ma-insight">
            <small>存款变化领先</small>
            <strong>{{ mostGrowth[0]?.name ?? '—' }}</strong>
            <span :class="changeClass(depositChange(mostGrowth[0]))">{{
              changeLabel(depositChange(mostGrowth[0]))
            }}</span>
          </div>
          <div class="ma-insight">
            <small>存款变化末位</small>
            <strong>{{ mostGrowth.at(-1)?.name ?? '—' }}</strong>
            <span :class="changeClass(depositChange(mostGrowth.at(-1)))">{{
              changeLabel(depositChange(mostGrowth.at(-1)))
            }}</span>
          </div>
          <div class="ma-insight ma-insight--value">
            <small>热钱包总余额</small>
            <strong>{{ money(totalBalance) }}</strong>
          </div>
          <div class="ma-insight ma-insight--value">
            <small>最大单笔存款</small>
            <strong>{{ money(biggestDeposits[0]?.usd ?? null) }}</strong>
          </div>
          <div class="ma-insight ma-insight--value">
            <small>最大单笔出款</small>
            <strong>{{ money(biggestWithdrawals[0]?.usd ?? null) }}</strong>
          </div>
          <div class="ma-insight">
            <small>平均存款最高</small>
            <strong>{{ bestBy('averageDeposit')?.name ?? '—' }}</strong>
            <span class="ma-insight__figure">{{
              money(bestBy('averageDeposit')?.averageDeposit ?? null)
            }}</span>
          </div>
          <div class="ma-insight ma-insight--wide">
            <small>新增存款钱包最多</small>
            <strong>{{ bestBy('newDepositors')?.name ?? '—' }}</strong>
            <span>{{ count(bestBy('newDepositors')?.newDepositors ?? 0) }} 个</span>
          </div>
        </div>
        <p class="ma-note">占比基于当前所选范围，不代表全市场。</p>
      </section>
      <section class="ma-card">
        <header class="ma-heading">
          <h2>资金异动</h2>
          <span>{{ alerts.length }} 条</span>
        </header>
        <div v-if="alerts.length" class="ma-alerts">
          <div v-for="row in alerts" :key="row.id" class="ma-alert">
            <PlatformAccountLink :platform="row.id" :name="row.name" label />
            <p class="ma-alert__flow" :class="row.net < 0 ? 'ma-down' : row.net > 0 ? 'ma-up' : ''">
              <small>{{ row.net < 0 ? '净流出' : row.net > 0 ? '净流入' : '净流量' }}</small>
              <strong>{{ alertMoney(row.net) }}</strong>
            </p>
            <span class="ma-alert__meta" :class="changeClass(balanceChange(row))">
              余额变化 {{ changeLabel(balanceChange(row)) }}
            </span>
            <button
              class="ma-text"
              @click="
                source(
                  `${row.name} · 资金异动`,
                  current.filter((t) => t.platform === row.id),
                  undefined,
                  row.id,
                )
              "
            >
              查看依据
            </button>
          </div>
        </div>
        <p v-if="!alerts.length" class="ma-empty">当前范围未发现净流出或余额变动达到10%的平台。</p>
        <p class="ma-note">资金变化不等同于平台安全评级。</p>
      </section>
    </template>

    <template v-if="tab === 'flows' && validScope">
      <section class="ma-card">
        <header class="ma-heading">
          <h2>资金流水</h2>
          <button
            class="ma-icon"
            aria-label="刷新资金快照"
            @click="message = '已刷新，当前样本快照未变化。'"
          >
            <RefreshCw :size="18" />
          </button>
        </header>
        <p v-if="message" class="ma-note" role="status">{{ message }}</p>
        <div class="ma-segments">
          <button :aria-pressed="feedDirection === 'deposit'" @click="setFeed('deposit')">
            存款</button
          ><button :aria-pressed="feedDirection === 'withdrawal'" @click="setFeed('withdrawal')">
            出款
          </button>
        </div>
        <label class="ma-field"
          >最低金额（USD）<input v-model.number="minimum" type="number" min="0" step="1"
        /></label>
        <div class="ma-filter-grid">
          <GlassSelect v-model="feedChain" label="流水公链"
            ><option value="">当前所选公链</option>
            <option v-for="c in chains" :key="c">{{ c }}</option></GlassSelect
          ><GlassSelect v-model="feedPlatform" label="流水平台" searchable
            ><option value="">当前所选平台</option>
            <option v-for="p in rows" :key="p.id" :value="p.id">{{ p.name }}</option></GlassSelect
          >
        </div>
        <div class="ma-table-scroll">
          <table>
            <thead>
              <tr>
                <th><button @click="sortFeed('platform')">平台 / 地址</button></th>
                <th>
                  <button @click="sortFeed('usd')">
                    金额 {{ feedSort === 'usd' ? (feedDescending ? '↓' : '↑') : '' }}
                  </button>
                </th>
                <th><button @click="sortFeed('chain')">公链 / 币种</button></th>
                <th><button @click="sortFeed('time')">时间</button></th>
                <th>凭据</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in feed.slice(feedPage * 10, (feedPage + 1) * 10)" :key="t.id">
                <th>
                  <PlatformAccountLink
                    :platform="t.platform"
                    :name="name(t.platform)"
                    label
                  /><button
                    class="ma-text ma-address"
                    @click="
                      source(
                        '地址活动',
                        current.filter((r) => r.wallet === t.wallet),
                        t.wallet,
                        t.platform,
                      )
                    "
                  >
                    {{ t.wallet }}
                  </button>
                </th>
                <td class="ma-amount">{{ money(t.usd) }}</td>
                <td>
                  {{ t.chain }}<small>{{ t.token }}</small>
                </td>
                <td>{{ dateLabel(t.time, true) }}</td>
                <td>
                  <button class="ma-text" @click="source('交易凭据', [t], t.wallet, t.platform)">
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!feed.length" class="ma-empty">当前条件下暂无流水。</p>
        <div v-if="feed.length > 10" class="ma-pagination">
          <button :disabled="feedPage === 0" aria-label="上一页流水" @click="feedPage--">
            <ChevronLeft :size="16" />上一页</button
          ><span aria-live="polite"
            >{{ feedPage + 1 }} / {{ feedPages }} 页 · {{ feed.length }} 笔</span
          ><button
            :disabled="feedPage + 1 >= feedPages"
            aria-label="下一页流水"
            @click="feedPage++"
          >
            下一页<ChevronRight :size="16" />
          </button>
        </div>
      </section>
      <section
        v-for="block in [
          { title: '最大单笔存款', items: biggestDeposits },
          { title: '最大单笔出款', items: biggestWithdrawals },
        ]"
        :key="block.title"
        class="ma-card"
      >
        <h2>{{ block.title }}</h2>
        <div v-for="t in block.items.slice(0, 5)" :key="t.id" class="ma-record">
          <PlatformAccountLink :platform="t.platform" :name="name(t.platform)" label /><span
            >{{ money(t.usd) }}<small>{{ t.chain }} · {{ dateLabel(t.time) }}</small></span
          ><button class="ma-text" @click="source('交易凭据', [t], t.wallet, t.platform)">
            交易凭据
          </button>
        </div>
        <p v-if="!block.items.length" class="ma-empty">当前范围暂无记录。</p>
      </section>
      <section class="ma-card">
        <h2>多指标异动排行</h2>
        <GlassSelect v-model="moversMetric" label="异动指标"
          ><option value="deposits">存款金额</option>
          <option value="depositCount">存款笔数</option>
          <option value="withdrawals">出款金额</option>
          <option value="net">净流量</option>
          <option value="balance">热钱包余额</option></GlassSelect
        >
        <div class="ma-filter-grid">
          <div class="ma-segments">
            <button
              :aria-pressed="moversDirection === 'gainers'"
              @click="moversDirection = 'gainers'"
            >
              增长榜</button
            ><button
              :aria-pressed="moversDirection === 'decliners'"
              @click="moversDirection = 'decliners'"
            >
              下降榜
            </button>
          </div>
          <div class="ma-segments">
            <button :aria-pressed="!moversPercent" @click="moversPercent = false">变化量</button
            ><button :aria-pressed="moversPercent" @click="moversPercent = true">百分比</button>
          </div>
        </div>
        <div v-for="r in movers.slice(0, moversLimit)" :key="r.id" class="ma-record">
          <PlatformAccountLink :platform="r.id" :name="r.name" label /><span
            :class="r.delta > 0 ? 'ma-up' : 'ma-down'"
            >{{ moversMetric === 'depositCount' ? count(r.delta) : money(r.delta)
            }}<small>{{ percent(r.growth) }}</small></span
          >
        </div>
        <p v-if="!movers.length" class="ma-empty">当前范围无符合条件的变化记录。</p>
        <button v-if="movers.length > moversLimit" class="ma-text" @click="moversLimit += 5">
          显示更多
        </button>
        <p class="ma-note">
          {{
            moversMetric === 'balance' ? '余额与窗口起点比较' : '与前一个等长窗口比较'
          }}；基期为零时不计算百分比。
        </p>
      </section>
      <section
        v-for="block in [
          { key: 'deposits' as const, title: '历史存款高点日' },
          { key: 'net' as const, title: '净流入高点日' },
        ]"
        :key="block.key"
        class="ma-card"
      >
        <h2>{{ block.title }}</h2>
        <div class="ma-table-scroll">
          <table>
            <thead>
              <tr>
                <th>平台</th>
                <th>日期</th>
                <th>存款额</th>
                <th>{{ block.key === 'net' ? '出款额' : '笔数' }}</th>
                <th>{{ block.key === 'net' ? '净流量' : '独立钱包' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in topDays(block.key)" :key="r.platform">
                <th>
                  <PlatformAccountLink :platform="r.platform" :name="name(r.platform)" label />
                </th>
                <td>{{ r.date }}</td>
                <td>{{ money(r.deposits) }}</td>
                <td>{{ block.key === 'net' ? money(r.withdrawals) : count(r.count) }}</td>
                <td>{{ block.key === 'net' ? money(r.net) : count(r.unique) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!topDays(block.key).length" class="ma-empty">当前范围暂无记录。</p>
      </section>
    </template>

    <template v-if="tab === 'wallets' && validScope">
      <div class="ma-filter-grid">
        <GlassSelect v-model="walletGroup" label="余额分组"
          ><option value="platform">按平台</option>
          <option value="chain">按公链</option></GlassSelect
        ><button class="ma-secondary" @click="source('余额计算口径')">余额口径</button>
      </div>
      <ResearchChart
        title="热钱包余额历史"
        :times="balanceTimes"
        :series="balanceSeries"
        :label="walletGroup === 'platform' ? name : undefined"
        balance
      />
      <section class="ma-card">
        <header class="ma-heading">
          <h2>平台 × 公链余额</h2>
          <strong>{{ money(totalBalance) }}</strong>
        </header>
        <div class="ma-table-scroll">
          <table>
            <thead>
              <tr>
                <th>平台</th>
                <th v-for="c in chains" :key="c">{{ c }}</th>
                <th>合计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in rows" :key="p.id">
                <th><PlatformAccountLink :platform="p.id" :name="p.name" label /></th>
                <td v-for="c in chains" :key="c">
                  {{
                    money(balances.find((b) => b.platform === p.id && b.chain === c)?.usd ?? null)
                  }}
                </td>
                <td>{{ money(p.balance) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="ma-card">
        <h2>钱包金额分布</h2>
        <div class="ma-filter-grid">
          <div class="ma-segments">
            <button
              :aria-pressed="distributionMode === 'count'"
              @click="distributionMode = 'count'"
            >
              钱包数量</button
            ><button
              :aria-pressed="distributionMode === 'volume'"
              @click="distributionMode = 'volume'"
            >
              资金量
            </button>
          </div>
          <div class="ma-segments">
            <button :aria-pressed="!distributionPercent" @click="distributionPercent = false">
              数值</button
            ><button :aria-pressed="distributionPercent" @click="distributionPercent = true">
              占比
            </button>
          </div>
        </div>
        <div v-for="p in rows" :key="p.id" class="ma-distribution">
          <h3><PlatformAccountLink :platform="p.id" :name="p.name" label /></h3>
          <div v-for="b in distribution(p.id)" :key="b.label" class="ma-bar-row">
            <span>{{ b.label }}</span>
            <div><i :style="{ width: `${b.share}%` }" /></div>
            <strong>{{
              distributionPercent
                ? `${b.share.toFixed(1)}%`
                : distributionMode === 'count'
                  ? count(b.value)
                  : money(b.value)
            }}</strong>
          </div>
        </div>
        <p class="ma-note">按所选窗口内每个存款地址的累计金额分档。</p>
      </section>
      <section class="ma-card">
        <h2>大额存款地址</h2>
        <div class="ma-table-scroll">
          <table>
            <thead>
              <tr>
                <th>地址</th>
                <th>公链</th>
                <th>平台</th>
                <th>存款金额</th>
                <th>笔数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in walletRows.slice(0, 10)" :key="w.wallet">
                <td>
                  <button
                    class="ma-text ma-address"
                    @click="
                      source(
                        '地址活动',
                        current.filter((r) => r.wallet === w.wallet),
                        w.wallet,
                        w.platform,
                      )
                    "
                  >
                    {{ w.wallet }}
                  </button>
                </td>
                <td>{{ w.chain }}</td>
                <th>
                  <PlatformAccountLink :platform="w.platform" :name="name(w.platform)" label />
                </th>
                <td>{{ money(w.amount) }}</td>
                <td>{{ w.deposits }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!walletRows.length" class="ma-empty">暂无存款地址。</p>
      </section>
      <section class="ma-card">
        <header class="ma-heading">
          <h2>新增与回访钱包</h2>
          <div class="ma-segments">
            <button :aria-pressed="!retentionPercent" @click="retentionPercent = false">数量</button
            ><button :aria-pressed="retentionPercent" @click="retentionPercent = true">占比</button>
          </div>
        </header>
        <ResearchChart
          :title="retentionPercent ? '钱包占比（%）' : '钱包数量'"
          :times="series.times"
          :series="returning"
          :unit="retentionPercent ? 'percent' : 'count'"
        />
        <p class="ma-note">
          每个时间桶去重；“新增”指首次出现在完整样本账本中，不等于首次使用该平台。
        </p>
      </section>
      <section class="ma-card">
        <h2>存款频次</h2>
        <div class="ma-segments">
          <button :aria-pressed="frequencyMode === 'mix'" @click="frequencyMode = 'mix'">
            频次构成</button
          ><button :aria-pressed="frequencyMode === 'average'" @click="frequencyMode = 'average'">
            每钱包平均次数
          </button>
        </div>
        <div v-for="p in rows" :key="p.id" class="ma-distribution">
          <header class="ma-heading">
            <h3>{{ p.name }}</h3>
            <span
              >{{
                p.uniqueDepositors ? (p.depositCount / p.uniqueDepositors).toFixed(1) : '—'
              }}
              次/钱包 · {{ count(p.uniqueDepositors) }} 个</span
            >
          </header>
          <div v-if="frequencyMode === 'mix'" class="ma-frequency">
            <span
              v-for="(b, i) in frequency(p.id)"
              :key="b.label"
              :style="{
                width: `${b.share}%`,
                background: ['#0864ff', '#087f6b', '#7955bd', '#a66615', '#bd526d'][i],
              }"
              :title="`${b.label} ${b.share.toFixed(1)}%`"
            />
          </div>
          <div v-if="frequencyMode === 'mix'" class="ma-frequency-labels">
            <span v-for="b in frequency(p.id)" :key="b.label"
              >{{ b.label }} {{ b.count }} / {{ b.share.toFixed(1) }}%</span
            >
          </div>
        </div>
      </section>
    </template>

    <template v-if="tab === 'compare' && validScope">
      <section class="ma-card">
        <header class="ma-heading">
          <h2>平台综合对比</h2>
          <span>{{ compared.length }} / 4 家</span>
        </header>
        <GlassSelect
          ref="compareControl"
          v-model="compareAdd"
          label="添加对比平台"
          searchable
          @update:model-value="addCompare"
          ><option value="">选择平台（最多4家）</option>
          <option
            v-for="p in rows"
            :key="p.id"
            :value="p.id"
            :disabled="compareIds.includes(p.id) || compared.length >= 4"
          >
            {{ p.name }}
          </option></GlassSelect
        >
        <div class="ma-chips">
          <button
            v-for="p in compared"
            :key="p.id"
            :aria-label="`移除对比${p.name}`"
            @click="removeCompare(p.id)"
          >
            {{ p.name }} ×
          </button>
        </div>
        <p v-if="!compared.length" class="ma-empty">请选择当前范围内的平台进行对比。</p>
        <div v-else class="ma-table-scroll">
          <table class="ma-compare-table">
            <thead>
              <tr>
                <th>指标</th>
                <th v-for="p in compared" :key="p.id">
                  <PlatformAccountLink :platform="p.id" :name="p.name" label />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="[key, label] in shownCompareMetrics" :key="key">
                <th>{{ label }}</th>
                <td
                  v-for="p in compared"
                  :key="p.id"
                  :class="
                    key === 'net'
                      ? deltaClass(p.net)
                      : ['deposits', 'balance', 'withdrawals'].includes(key)
                        ? 'ma-amount'
                        : undefined
                  "
                >
                  <template v-if="key === 'deposits'">
                    <strong>{{ money(p.deposits) }}</strong>
                    <small :class="deltaClass(change(p.deposits, p.before.deposits))">{{
                      percent(change(p.deposits, p.before.deposits))
                    }}</small>
                  </template>
                  <template v-else-if="key === 'net'">{{ netLabel(p.net) }}</template>
                  <template v-else-if="key === 'timing' && profileOf(p.id)?.smallMinutes != null"
                    >小额 {{ profileOf(p.id)?.smallMinutes }}m<br />大额
                    {{ profileOf(p.id)?.largeMinutes }}m</template
                  >
                  <template v-else>{{ formattedStat(p, key) }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <label class="ma-check"><input v-model="compareChain" type="checkbox" />展开分链余额</label>
        <div v-if="compareChain && compared.length" class="ma-table-scroll">
          <table class="ma-compare-table">
            <thead>
              <tr>
                <th>公链</th>
                <th v-for="p in compared" :key="p.id">{{ p.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in chains" :key="c">
                <th>{{ c }}</th>
                <td v-for="p in compared" :key="p.id">
                  {{
                    money(balances.find((b) => b.platform === p.id && b.chain === c)?.usd ?? null)
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section
        v-for="block in ['主要存款地址', '最大存款', '最大出款', '存款高点日', '净流入高点日']"
        :key="block"
        class="ma-card"
      >
        <h2>{{ block }}</h2>
        <div class="ma-compare-details">
          <article v-for="p in compared" :key="p.id">
            <h3>{{ p.name }}</h3>
            <template v-if="block === '主要存款地址'"
              ><button
                v-for="w in walletRows.filter((r) => r.platform === p.id).slice(0, 3)"
                :key="w.wallet"
                class="ma-detail-item"
                @click="
                  source(
                    '地址活动',
                    current.filter((r) => r.wallet === w.wallet),
                    w.wallet,
                    p.id,
                  )
                "
              >
                <span class="ma-address">{{ w.wallet }}</span
                ><strong>{{ money(w.amount) }}</strong>
              </button></template
            ><template v-else-if="block === '最大存款' || block === '最大出款'"
              ><button
                v-for="t in (block === '最大存款' ? biggestDeposits : biggestWithdrawals)
                  .filter((r) => r.platform === p.id)
                  .slice(0, 3)"
                :key="t.id"
                class="ma-detail-item"
                @click="source('交易凭据', [t], t.wallet, p.id)"
              >
                <span>{{ dateLabel(t.time) }} · {{ t.chain }}</span
                ><strong>{{ money(t.usd) }}</strong>
              </button></template
            ><template v-else
              ><div
                v-for="r in topDays(block === '存款高点日' ? 'deposits' : 'net').filter(
                  (r) => r.platform === p.id,
                )"
                :key="r.date"
                class="ma-detail-item"
              >
                <span>{{ r.date }}</span
                ><strong>{{ money(block === '存款高点日' ? r.deposits : r.net) }}</strong>
              </div></template
            >
            <p v-if="!current.some((t) => t.platform === p.id)" class="ma-empty">
              当前范围暂无记录。
            </p>
          </article>
        </div>
      </section>
    </template>

    <BottomDrawer :open="filtersOpen" title="筛选条件" @close="filtersOpen = false"
      ><div class="ma-drawer-body ma-scope-drawer">
        <div class="ma-scope-scroll">
          <p class="ma-scope-lead">
            <Info :size="16" />
            <span>所选范围统一应用于图表、流水、钱包和平台对比。</span>
          </p>
          <div class="ma-segments" aria-label="平台类别">
            <button :aria-pressed="category === 'crypto'" @click="category = 'crypto'">
              加密平台
            </button>
            <button :aria-pressed="category === 'cases'" @click="category = 'cases'">
              传统平台
            </button>
          </div>
          <div class="ma-scope-meta">
            <span>快照 <b>{{ dateLabel(asOf, true) }}</b></span>
            <button class="ma-text" @click="showMethodology">
              <Info :size="14" />口径与来源
            </button>
          </div>
          <ResearchMultiSelect
            v-model="chains"
            :options="chainOptions"
            label="公链"
            show-selection
          /><ResearchMultiSelect
            v-model="tokens"
            :options="tokenOptions"
            label="币种"
            show-selection
          /><ResearchMultiSelect
            v-model="platformIds"
            :options="eligible.map((p) => ({ id: p.id, label: p.name }))"
            label="平台"
            show-selection
          />
          <label class="research-field"
            >平台地区<GlassSelect
              :model-value="region"
              label="平台地区"
              @update:model-value="emit('update:region', String($event))"
              ><option value="">全部地区</option>
              <option value="asia">亚洲平台</option>
              <option value="europe">欧洲平台</option>
              <option value="unknown">地区未标注</option></GlassSelect
            ></label
          >
          <label class="research-field"
            >纯净度<GlassSelect
              :model-value="grade"
              label="纯净度"
              @update:model-value="emit('update:grade', String($event))"
              ><option value="">全部等级</option>
              <option v-for="item in ['S', 'A', 'B', 'C']" :key="item" :value="item">
                {{ item }}级
              </option></GlassSelect
            ></label
          >
          <label class="research-checkbox"
            ><input
              :checked="completeOnly"
              type="checkbox"
              @change="emit('update:completeOnly', ($event.target as HTMLInputElement).checked)"
            />仅看数据完整平台</label
          >
        </div>
        <div class="ma-drawer-actions">
          <button class="ma-secondary" @click="resetScope">恢复全部</button
          ><button class="ma-primary" @click="filtersOpen = false">
            查看 {{ resultCount }} 个平台
          </button>
        </div>
      </div></BottomDrawer
    >
    <BottomDrawer :open="shareOpen" title="分享监测分析" @close="shareOpen = false"
      ><div class="ma-drawer-body">
        <p>链接保留统计周期、公链、币种、平台及分析视图。</p>
        <label class="ma-field"
          >分析链接<input
            :value="shareUrl"
            readonly
            @focus="($event.target as HTMLInputElement).select()" /></label
        ><button class="ma-primary" @click="copy(shareUrl)"><Copy :size="16" />复制链接</button>
        <p role="status">{{ copied }}</p>
      </div></BottomDrawer
    >
    <BottomDrawer
      :open="detail !== null"
      :title="detail?.title ?? '统计依据'"
      @close="detail = null"
      ><div v-if="detail" class="ma-drawer-body">
        <div class="ma-evidence-heading">
          <Info :size="19" />
          <div>
            <strong>固定样本账本</strong
            ><span>{{ dateLabel(asOf, true) }} UTC+8 · {{ detail.rows?.length ?? 0 }} 笔依据</span>
          </div>
        </div>
        <details class="ma-method-details" :open="detail.title.includes('口径')">
          <summary>统计口径与样本说明</summary>
          <p>平台与地址标识均为虚构样本，不是实际链上交易。内部转账不计入存款、出款与净流量。</p>
          <p>
            余额由期初样本余额加外部净流量推算；金额为样本交易时的 USD
            估值。独立钱包按地址去重，不等同于独立玩家。评分、纯净度与实测耗时使用独立样本（{{
              researchSnapshot
            }}），不由资金流水推断。
          </p>
          <p>
            时间窗口采用左闭右开区间；同比较前一个等长窗口。基期为零显示“无可比基期”。不足样本不参与排名或评分。
          </p>
        </details>
        <template v-if="detail.wallet"
          ><label class="ma-field">样本地址标识<input :value="detail.wallet" readonly /></label
          ><button class="ma-secondary" @click="copy(detail!.wallet!)">
            <Copy :size="16" />复制标识
          </button></template
        >
        <p v-if="copied" role="status">{{ copied }}</p>
        <div class="ma-table-scroll ma-evidence-table">
          <table>
            <thead>
              <tr>
                <th>样本凭据</th>
                <th>样本地址</th>
                <th>时间</th>
                <th>方向</th>
                <th>公链 / 币种</th>
                <th>USD</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in detail.rows?.slice(evidencePage * 20, (evidencePage + 1) * 20)"
                :key="t.id"
              >
                <td>{{ t.id }}</td>
                <td>{{ t.wallet }}</td>
                <td>{{ dateLabel(t.time, true) }}</td>
                <td>
                  {{
                    t.direction === 'deposit'
                      ? '存款'
                      : t.direction === 'withdrawal'
                        ? '出款'
                        : '内部转账'
                  }}
                </td>
                <td>{{ t.chain }} / {{ t.token }}</td>
                <td>{{ money(t.usd) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!detail.rows?.length" class="ma-empty">当前范围暂无可展示凭据。</p>
        <div v-if="(detail.rows?.length ?? 0) > 20" class="ma-pagination">
          <button :disabled="evidencePage === 0" aria-label="上一页依据" @click="evidencePage--">
            <ChevronLeft :size="16" />上一页</button
          ><span aria-live="polite"
            >{{ evidencePage + 1 }} / {{ Math.ceil((detail.rows?.length ?? 0) / 20) }} 页</span
          ><button
            :disabled="(evidencePage + 1) * 20 >= (detail.rows?.length ?? 0)"
            aria-label="下一页依据"
            @click="evidencePage++"
          >
            下一页<ChevronRight :size="16" />
          </button>
        </div>
        <div class="ma-explorer-links">
          <a
            v-for="chain in [...new Set(detail.rows?.map((t) => t.chain) ?? [])]"
            :key="chain"
            :href="
              (
                {
                  TRON: 'https://tronscan.org/',
                  BSC: 'https://bscscan.com/',
                  ETH: 'https://etherscan.io/',
                  SOL: 'https://solscan.io/',
                } as Record<string, string>
              )[chain]
            "
            target="_blank"
            rel="noopener noreferrer"
            class="ma-text"
            >{{ chain }} 区块浏览器<ArrowUpRight :size="14"
          /></a>
        </div>
        <p class="ma-note">浏览器仅用于独立查询，样本标识不链接到真实地址或交易。</p>
      </div></BottomDrawer
    >
  </div>
</template>
