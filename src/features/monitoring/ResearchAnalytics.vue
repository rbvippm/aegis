<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Copy,
  Info,
  RefreshCw,
  RotateCcw,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Columns2,
  Share2,
} from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import PlatformAccountLink from '@/shared/ui/PlatformAccountLink.vue'
import ResearchMultiSelect from './ResearchMultiSelect.vue'
import ResearchChart from './ResearchChart.vue'
import { monitoringAddressExamples } from '@/mocks/monitoring-addresses'
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
  type GroupBy,
  type LedgerTransfer,
} from './analytics-model'
import './analytics.css'
const props = defineProps<{
  search: string
  grade: string
  completeOnly: boolean
}>()
export interface AnalyticsScope {
  chains?: string[]
  tokens?: string[]
  snapshot: string
  period: AnalyticsWindow
  ids: string[]
  values: Record<
    string,
    {
      deposit: string
      amount: number
      withdrawals: number
      net: number
      balance: number
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
  'evidence-close': []
  'platform-detail': [id: string, fromCompare?: boolean]
  'update:grade': [value: string]
  'update:completeOnly': [value: boolean]
}>()
const route = useRoute()
const period = ref<AnalyticsWindow>('30d'),
  metric = ref<FlowMetric>('deposit'),
  group = ref<GroupBy>('platform'),
  relative = ref(false)
const chains = ref([...analyticsChains]),
  tokens = ref([...analyticsTokens]),
  platformIds = ref(catalog.map((p) => p.id))
const minimum = ref(0),
  feedChain = ref(''),
  feedPlatform = ref(''),
  feedDirection = ref('deposit'),
  feedPage = ref(0)
const moversMetric = ref('deposits'),
  moversDirection = ref('gainers'),
  moversPercent = ref(false),
  moversLimit = ref(5)
const walletGroup = ref<GroupBy>('platform'),
  distributionMode = ref('count'),
  distributionPercent = ref(true),
  retentionPercent = ref(false),
  frequencyMode = ref('mix')
const compareOpen = ref(false)
let inspectAfterCompare = ''
let comparePosition = 0
async function openCompare() {
  compareOpen.value = true
  await nextTick()
  await nextTick()
  if (compareTable.value) compareTable.value.scrollLeft = comparePosition
  updateCompareScroll()
}
function inspectComparedPlatform(id: string) {
  comparePosition = compareTable.value?.scrollLeft ?? 0
  inspectAfterCompare = id
  compareOpen.value = false
}
function closeCompare() {
  if (compareTable.value) comparePosition = compareTable.value.scrollLeft
  compareOpen.value = false
  if (inspectAfterCompare) {
    const id = inspectAfterCompare
    inspectAfterCompare = ''
    emit('platform-detail', id, true)
  }
}
const analysisPlatform = ref('')
const analysisOpen = ref(false)
const surfaceVisible = ref(true)
const analysisSections = ref<Record<string, boolean>>({ trend: true, flows: false, wallets: false })
const analysisBody = ref<HTMLElement>()
let analysisScroll = 0
let mainPeriod: AnalyticsWindow = '30d'
const analysisPeriods = new Map<string, AnalyticsWindow>()
function showPlatformAnalysis(id: string) {
  evidenceHistory.value = []
  surfaceVisible.value = true
  mainPeriod = period.value
  analysisPlatform.value = id
  period.value = analysisPeriods.get(id) ?? mainPeriod
  evidenceReturn.value = true
  analysisOpen.value = true
}
async function returnToAnalysis(reopen = false) {
  detail.value = null
  shareOpen.value = false
  if (reopen) {
    analysisOpen.value = false
    await nextTick()
    analysisOpen.value = true
  }
  await nextTick()
  await nextTick()
  analysisBody.value?.closest('.ae-drawer__body')?.scrollTo({ top: analysisScroll })
}
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
type EvidenceState = NonNullable<typeof detail.value>
const evidenceBody = ref<HTMLElement>()
const evidenceHistory = ref<
  {
    detail: EvidenceState
    page: number
    scroll: number
    tableTop: number
    tableLeft: number
    focus?: string
  }[]
>([])
async function backFromEvidence(reopen = false) {
  const previous = evidenceHistory.value.pop()
  if (!previous) {
    if (analysisOpen.value) await returnToAnalysis(reopen)
    else detail.value = null
    return
  }
  if (reopen) surfaceVisible.value = false
  detail.value = previous.detail
  evidencePage.value = previous.page
  copied.value = ''
  await nextTick()
  if (reopen) surfaceVisible.value = true
  await nextTick()
  await nextTick()
  evidenceBody.value?.closest('.ae-drawer__body')?.scrollTo({ top: previous.scroll })
  const table = evidenceBody.value?.querySelector('.ma-evidence-table')
  table?.scrollTo({ top: previous.tableTop, left: previous.tableLeft })
  const target = [...(evidenceBody.value?.querySelectorAll<HTMLElement>('button, a') ?? [])].find(
    (el) => el.textContent?.trim() === previous.focus,
  )
  target?.focus({ preventScroll: true })
}
const evidenceReturn = ref(false)
async function closeEvidence() {
  if (evidenceHistory.value.length) {
    await backFromEvidence(true)
    return
  }
  if (analysisOpen.value && (detail.value || shareOpen.value)) {
    await returnToAnalysis(true)
    return
  }
  detail.value = null
  shareOpen.value = false
  analysisOpen.value = false
  if (analysisPlatform.value) {
    analysisPeriods.set(analysisPlatform.value, period.value)
    period.value = mainPeriod
    analysisPlatform.value = ''
  }
  if (evidenceReturn.value) {
    evidenceReturn.value = false
    emit('evidence-close')
  }
}
const shareOpen = ref(false),
  message = ref(''),
  copied = ref('')
const evidenceWallets = computed(() =>
  scopedWallets(detail.value?.platform).sort((a, b) => b.amount - a.amount),
)
const name = (id: string) => catalog.find((p) => p.id === id)?.name ?? id
const chainOptions = analyticsChains.map((id) => ({ id, label: id })),
  tokenOptions = analyticsTokens.map((id) => ({ id, label: id }))
const eligible = computed(() =>
  catalog.filter(
    (p) =>
      p.name.toLowerCase().includes(props.search.trim().toLowerCase()) &&
      (!props.completeOnly || p.complete) &&
      (!props.grade || researchPlatforms.find((r) => r.id === p.id)?.grade === props.grade),
  ),
)
const query = computed<AnalyticsQuery>(() => ({
  period: period.value,
  chains: chains.value,
  tokens: tokens.value,
  platforms: analysisPlatform.value
    ? [analysisPlatform.value]
    : eligible.value.filter((p) => platformIds.value.includes(p.id)).map((p) => p.id),
}))
const current = computed(() => selectTransfers(ledger, query.value, asOf)),
  previous = computed(() => selectTransfers(ledger, query.value, asOf, true))
const first = firstActivity(ledger)
const start = computed(() => asOf - duration(period.value))
const stats = computed(() => summarize(current.value, first, start.value))
const balances = computed(() => walletBalances(ledger, opening, query.value, asOf))
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
const showPlatforms = computed(
  () =>
    validScope.value ||
    (chains.value.length > 0 &&
      tokens.value.length > 0 &&
      (!query.value.platforms.length ||
        query.value.platforms.every((id) => !catalog.find((p) => p.id === id)?.complete))),
)
const series = computed(() =>
  timeSeries(current.value, query.value, asOf, group.value, metric.value),
)
const graphTitle = computed(() =>
  metric.value === 'deposit'
    ? '链上存款'
    : metric.value === 'withdrawal'
      ? '链上出款'
      : '链上净流量',
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
function scopedWallets(id?: string) {
  return wallets(
    id ? current.value.filter((r) => r.platform === id) : current.value,
    first,
    start.value,
  )
}
function distribution(id?: string) {
  const wallets = scopedWallets(id)
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
function frequency(id?: string) {
  const wallets = scopedWallets(id)
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
  if (analysisOpen.value)
    analysisScroll = analysisBody.value?.closest('.ae-drawer__body')?.scrollTop ?? 0
  copied.value = ''
  shareOpen.value = true
}
function setOverviewPeriod(value: string | number) {
  const next = String(value) as AnalyticsWindow
  if (!analyticsPeriods.includes(next)) return
  if (analysisPlatform.value) mainPeriod = next
  else period.value = next
}
function resetScope() {
  setOverviewPeriod('30d')
  emit('reset')
  chains.value = [...analyticsChains]
  tokens.value = [...analyticsTokens]
  platformIds.value = catalog.map((p) => p.id)
}
function setFeed(direction: string) {
  feedDirection.value = direction
  feedPage.value = 0
}
function source(title: string, transfers = current.value, wallet?: string, platform?: string) {
  if (detail.value) {
    const table = evidenceBody.value?.querySelector('.ma-evidence-table')
    evidenceHistory.value.push({
      detail: detail.value,
      page: evidencePage.value,
      scroll: evidenceBody.value?.closest('.ae-drawer__body')?.scrollTop ?? 0,
      tableTop: table?.scrollTop ?? 0,
      tableLeft: table?.scrollLeft ?? 0,
      focus:
        document.activeElement instanceof HTMLElement
          ? document.activeElement.textContent?.trim()
          : undefined,
    })
  }

  if (analysisOpen.value && !detail.value)
    analysisScroll = analysisBody.value?.closest('.ae-drawer__body')?.scrollTop ?? 0
  evidencePage.value = 0
  const platformId = platform || analysisPlatform.value || undefined
  const displayTitle =
    platformId && !title.startsWith(`${name(platformId)} · `)
      ? `${name(platformId)} · ${title}`
      : title
  detail.value = { title: displayTitle, rows: transfers, wallet, platform: platformId }
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
    chains: chains.value.join(',') || 'none',
    tokens: tokens.value.join(',') || 'none',
    platforms: query.value.platforms.join(',') || 'none',
    metric: metric.value,
    group: group.value,
    relative: relative.value ? '1' : '0',
    compare: compareIds.value.join(','),
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
  relative.value = q.relative === '1'
  if (q.compare)
    compareIds.value = String(q.compare)
      .split(',')
      .filter((id) => catalog.some((p) => p.id === id))
      .slice(0, 4)
}
function platformOverview(id: string) {
  const row = rows.value.find((r) => r.id === id)
  if (!row || !validScope.value) return null
  const transfers = current.value.filter((r) => r.platform === id)
  const days = dailyRecords(transfers)
  return {
    ...row,
    ranks: (
      [
        ['deposits', '存款额'],
        ['depositCount', '存款活跃度'],
        ['averageDeposit', '平均单笔存款'],
        ['newDepositors', '新增存款钱包'],
      ] as const
    ).map(([key, label]) => ({
      label,
      rank:
        row[key] == null || row[key] === 0
          ? null
          : 1 + rows.value.filter((p) => (p[key] ?? -Infinity) > (row[key] ?? -Infinity)).length,
    })),
    platformCount: rows.value.length,
    distribution: distribution(id),
    distributionMode: distributionMode.value,
    frequency: frequency(id),
    topWallets: scopedWallets(id)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3),
    balanceGrowth: change(row.balance, row.balance - row.net),
    balances: query.value.tokens.flatMap((token) =>
      walletBalances(
        ledger,
        opening,
        { ...query.value, platforms: [id], tokens: [token] },
        asOf,
      ).map((balance) => ({ ...balance, token })),
    ),
    largestDeposit: Math.max(
      0,
      ...transfers.filter((r) => r.direction === 'deposit').map((r) => r.usd),
    ),
    largestWithdrawal: Math.max(
      0,
      ...transfers.filter((r) => r.direction === 'withdrawal').map((r) => r.usd),
    ),
    depositPeak: [...days].sort((a, b) => b.deposits - a.deposits)[0],
    netPeak: [...days].sort((a, b) => b.net - a.net)[0],
  }
}
function showPlatformEvidence(id: string, kind: string, returnToPlatform = false) {
  let transfers = current.value.filter((r) => r.platform === id)
  if (['存款流水', '大额存款'].includes(kind))
    transfers = transfers.filter((r) => r.direction === 'deposit')
  if (['出款流水', '大额出款'].includes(kind))
    transfers = transfers.filter((r) => r.direction === 'withdrawal')
  if (['大额存款', '大额出款'].includes(kind))
    transfers = [...transfers].sort((a, b) => b.usd - a.usd).slice(0, 20)
  evidenceHistory.value = []
  detail.value = null
  surfaceVisible.value = true
  evidenceReturn.value = returnToPlatform
  source(`${name(id)} · ${kind}`, transfers, undefined, id)
}
defineExpose({
  openCompare,
  showPlatformAnalysis,
  platformOverview,
  showPlatformEvidence,
  setOverviewPeriod,
})
loadQuery()
watch(() => route.query, loadQuery)
watch(
  [rows, query],
  () => {
    if (analysisPlatform.value) return
    emit('scope', {
      chains: [...chains.value],
      tokens: [...tokens.value],
      snapshot: `${dateLabel(asOf, true)} UTC+8`,
      period: period.value,
      ids: query.value.platforms,
      values: Object.fromEntries(
        rows.value.map((r) => [
          r.id,
          {
            deposit: money(r.deposits),
            amount: r.deposits,
            withdrawals: r.withdrawals,
            net: r.net,
            balance: r.balance,
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
const compareGroups = computed(() =>
  [
    {
      label: '资金表现',
      metrics: [
        ['deposits', '存款额'],
        ['withdrawals', '出款额'],
        ['net', '净流量'],
        ['balance', '热钱包余额'],
        ['share', '范围内占比'],
      ],
    },
    {
      label: '独立评测',
      metrics: [
        ['score', '盾牌分'],
        ['grade', '出金纯净度'],
        ['timing', '实测出款耗时'],
      ],
    },
    {
      label: '钱包活跃',
      metrics: [
        ['depositCount', '存款笔数'],
        ['withdrawalCount', '出款笔数'],
        ['uniqueDepositors', '独立存款钱包'],
        ['newDepositors', '新增存款钱包'],
      ],
    },
  ].filter(
    (group) =>
      group.label !== '独立评测' ||
      compared.value.some((item) => profileOf(item.id)?.score != null),
  ),
)
const compareTable = ref<HTMLElement>()
const compareChainTable = ref<HTMLElement>()
const compareScroll = ref({ left: 0, max: 0 })
function updateCompareScroll() {
  const el = compareTable.value
  compareScroll.value = { left: el?.scrollLeft ?? 0, max: el ? el.scrollWidth - el.clientWidth : 0 }
}
const mirroredScroll = new WeakMap<HTMLElement, number>()
function syncCompareScroll(event: Event) {
  const el = event.currentTarget as HTMLElement
  // Ignore the mirrored event so it cannot cancel an in-progress smooth scroll.
  const mirrored = mirroredScroll.get(el)
  if (mirrored !== undefined && Math.abs(mirrored - el.scrollLeft) < 1) {
    mirroredScroll.delete(el)
    return
  }
  const other = el === compareTable.value ? compareChainTable.value : compareTable.value
  if (other && Math.abs(other.scrollLeft - el.scrollLeft) > 0.25) {
    mirroredScroll.set(other, el.scrollLeft)
    other.scrollLeft = el.scrollLeft
  }
  updateCompareScroll()
}
watch(compareChainTable, async (el) => {
  await nextTick()
  if (el) el.scrollLeft = compareTable.value?.scrollLeft ?? 0
})
function scrollCompare(direction: number) {
  const el = compareTable.value
  if (!el) return
  el.scrollBy({
    left: (direction * (el.scrollWidth - 80)) / Math.max(1, compared.value.length),
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
let compareObserver: ResizeObserver | undefined
watch(compareTable, (el) => {
  compareObserver?.disconnect()
  if (el) {
    compareObserver = new ResizeObserver(updateCompareScroll)
    compareObserver.observe(el)
  }
  updateCompareScroll()
})
watch(compared, async () => {
  await nextTick()
  updateCompareScroll()
})
onBeforeUnmount(() => compareObserver?.disconnect())

function deltaClass(value: number | null) {
  if (value === null) return ''
  return value >= 0 ? 'ma-up' : 'ma-down'
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
</script>

<template>
  <div class="monitor-analytics">
    <section class="ma-card ma-monitor-toolbar" aria-label="监测范围">
      <header class="ma-heading">
        <h1 class="ma-overview-title">平台监测对比</h1>
        <button
          class="ma-reset-scope"
          aria-label="重置筛选"
          title="恢复全部筛选"
          @click="resetScope"
        >
          <RotateCcw :size="18" />
        </button>
      </header>
      <div class="ma-inline-primary">
        <ResearchMultiSelect
          v-model="chains"
          :options="chainOptions"
          label="公链"
        /><ResearchMultiSelect
          v-model="tokens"
          :options="tokenOptions"
          label="币种"
        /><ResearchMultiSelect
          v-model="platformIds"
          :options="eligible.map((p) => ({ id: p.id, label: p.name }))"
          label="平台"
        />
      </div>
      <slot name="filter-result" :hasResults="showPlatforms" />
    </section>
    <p v-if="!validScope" class="ma-empty" role="status">
      当前范围暂无可统计样本，请调整平台、公链或币种选择。
      <button class="ma-text" @click="resetScope">重置分析范围</button>
    </p>

    <slot v-if="showPlatforms" name="platforms" />
    <button class="ma-compare-fab" aria-label="打开平台对比" @click="openCompare">
      <Columns2 :size="19" />对比
    </button>
    <BottomDrawer :open="compareOpen" title="平台对比" @close="closeCompare">
      <div class="ma-drawer-body ma-comparison-drawer">
        <template v-if="compareOpen && validScope">
          <section class="ma-card ma-comparison" :style="{ '--ma-compare-count': compared.length }">
            <header class="ma-heading">
              <span class="ma-compare-instruction">选择 2–4 家平台，按同一范围比较</span>
              <span class="ma-compare-count" role="status"
                >已选 <b>{{ compared.length }}</b> / 4</span
              >
            </header>
            <div class="ma-compare-selection">
              <GlassSelect
                ref="compareControl"
                v-model="compareAdd"
                label="添加对比平台"
                :display-value="compared.length >= 4 ? '已选满 4 家，移除后可更换' : '添加对比平台'"
                :disabled="compared.length >= 4"
                searchable
                @update:model-value="addCompare"
              >
                <template #leading><Plus :size="18" aria-hidden="true" /></template>
                <option value="" disabled>添加对比平台</option>
                <option
                  v-for="p in rows"
                  :key="p.id"
                  :value="p.id"
                  :disabled="compareIds.includes(p.id)"
                >
                  {{ p.name }}
                </option>
              </GlassSelect>
              <div v-if="compared.length" class="ma-compare-picks">
                <div v-for="p in compared" :key="p.id" class="ma-compare-pick">
                  <span class="ma-compare-avatar" aria-hidden="true">{{
                    p.id.length <= 2 ? p.id : p.name.slice(-1)
                  }}</span>
                  <span class="ma-compare-name" :title="p.name">{{ p.name }}</span>
                  <button :aria-label="`移除对比${p.name}`" @click="removeCompare(p.id)">
                    <X :size="15" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div v-if="!compared.length" class="ma-compare-empty">
              <Plus :size="24" aria-hidden="true" /><strong>添加平台，开始对比</strong
              ><span>从当前筛选范围选择，最多 4 家。</span>
            </div>
            <template v-else>
              <div class="ma-compare-context">
                <span
                  >{{ period }} 统计 <i>·</i>
                  {{
                    compared.length === 1 ? '再添加一家进行并排对比' : '同一范围 · 并排查看'
                  }}</span
                >
                <div v-if="compareScroll.max > 1" class="ma-compare-navigation">
                  <button
                    aria-label="向左查看对比平台"
                    :disabled="compareScroll.left <= 1"
                    @click="scrollCompare(-1)"
                  >
                    <ChevronLeft :size="16" />
                  </button>
                  <button
                    aria-label="向右查看对比平台"
                    :disabled="compareScroll.left >= compareScroll.max - 1"
                    @click="scrollCompare(1)"
                  >
                    <ChevronRight :size="16" />
                  </button>
                </div>
              </div>
              <div
                ref="compareTable"
                class="ma-table-scroll ma-compare-scroll"
                role="region"
                aria-label="平台指标对比表"
                tabindex="0"
                @scroll.passive="syncCompareScroll"
              >
                <table class="ma-compare-table">
                  <caption class="ma-sr-only">
                    {{
                      period
                    }}
                    平台资金、独立评测和钱包活跃对比
                  </caption>
                  <colgroup>
                    <col class="ma-compare-label-col" />
                    <col v-for="p in compared" :key="p.id" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">对比指标</th>
                      <th v-for="p in compared" :key="p.id" scope="col">
                        <div class="ma-compare-platform-heading">
                          <PlatformAccountLink :platform="p.id" :name="p.name" label /><button
                            class="ma-compare-drilldown"
                            :aria-label="`${p.name}详细指标`"
                            @click="inspectComparedPlatform(p.id)"
                          >
                            <ChevronRight :size="16" />
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody v-for="group in compareGroups" :key="group.label">
                    <tr class="ma-compare-group">
                      <th :colspan="compared.length + 1">{{ group.label }}</th>
                    </tr>
                    <tr v-for="[key, label] in group.metrics" :key="key">
                      <th scope="row">{{ label }}</th>
                      <td
                        v-for="p in compared"
                        :key="p.id"
                        :class="{
                          'ma-compare-money': ['deposits', 'balance', 'withdrawals'].includes(key!),
                        }"
                      >
                        <template v-if="key === 'deposits'">
                          <strong>{{ money(p.deposits) }}</strong>
                          <small
                            class="ma-compare-delta"
                            :class="deltaClass(change(p.deposits, p.before.deposits))"
                          >
                            <ArrowUp
                              v-if="(change(p.deposits, p.before.deposits) ?? 0) > 0"
                              :size="12"
                              aria-hidden="true"
                            />
                            <ArrowDown
                              v-else-if="(change(p.deposits, p.before.deposits) ?? 0) < 0"
                              :size="12"
                              aria-hidden="true"
                            />
                            {{ percent(change(p.deposits, p.before.deposits)) }}
                          </small>
                        </template>
                        <template v-else-if="key === 'net'">
                          <span class="ma-compare-net" :class="deltaClass(p.net)"
                            ><small>{{ p.net >= 0 ? '净流入' : '净流出' }}</small
                            ><strong>{{ money(Math.abs(p.net)) }}</strong></span
                          >
                        </template>
                        <template v-else-if="key === 'score' && profileOf(p.id)?.score != null"
                          ><strong class="ma-compare-score"
                            >{{ profileOf(p.id)?.score }}<small>/10</small></strong
                          ></template
                        >
                        <template v-else-if="key === 'grade' && profileOf(p.id)?.grade"
                          ><span class="ma-compare-grade" :data-grade="profileOf(p.id)?.grade"
                            >{{ profileOf(p.id)?.grade }}级</span
                          ><small>污染 {{ profileOf(p.id)?.taint }}%</small></template
                        >
                        <div
                          v-else-if="key === 'timing' && profileOf(p.id)?.smallMinutes != null"
                          class="ma-compare-timing"
                        >
                          <span
                            ><small>小额</small><b>{{ profileOf(p.id)?.smallMinutes }}m</b></span
                          ><span
                            ><small>大额</small><b>{{ profileOf(p.id)?.largeMinutes }}m</b></span
                          >
                        </div>
                        <template v-else>{{ formattedStat(p, key!) }}</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="ma-compare-footnote">
                {{
                  compareScroll.max > 1 ? '左右滑动查看全部平台。' : ''
                }}存款变化对比前一等长窗口；出款耗时不等同安全评级。
              </p>
            </template>
            <label v-if="compared.length" class="ma-check ma-compare-chain-toggle">
              <input v-model="compareChain" type="checkbox" aria-label="展开分链余额" />
              <span
                >分链余额<small>{{ chains.length }} 条公链 · 同一筛选范围</small></span
              >
              <span class="ma-compare-chain-action"
                >{{ compareChain ? '收起' : '展开'
                }}<ChevronUp v-if="compareChain" :size="16" /><ChevronDown v-else :size="16"
              /></span>
            </label>
            <div
              v-if="compareChain && compared.length"
              ref="compareChainTable"
              class="ma-table-scroll ma-compare-chain-table"
              role="region"
              aria-label="分链余额对比表"
              tabindex="0"
              @scroll.passive="syncCompareScroll"
            >
              <table class="ma-compare-table">
                <colgroup>
                  <col class="ma-compare-label-col" />
                  <col v-for="p in compared" :key="p.id" />
                </colgroup>
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
                        money(
                          balances.find((b) => b.platform === p.id && b.chain === c)?.usd ?? null,
                        )
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section></template
        >
        <p v-else class="ma-empty">当前范围没有可对比的平台，请调整公链、币种或平台选择。</p>
      </div>
    </BottomDrawer>
    <BottomDrawer
      :open="surfaceVisible && (analysisOpen || detail !== null || shareOpen)"
      :title="
        shareOpen
          ? `${name(analysisPlatform)} · 分享分析`
          : (detail?.title ?? `${name(analysisPlatform)} · 深度分析`)
      "
      @close="closeEvidence"
    >
      <div v-if="shareOpen" class="ma-drawer-body ma-share-body">
        <button v-if="analysisOpen" class="ma-text ma-evidence-back" @click="returnToAnalysis()">
          <ChevronLeft :size="16" />返回深度分析
        </button>
        <p>链接保留统计周期、公链、币种和平台选择。</p>
        <label class="ma-field"
          >分析链接<input
            :value="shareUrl"
            readonly
            @focus="($event.target as HTMLInputElement).select()" /></label
        ><button class="ma-primary" @click="copy(shareUrl)"><Copy :size="16" />复制链接</button>
        <p role="status">{{ copied }}</p>
      </div>
      <div
        v-if="analysisPlatform"
        v-show="!detail && !shareOpen"
        ref="analysisBody"
        class="ma-drawer-body ma-platform-analysis"
      >
        <div class="ma-analysis-toolbar">
          <label
            >统计范围<GlassSelect v-model="period" label="平台分析时间范围"
              ><option v-for="p in analyticsPeriods" :key="p" :value="p">
                {{ p }}
              </option></GlassSelect
            ></label
          ><button class="ma-text" aria-label="分享平台分析" @click="openShare">
            <Share2 :size="18" />
          </button>
        </div>
        <template v-if="validScope">
          <details
            class="ma-analysis-group"
            :open="analysisSections.trend"
            @toggle="analysisSections.trend = ($event.target as HTMLDetailsElement).open"
          >
            <summary>
              <span class="ma-analysis-step">01</span
              ><span>资金趋势<small>存款、出款与净流量</small></span
              ><ChevronDown :size="17" />
            </summary>
            <div class="ma-analysis-group-body">
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
                  <small>热钱包余额</small
                  ><strong>{{ money(balances.reduce((total, b) => total + b.usd, 0)) }}</strong>
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
            </div>
          </details>
          <details
            class="ma-analysis-group"
            :open="analysisSections.flows"
            @toggle="analysisSections.flows = ($event.target as HTMLDetailsElement).open"
          >
            <summary>
              <span class="ma-analysis-step">02</span
              ><span>流水与异动<small>逐笔记录、排行与凭据</small></span
              ><ChevronDown :size="17" />
            </summary>
            <div class="ma-analysis-group-body">
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
                  ><button
                    :aria-pressed="feedDirection === 'withdrawal'"
                    @click="setFeed('withdrawal')"
                  >
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
                    <option v-for="p in rows" :key="p.id" :value="p.id">
                      {{ p.name }}
                    </option></GlassSelect
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
                          <button
                            class="ma-text"
                            @click="source('交易凭据', [t], t.wallet, t.platform)"
                          >
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
                    <button :aria-pressed="!moversPercent" @click="moversPercent = false">
                      变化量</button
                    ><button :aria-pressed="moversPercent" @click="moversPercent = true">
                      百分比
                    </button>
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
                <button
                  v-if="movers.length > moversLimit"
                  class="ma-text"
                  @click="moversLimit += 5"
                >
                  显示更多
                </button>
                <p class="ma-note">
                  {{
                    moversMetric === 'balance' ? '余额与窗口起点比较' : '与前一个等长窗口比较'
                  }}；基期为零时不计算百分比。
                </p>
              </section>
            </div>
          </details>
          <details
            class="ma-analysis-group"
            :open="analysisSections.wallets"
            @toggle="analysisSections.wallets = ($event.target as HTMLDetailsElement).open"
          >
            <summary>
              <span class="ma-analysis-step">03</span
              ><span>钱包分析<small>余额、金额分布与存款频次</small></span
              ><ChevronDown :size="17" />
            </summary>
            <div class="ma-analysis-group-body">
              <p class="ma-analysis-scope-note">
                钱包余额 <b>{{ money(balances.reduce((total, b) => total + b.usd, 0)) }}</b> ·
                {{ count(stats.uniqueDepositors) }} 个存款钱包
              </p>

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
                    <button
                      :aria-pressed="!distributionPercent"
                      @click="distributionPercent = false"
                    >
                      数值</button
                    ><button
                      :aria-pressed="distributionPercent"
                      @click="distributionPercent = true"
                    >
                      占比
                    </button>
                  </div>
                </div>
                <div class="ma-distribution">
                  <div v-for="b in distribution()" :key="b.label" class="ma-bar-row">
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
                <header class="ma-heading">
                  <h2>新增与回访钱包</h2>
                  <div class="ma-segments">
                    <button :aria-pressed="!retentionPercent" @click="retentionPercent = false">
                      数量</button
                    ><button :aria-pressed="retentionPercent" @click="retentionPercent = true">
                      占比
                    </button>
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
                  ><button
                    :aria-pressed="frequencyMode === 'average'"
                    @click="frequencyMode = 'average'"
                  >
                    每钱包平均次数
                  </button>
                </div>
                <div class="ma-distribution">
                  <header class="ma-heading">
                    <h3>当前范围</h3>
                    <span
                      >{{
                        stats.uniqueDepositors
                          ? (stats.depositCount / stats.uniqueDepositors).toFixed(1)
                          : '—'
                      }}
                      次/钱包 · {{ count(stats.uniqueDepositors) }} 个</span
                    >
                  </header>
                  <div v-if="frequencyMode === 'mix'" class="ma-frequency">
                    <span
                      v-for="(b, i) in frequency()"
                      :key="b.label"
                      :style="{
                        width: `${b.share}%`,
                        background: ['#0864ff', '#087f6b', '#7955bd', '#a66615', '#bd526d'][i],
                      }"
                      :title="`${b.label} ${b.share.toFixed(1)}%`"
                    />
                  </div>
                  <div v-if="frequencyMode === 'mix'" class="ma-frequency-labels">
                    <span v-for="b in frequency()" :key="b.label"
                      >{{ b.label }} {{ b.count }} / {{ b.share.toFixed(1) }}%</span
                    >
                  </div>
                </div>
              </section>
            </div>
          </details></template
        >
        <p v-else class="ma-empty">当前平台在所选范围暂无可统计样本。</p>
      </div>
      <div v-if="detail" ref="evidenceBody" class="ma-drawer-body ma-evidence-body">
        <button
          v-if="evidenceReturn || evidenceHistory.length"
          class="ma-text ma-evidence-back"
          @click="backFromEvidence()"
        >
          <ChevronLeft :size="16" />{{
            evidenceHistory.length
              ? `返回${evidenceHistory.at(-1)?.detail.title.split(' · ').at(-1)}`
              : analysisOpen
                ? '返回深度分析'
                : '返回平台详情'
          }}
        </button>
        <div class="ma-evidence-heading">
          <Info :size="19" />
          <div>
            <strong>记录明细</strong
            ><span
              >{{ dateLabel(asOf, true) }} UTC+8 ·
              {{
                detail.title.endsWith('地址清单')
                  ? `${evidenceWallets.length} 个地址`
                  : `${detail.rows?.length ?? 0} 笔记录`
              }}</span
            >
          </div>
        </div>
        <div v-if="detail.rows?.length === 1" class="ma-transaction-card">
          <header>
            <span class="ma-flow-badge" :data-direction="detail.rows[0]!.direction">{{
              detail.rows[0]!.direction === 'deposit'
                ? '存款'
                : detail.rows[0]!.direction === 'withdrawal'
                  ? '出款'
                  : '内部转账'
            }}</span
            ><span>{{ detail.rows[0]!.chain }} · {{ detail.rows[0]!.token }}</span>
          </header>
          <strong>{{ money(detail.rows[0]!.usd) }}<small>USD</small></strong>
          <p>{{ dateLabel(detail.rows[0]!.time, true) }} UTC+8</p>
          <div class="ma-evidence-id">
            <span
              ><small>样本凭据</small
              ><code :title="detail.rows[0]!.id">{{ detail.rows[0]!.id }}</code></span
            ><button class="ma-text" aria-label="复制样本凭据" @click="copy(detail.rows![0]!.id)">
              <Copy :size="16" />
            </button>
          </div>
        </div>
        <label v-if="detail.wallet" class="ma-field ma-address-field"
          >钱包地址
          <div>
            <input
              :value="detail.wallet"
              :title="detail.wallet"
              aria-label="钱包地址"
              readonly
            /><button
              type="button"
              aria-label="复制地址"
              title="复制完整地址"
              @click="copy(detail.wallet!)"
            >
              <Copy :size="16" />
            </button></div
        ></label>
        <p v-if="copied" role="status">{{ copied }}</p>
        <div v-if="detail.title.endsWith('地址清单')" class="ma-table-scroll ma-evidence-table">
          <table>
            <thead>
              <tr>
                <th>钱包地址</th>
                <th>公链</th>
                <th>存款额</th>
                <th>笔数</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="w in evidenceWallets" :key="`${w.chain}:${w.wallet}`">
                <th>
                  <button
                    class="ma-text ma-address"
                    @click="
                      source(
                        '地址活动',
                        current.filter(
                          (r) =>
                            r.platform === detail?.platform &&
                            r.wallet === w.wallet &&
                            r.chain === w.chain,
                        ),
                        w.wallet,
                        w.platform,
                      )
                    "
                  >
                    {{ w.wallet }}
                  </button>
                </th>
                <td>{{ w.chain }}</td>
                <td>{{ money(w.amount) }}</td>
                <td>{{ count(w.deposits) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          v-else-if="detail.rows?.length !== 1"
          class="ma-table-scroll ma-evidence-table"
          role="region"
          aria-label="依据明细表"
          tabindex="0"
        >
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
        <div
          v-if="!detail.title.endsWith('地址清单') && (detail.rows?.length ?? 0) > 20"
          class="ma-pagination"
        >
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
        <details class="ma-method-details" :open="detail.title.includes('口径')">
          <summary>统计口径与样本说明</summary>
          <p>
            地址取自公开披露资料，仅用作界面样本，不代表 A／B
            等平台的实际归属。金额与流水为虚构样本，不是实际链上交易。内部转账不计入存款、出款与净流量。
          </p>
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
        <div class="ma-explorer-links">
          <template
            v-for="chain in [...new Set(detail.rows?.map((t) => t.chain) ?? [])]"
            :key="chain"
          >
            <a
              :href="
                monitoringAddressExamples[chain]?.explorer +
                (detail.wallet ? encodeURIComponent(detail.wallet) : '')
              "
              target="_blank"
              rel="noopener noreferrer"
              class="ma-text"
              >{{ chain }} {{ detail.wallet ? '查看链上地址' : '区块浏览器'
              }}<ArrowUpRight :size="14"
            /></a>
            <a
              :href="monitoringAddressExamples[chain]?.source"
              target="_blank"
              rel="noopener noreferrer"
              class="ma-text"
              >{{ chain }} 地址来源<ArrowUpRight :size="14"
            /></a>
          </template>
        </div>
        <p class="ma-note">链上地址可独立查询；本页样本金额、流水与评分不代表该地址的真实活动。</p>
      </div></BottomDrawer
    >
  </div>
</template>
