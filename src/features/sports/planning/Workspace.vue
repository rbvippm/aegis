<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Search,
  ScanLine,
  Menu,
  ChevronRight,
  CalendarDays,
  Send,
  RefreshCw,
  Share2,
  Info,
  Bell,
} from '@lucide/vue'
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import SportsSheet from '../SportsSheet.vue'
import PlanningTrend from './PlanningTrend.vue'
import SportIcon from '../SportIcon.vue'
import type { OddsFormat } from '../types'
import FixtureCard from './FixtureCard.vue'
import QuoteMatrix from './QuoteMatrix.vue'
import FixtureCenter from './FixtureCenter.vue'
import AllocationPlan from './AllocationPlan.vue'
import ComparisonBoard from './ComparisonBoard.vue'
import Rankings from './Rankings.vue'
import CalculationAudit from './CalculationAudit.vue'
import ReportExport from './ReportExport.vue'
import TrackingPanel from './TrackingPanel.vue'
import DatePicker from './DatePicker.vue'
import SlipMatcher from './SlipMatcher.vue'
import {
  familyNames,
  categoryNames,
  sportsCatalog,
  sportName,
  analysis,
  valid,
  number,
  normalized,
  type Fixture,
  type Market,
  type Quote,
  type Family,
  type Category,
  type Metric,
} from './model'
import { planningMatches, planningOperators, planningSnapshot } from '@/mocks/sports-planning'
import { formatOdds } from '../logic'
import { dataMode } from '@/shared/api/config'
import { useSportsTracking } from './tracking'
import '@/features/sports/sports.css'
import './planning.css'
defineOptions({ name: 'SportsPlanningWorkspace' })
const searchWrap = ref<HTMLElement>()
function outsideSearch(event: PointerEvent) {
  if (!searchWrap.value?.contains(event.target as Node)) searchOpen.value = false
}
onMounted(() => document.addEventListener('pointerdown', outsideSearch))
onBeforeUnmount(() => document.removeEventListener('pointerdown', outsideSearch))
const route = useRoute(),
  router = useRouter(),
  tracking = useSportsTracking()
const view = ref('odds'),
  sport = ref('basketball'),
  category = ref<Category>('all'),
  league = ref(''),
  operator = ref(''),
  status = ref('all'),
  date = ref(''),
  sort = ref('time')
const formats = [
  { id: 'HK' as const, label: '港盘 HK', description: '净盈利倍数' },
  { id: 'MY' as const, label: '马盘 MY', description: '正负水位' },
  { id: 'ID' as const, label: '印尼盘 ID', description: '正负赔率' },
  { id: 'DEC' as const, label: '欧盘 DEC', description: '十进制 · 含本金的总返还倍数' },
]
const format = ref<OddsFormat>('HK'),
  enabled = ref<Family[]>(Object.keys(familyNames) as Family[]),
  formatName = computed(() => formats.find((f) => f.id === format.value)?.label ?? '港盘 HK')
const metric = ref<Metric>('typical'),
  panel = ref(''),
  previousPanel = ref(''),
  search = ref(''),
  searchOpen = ref(false),
  searchIndex = ref(0),
  focusedFixture = ref('')
const active = ref(planningMatches[0]!),
  activeMarket = ref(active.value.markets[0]!),
  selectedQuote = ref<{ quote: Quote; index: number }>()
const followed = ref<string[]>([]),
  compared = ref<Record<string, string>>({}),
  visibleCount = ref(6),
  opportunityCount = ref(6),
  catalogSearch = ref(''),
  catalogGroup = ref('all'),
  scenario = ref('normal'),
  snapshot = ref(0)
const operators = computed(() =>
  planningOperators.filter(
    (p) =>
      (category.value === 'all' || p.category === category.value) &&
      (!operator.value || p.id === operator.value),
  ),
)
const leagues = computed(() => [
  ...new Set(
    planningMatches
      .filter((f) => sport.value === 'all' || f.sport === sport.value)
      .map((f) => f.league),
  ),
])
const searchResults = computed(() => {
  const q = normalized(search.value)
  return q
    ? planningMatches
        .filter((f) => normalized(`${f.home}${f.away}${f.league}`).includes(q))
        .slice(0, 10)
    : []
})
function filteredMarket(m: Market): Market {
  return {
    ...m,
    quotes: m.quotes
      .filter((q) => operators.value.some((p) => p.id === q.operator))
      .map((q, i) => {
        const clone = { ...q, prices: [...q.prices], before: [...q.before] }
        if (scenario.value === 'locked' && i < 3) clone.status = 'suspended'
        if (scenario.value === 'partial' && i % 3 === 0)
          clone.prices[clone.prices.length - 1] = null
        if (snapshot.value % 2)
          clone.prices = clone.prices.map((p, j) =>
            p == null ? null : Number((p + ((i + j) % 2 ? 0.02 : -0.02)).toFixed(2)),
          )
        return clone
      })
      .sort((a, b) =>
        sort.value === 'operator'
          ? planningOperators
              .find((p) => p.id === a.operator)!
              .name.localeCompare(planningOperators.find((p) => p.id === b.operator)!.name)
          : 0,
      ),
  }
}
const fixtures = computed(() =>
  scenario.value === 'empty'
    ? []
    : planningMatches
        .filter(
          (f) =>
            (sport.value === 'all' || f.sport === sport.value) &&
            (!league.value || f.league === league.value) &&
            (!date.value || f.startsAt.slice(0, 10) === date.value) &&
            (!focusedFixture.value || f.id === focusedFixture.value) &&
            (!search.value.trim() ||
              normalized(`${f.home}${f.away}${f.league}`).includes(normalized(search.value))) &&
            (status.value === 'popular'
              ? f.popular
              : status.value === 'followed'
                ? followed.value.includes(f.id)
                : status.value === 'all' || f.phase === status.value),
        )
        .map((f) => ({ ...f, markets: f.markets.map(filteredMarket) }))
        .filter((f) => f.markets.some((m) => m.quotes.length))
        .sort((a, b) => {
          if (sort.value === 'follow')
            return Number(followed.value.includes(b.id)) - Number(followed.value.includes(a.id))
          if (sort.value === 'value') return value(a) - value(b)
          if (sort.value === 'high' || sort.value === 'low')
            return (average(a) - average(b)) * (sort.value === 'high' ? -1 : 1)
          return (
            Number(a.phase !== 'live') - Number(b.phase !== 'live') ||
            a.startsAt.localeCompare(b.startsAt)
          )
        }),
)
function value(f: Fixture) {
  return Math.min(...f.markets.map((m) => analysis(m)?.percentage ?? Infinity))
}
function average(f: Fixture) {
  const numbers =
    f.markets[0]?.quotes
      .filter(valid)
      .flatMap((q) => q.prices.filter((p): p is number => p != null)) ?? []
  return numbers.reduce((s, n) => s + n, 0) / Math.max(1, numbers.length)
}
const opportunities = computed(() =>
  fixtures.value.flatMap((f) =>
    f.markets
      .filter((m) => enabled.value.includes(m.family))
      .flatMap((m) => {
        const result = analysis(m)
        return result && result.roi > 0 ? [{ fixture: f, market: m, result }] : []
      }),
  ),
)
const scope = computed(
  () =>
    `${sport.value === 'all' ? '全部体育' : sportName(sport.value)} · ${league.value || '全部联赛'} · ${categoryNames[category.value]}${date.value ? ` · ${date.value.slice(5)}` : ''}`,
)
const catalogue = computed(() =>
  sportsCatalog.filter(
    (s) =>
      (catalogGroup.value === 'all' || (catalogGroup.value === 'esports' ? s.esport : !s.esport)) &&
      s.name.toLowerCase().includes(catalogSearch.value.toLowerCase()),
  ),
)
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* Local preferences remain in memory. */
  }
}
function follow(id: string) {
  followed.value = followed.value.includes(id)
    ? followed.value.filter((x) => x !== id)
    : [...followed.value, id]
  save('aegis-sports-followed', followed.value)
}
function open(kind: string, f?: Fixture, m?: Market) {
  previousPanel.value = panel.value
  if (f) active.value = f
  activeMarket.value = m ?? (f ? f.markets[0]! : activeMarket.value)
  panel.value = kind
}
function tool(kind: string, f: Fixture, m: Market) {
  if (kind === '完整比价') compared.value = { ...compared.value, [f.id]: m.id }
  selectedQuote.value = undefined
  open(kind, f, m)
}
function quote(f: Fixture, m: Market, q: Quote, index: number) {
  selectedQuote.value = { quote: q, index }
  open('报价详情', f, m)
}
function plan() {
  panel.value = '对冲试算'
}
function pickFormat(id: OddsFormat) {
  format.value = id
  try {
    localStorage.setItem('aegis-sports-format', id)
  } catch {
    /* Session only. */
  }
}
function chooseSport(id: string) {
  sport.value = id
  league.value = ''
  focusedFixture.value = ''
  search.value = ''
  visibleCount.value = 6
}
function pickFixture(f: Fixture) {
  chooseSport(f.sport)
  status.value = 'all'
  date.value = ''
  search.value = f.home
  focusedFixture.value = f.id
  searchOpen.value = false
}
function searchChange() {
  focusedFixture.value = ''
  searchOpen.value = true
  searchIndex.value = 0
}
function searchKey(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    searchIndex.value =
      (searchIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + searchResults.value.length) %
      Math.max(1, searchResults.value.length)
    searchOpen.value = true
  } else if (event.key === 'Enter' && searchOpen.value && searchResults.value[searchIndex.value]) {
    event.preventDefault()
    pickFixture(searchResults.value[searchIndex.value]!)
  } else if (event.key === 'Escape') searchOpen.value = false
}
function chooseCatalog(id: string) {
  chooseSport(id)
  panel.value = ''
}
function selectDate(value: string) {
  date.value = value
  panel.value = ''
}
function addSlips(ids: string[]) {
  for (const id of ids) {
    const f = planningMatches.find((f) => f.id === id)
    if (f) compared.value = { ...compared.value, [id]: f.markets[0]!.id }
  }
  panel.value = '完整比价'
}
function reset() {
  sport.value = 'basketball'
  category.value = 'all'
  league.value = ''
  operator.value = ''
  status.value = 'all'
  date.value = ''
  search.value = ''
  focusedFixture.value = ''
  scenario.value = 'normal'
}
async function close() {
  panel.value = ''
  if (route.query.panel)
    await router.replace({ path: '/compare', query: { ...route.query, panel: undefined } })
}
watch([sport, league, status, date, category, operator, search, sort, scenario], () => {
  visibleCount.value = 6
  opportunityCount.value = 6
})
watch(category, () => {
  operator.value = ''
})
onMounted(() => {
  try {
    const value = localStorage.getItem('aegis-sports-format')
    if (formats.some((f) => f.id === value)) format.value = value as OddsFormat
    const ids: unknown = JSON.parse(localStorage.getItem('aegis-sports-followed') ?? '[]')
    if (Array.isArray(ids))
      followed.value = ids.filter(
        (id): id is string => typeof id === 'string' && planningMatches.some((f) => f.id === id),
      )
  } catch {
    /* Ignore invalid local preferences. */
  }
})
watch(
  () => route.fullPath,
  () => {
    if (['odds', 'arbitrage', 'ranking'].includes(String(route.query.view)))
      view.value = String(route.query.view)
    const f = planningMatches.find((f) => f.id === route.query.match)
    const m = f?.markets.find((m) => m.id === route.query.market) ?? f?.markets[0]
    if (f) {
      active.value = f
      sport.value = f.sport
      if (m) activeMarket.value = m
    }
    const op = String(route.query.platform ?? '')
    if (planningOperators.some((p) => p.id === op)) operator.value = op
    const name = String(route.query.panel ?? '')
    if (name === 'reminders') panel.value = '提醒中心'
    else if (name === 'movements') panel.value = '滚球动态'
    else if (name === 'opportunity' && f && m) panel.value = '对冲试算'
    else if (name === 'market' && f && m) panel.value = '玩法规则'
    else if (name === 'quote' && f && m) {
      const q = m.quotes.find((q) => q.operator === op)
      if (q) {
        selectedQuote.value = { quote: q, index: 0 }
        panel.value = '报价详情'
      }
    }
  },
  { immediate: true },
)
const faqs = [
  {
    q: '如何比较同盘口赔率？',
    a: '先选赛事，再选玩法、时段和盘口线。每个选项独立比较，仅在相同规则与有效报价之间取最优赔率。',
  },
  {
    q: '市场百分比和理论价差是什么？',
    a: '完整互斥赛果下，将每个结果的最优十进制赔率取倒数后相加。市场百分比为该和乘100%；预算理论收益率为（1 ÷ 该和 − 1）×100%。不等同扣费后净收益。',
  },
  {
    q: '为什么部分玩法不显示对冲收益？',
    a: '双重机会存在选项重叠，整数盘口可能走盘，平局退款存在本金退回。它们需要不同的结算模型，本页保留比价与规则说明。',
  },
  {
    q: '排名的三项指标如何计算？',
    a: '典型抽水取完整盘口抽水的中位数；最优赔率指标取第10百分位；胜负盘抽水只取胜负玩法中位数。公开计算面板可逐步核对。',
  },
  {
    q: '报价、比分多久刷新？',
    a: '当前用于产品规划，展示固定本地快照。可切换快照A/B查看涨跌反馈；后续的自动刷新策略由产品与后台统一确定。',
  },
  {
    q: '跨平台赛事怎样关联？',
    a: '此原型使用已经关联好的示例赛事。正式关联逻辑留在后台处理，前端只消费关联结果。',
  },
  {
    q: 'Bot 跟踪是否会向外发送？',
    a: '本轮仅预览关联、通知配置和测试消息；所有记录保存在本地，不发送Telegram消息。',
  },
]
</script>
<template>
  <div class="sports-page pw-workspace">
    <h1 class="sr-only">体育对比</h1>
    <div class="sp-compare-toolbar">
      <div class="sp-page-tabs ae-glass">
        <button
          v-for="(name, id) in { odds: '赔率对比', arbitrage: '套利机会', ranking: '平台排名' }"
          :key="id"
          :aria-pressed="view === id"
          :class="{ active: view === id }"
          @click="view = id"
        >
          {{ name
          }}<span v-if="id === 'arbitrage' && opportunities.length" class="sp-count">{{
            opportunities.length
          }}</span>
        </button>
      </div>
      <button
        class="sp-options-button ae-glass"
        :aria-label="`玩法与赔率设置 · ${formatName}`"
        @click="open('玩法与赔率设置')"
      >
        <Menu :size="20" />
      </button>
    </div>
    <StatePanel
      v-if="dataMode !== 'demo'"
      title="暂无赛事数据"
      description="当前产品原型使用本地数据配置。"
    />
    <template v-else
      ><div class="pw-search-row">
        <div ref="searchWrap" class="pw-search-wrap">
          <label class="sp-search ae-glass"
            ><Search :size="18" /><input
              v-model="search"
              role="combobox"
              aria-label="搜索球队或联赛"
              :aria-expanded="searchOpen && !!search"
              aria-controls="pw-search-options"
              :aria-activedescendant="`pw-search-${searchIndex}`"
              placeholder="搜索球队 / 选手 / 联赛"
              @focus="searchOpen = true"
              @input="searchChange"
              @keydown="searchKey"
          /></label>
          <div
            v-if="searchOpen && search"
            id="pw-search-options"
            class="pw-search-options"
            role="listbox"
          >
            <button
              v-for="(f, i) in searchResults"
              :key="f.id"
              :id="`pw-search-${i}`"
              role="option"
              :aria-selected="searchIndex === i"
              @pointerdown.prevent
              @click="pickFixture(f)"
            >
              <strong>{{ f.home }} vs {{ f.away }}</strong
              ><small
                >{{ f.league }} · {{ f.startsAt.slice(5, 10) }} · {{ sportName(f.sport) }}</small
              >
            </button>
            <p v-if="!searchResults.length">暂无匹配，可尝试联赛或球队关键词。</p>
          </div>
        </div>
        <button class="sp-identify ae-glass" @click="open('注单识别')">
          <ScanLine :size="18" />识别
        </button>
      </div>
      <div class="pw-sport-tabs">
        <button
          v-for="id in ['football', 'basketball', 'tennis']"
          :key="id"
          :aria-pressed="sport === id"
          :class="{ selected: sport === id }"
          @click="chooseSport(id)"
        >
          <SportIcon :sport="id" :size="20" />{{ sportName(id) }}</button
        ><button
          :class="{ selected: !['football', 'basketball', 'tennis'].includes(sport) }"
          @click="open('体育项目')"
        >
          <SportIcon sport="all" :size="20" />{{
            sport === 'all'
              ? '全部体育'
              : !['football', 'basketball', 'tennis'].includes(sport)
                ? sportName(sport)
                : '更多体育'
          }}
        </button>
      </div>
      <div class="pw-status-row">
        <div class="pw-tabs pw-status">
          <button
            v-for="(name, id) in {
              popular: '热门',
              all: '全部',
              live: '滚球',
              upcoming: '赛前',
              followed: '关注',
            }"
            :key="id"
            :aria-pressed="status === id"
            :class="{ selected: status === id }"
            @click="status = id"
          >
            {{ name }}
          </button>
        </div>
        <button
          class="pw-date-button"
          :class="{ selected: date }"
          :aria-label="date ? `日期 ${date}` : '日期筛选'"
          @click="open('日期筛选')"
        >
          <CalendarDays :size="18" /><small v-if="date">{{ date.slice(5) }}</small>
        </button>
      </div>
      <div class="pw-filters">
        <GlassSelect v-model="category" label="平台类型"
          ><option v-for="(name, id) in categoryNames" :key="id" :value="id">
            {{ id === 'all' ? '全部类型' : name }}
          </option></GlassSelect
        >
        <GlassSelect v-model="league" label="联赛" searchable
          ><option value="">全部联赛</option>
          <option v-for="name in leagues" :key="name" :value="name">
            {{ name }}（{{ planningMatches.filter((f) => f.league === name).length }}）
          </option></GlassSelect
        ><GlassSelect v-model="operator" label="平台" searchable
          ><option value="">全部平台</option>
          <option
            v-for="p in planningOperators.filter(
              (p) => category === 'all' || p.category === category,
            )"
            :key="p.id"
            :value="p.id"
          >
            {{ p.name }}（{{
              planningMatches.filter((f) =>
                f.markets.some((m) => m.quotes.some((q) => q.operator === p.id)),
              ).length
            }}）
          </option></GlassSelect
        ><button @click="open('筛选条件')">筛选</button>
      </div>
      <div class="pw-data-row">
        <span class="pw-list-summary"
          >{{ fixtures.length }} 场赛事 · {{ operators.length }} 家平台</span
        >
        <div class="pw-data-tools">
          <button
            aria-label="数据来源与帮助"
            title="数据来源与帮助"
            @click="open('数据来源与帮助')"
          >
            <Info :size="17" />
          </button>
          <button aria-label="Bot 跟踪" title="Bot 跟踪" @click="open('Bot 跟踪')">
            <Send :size="17" />
          </button>
          <button
            :aria-label="`提醒设置 ${tracking.reminders.length} 条`"
            title="提醒中心"
            @click="open('提醒中心')"
          >
            <Bell :size="17" /><small v-if="tracking.reminders.length">{{
              tracking.reminders.length
            }}</small>
          </button>
          <button
            :aria-label="`切换快照 · 当前${snapshot % 2 ? 'B' : 'A'}`"
            title="切换数据快照"
            @click="snapshot++"
          >
            <RefreshCw :size="16" /><span>{{ snapshot % 2 ? 'B' : 'A' }}</span>
          </button>
        </div>
      </div>
      <template v-if="view === 'odds'">
        <FixtureCard
          v-for="f in fixtures.slice(0, visibleCount)"
          :key="`${f.id}-${snapshot}-${scenario}`"
          :fixture="f"
          :format="format"
          :enabled="enabled"
          :followed="followed.includes(f.id)"
          @follow="follow"
          @tool="tool"
          @quote="quote"
        /><StatePanel
          v-if="!fixtures.length"
          title="暂无匹配赛事"
          description="调整体育、日期、联赛或平台筛选。"
        /><button v-if="!fixtures.length" class="sp-secondary sp-full" @click="reset">
          重置筛选</button
        ><button
          v-if="fixtures.length > visibleCount"
          class="sp-secondary sp-full pw-load-more"
          @click="visibleCount += 6"
        >
          显示更多赛事 · 已展示 {{ Math.min(visibleCount, fixtures.length) }} /
          {{ fixtures.length }}
        </button></template
      >
      <template v-else-if="view === 'arbitrage'"
        ><article
          v-for="item in opportunities.slice(0, opportunityCount)"
          :key="`${item.fixture.id}-${item.market.id}`"
          class="sp-card pw-opportunity"
        >
          <p class="pw-muted">{{ sportName(item.fixture.sport) }} · {{ item.fixture.league }}</p>
          <h3>{{ item.fixture.home }} vs {{ item.fixture.away }}</h3>
          <p class="pw-muted">
            {{ item.market.label }} · {{ item.market.scope }} · {{ item.market.line }}
          </p>
          <strong class="pw-opportunity-profit"
            >+{{ number(item.result.roi) }}%<small>理论毛收益率</small></strong
          >
          <div v-for="(selection, i) in item.market.selections" :key="i" class="pw-opportunity-leg">
            <span
              >{{ planningOperators.find((p) => p.id === item.result.best[i]!.operator)?.name }} ·
              {{ selection }}</span
            ><b>{{ formatOdds(item.result.best[i]!.prices[i]!, format) }}</b>
          </div>
          <button class="sp-primary sp-full" @click="tool('对冲试算', item.fixture, item.market)">
            查看方案<ChevronRight :size="14" />
          </button>
        </article>
        <StatePanel
          v-if="!opportunities.length"
          title="暂无匹配的套利候选"
          description="可切换体育、平台或日期查看其他示例。"
        /><button
          v-if="opportunities.length > opportunityCount"
          class="sp-secondary sp-full"
          @click="opportunityCount += 6"
        >
          显示更多机会 · {{ opportunityCount }} / {{ opportunities.length }}
        </button></template
      >
      <Rankings
        v-else
        :fixtures="fixtures"
        :operators="operators"
        :scope="scope"
        v-model:metric="metric"
        @audit="open('公开计算核验')"
        @report="open('导出报告')"
        @operator="
          (id) => {
            operator = id
            view = 'odds'
            status = 'all'
          }
        "
      />
      <button
        v-if="Object.keys(compared).length"
        class="sp-comparison-bar"
        @click="open('完整比价')"
      >
        已选 {{ Object.keys(compared).length }} 场 · 查看比价<ChevronRight :size="14" />
      </button>
    </template>
    <SportsSheet :open="!!panel" :title="panel" @close="close">
      <div class="pw-sheet">
        <template v-if="panel === '玩法与赔率设置'"
          ><h3>赔率显示格式</h3>
          <button
            v-for="f in formats"
            :key="f.id"
            class="sp-format-option"
            :class="{ selected: format === f.id }"
            :aria-pressed="format === f.id"
            @click="pickFormat(f.id)"
          >
            <span
              ><strong>{{ f.label }}</strong
              ><small>{{ f.description }}</small></span
            ><b>{{ formatOdds(1.9, f.id) }}</b>
          </button>
          <h3>显示的玩法分组</h3>
          <label v-for="(name, id) in familyNames" :key="id" class="sp-setting-row"
            >{{ name
            }}<input
              v-model="enabled"
              type="checkbox"
              :value="id"
              :disabled="enabled.length === 1 && enabled.includes(id)" /></label
          ><label class="sp-field"
            >数据场景<GlassSelect v-model="scenario" label="数据场景"
              ><option value="normal">完整数据</option>
              <option value="locked">锁盘较多</option>
              <option value="partial">部分报价缺失</option>
              <option value="empty">筛选空结果</option></GlassSelect
            ></label
          ><button class="sp-primary sp-full" @click="close">完成设置</button></template
        >
        <template v-else-if="panel === '体育项目'"
          ><label class="sp-field"
            >搜索体育项目<input
              v-model="catalogSearch"
              type="search"
              aria-label="搜索体育项目"
              placeholder="输入项目名称"
          /></label>
          <div class="pw-tabs">
            <button
              v-for="(name, id) in { all: '全部', sports: '体育', esports: '电竞' }"
              :key="id"
              :class="{ selected: catalogGroup === id }"
              @click="catalogGroup = id"
            >
              {{ name }}
            </button>
          </div>
          <button class="sp-secondary sp-full" @click="chooseCatalog('all')">
            查看全部体育（{{ sportsCatalog.length }}）
          </button>
          <div class="pw-catalog">
            <button
              v-for="s in catalogue"
              :key="s.id"
              :class="{ selected: sport === s.id }"
              @click="chooseCatalog(s.id)"
            >
              <SportIcon :sport="s.id" :size="22" /><span>{{ s.name }}</span
              ><small>{{ planningMatches.filter((f) => f.sport === s.id).length }} 场</small>
            </button>
          </div></template
        >
        <DatePicker v-else-if="panel === '日期筛选'" :selected="date" @choose="selectDate" />
        <template v-else-if="panel === '筛选条件'"
          ><label class="sp-field"
            >排序<GlassSelect v-model="sort" label="赛事排序"
              ><option value="time">赛中与开赛时间</option>
              <option value="follow">关注优先</option>
              <option value="value">最优价值（最低市场百分比）</option>
              <option value="high">平均回报从高到低</option>
              <option value="low">平均回报从低到高</option>
              <option value="operator">平台名称 A–Z</option></GlassSelect
            ></label
          >
          <p class="pw-muted">筛选、排序与排名的范围同步。</p>
          <div class="sp-split-actions">
            <button class="sp-secondary" @click="reset">重置</button
            ><button class="sp-primary" @click="close">查看 {{ fixtures.length }} 场</button>
          </div>
          <button class="sp-sheet-link" @click="open('导出报告')">
            <Share2 :size="14" />导出当前范围报告
          </button></template
        >
        <SlipMatcher v-else-if="panel === '注单识别'" @add="addSlips" />
        <ComparisonBoard
          v-else-if="panel === '完整比价'"
          :selected="compared"
          :format="format"
          @change="compared = $event"
          @quote="quote"
        />
        <FixtureCenter v-else-if="panel === '比赛中心'" :key="active.id" :fixture="active" />
        <AllocationPlan
          v-else-if="panel === '对冲试算'"
          :key="`${active.id}-${activeMarket.id}-${selectedQuote?.quote.operator ?? 'auto'}`"
          :fixture="active"
          :market="activeMarket"
          :format="format"
          :selected="selectedQuote"
        />
        <template v-else-if="panel === '报价详情'"
          ><button
            v-if="previousPanel === '完整比价'"
            class="sp-sheet-link"
            @click="panel = '完整比价'"
          >
            ← 返回完整比价
          </button>
          <p class="pw-muted">{{ active.league }}</p>
          <h3>{{ active.home }} vs {{ active.away }}</h3>
          <p class="pw-muted">
            {{ activeMarket.label }} · {{ activeMarket.scope }} · {{ activeMarket.line }}
          </p>
          <div v-if="selectedQuote" class="pw-selected-quote">
            所选报价：{{
              planningOperators.find((p) => p.id === selectedQuote!.quote.operator)?.name
            }}
            · {{ activeMarket.selections[selectedQuote.index]
            }}<strong>{{
              formatOdds(selectedQuote.quote.prices[selectedQuote.index] ?? null, format)
            }}</strong>
          </div>
          <button class="sp-primary sp-full" @click="plan">保留所选报价并试算</button
          ><button class="sp-sheet-link" @click="open('玩法规则')">查看结算规则 →</button
          ><RouterLink
            class="sp-sheet-link"
            :to="{
              path: '/ai',
              query: {
                analyze: '1',
                q: `${active.home}对${active.away}怎么看？请分析${activeMarket.scope}，${activeMarket.line}`,
              },
            }"
            >让 AI 解读当前数据 →</RouterLink
          ></template
        >
        <template v-else-if="panel === '玩法规则'"
          ><h3>{{ activeMarket.label }} · {{ activeMarket.line }}</h3>
          <p class="pw-body">{{ activeMarket.rule }}</p>
          <p class="pw-muted">
            {{ activeMarket.scope }} · {{ activeMarket.selections.join(' / ') }}
          </p>
          <RouterLink
            class="sp-sheet-link"
            :to="{
              path: '/ai',
              query: {
                analyze: '1',
                q: `${active.home}对${active.away}怎么看？请分析${activeMarket.scope}，${activeMarket.line}`,
              },
            }"
            >让 AI 解读当前数据</RouterLink
          ></template
        >
        <PlanningTrend
          v-else-if="panel === '赔率走势'"
          :key="`${active.id}-${activeMarket.id}`"
          :match="active"
          :market="activeMarket"
          :format="format"
        />
        <TrackingPanel
          v-else-if="['提醒设置', '提醒中心', 'Bot 跟踪'].includes(panel)"
          :key="`${panel}-${active.id}-${activeMarket.id}`"
          :mode="panel === '提醒设置' ? 'settings' : panel === 'Bot 跟踪' ? 'bot' : 'center'"
          :fixture="active"
          :market="activeMarket"
        />
        <CalculationAudit
          v-else-if="panel === '公开计算核验'"
          :fixtures="fixtures"
          :operators="operators"
          :metric="metric"
        />
        <ReportExport
          v-else-if="panel === '导出报告'"
          :fixtures="fixtures"
          :operators="operators"
          :metric="metric"
          :scope="scope"
        />
        <template v-else-if="panel === '数据来源与帮助'"
          ><div class="pw-source-intro">
            <Info :size="28" />
            <h3>比较每个价格，也看清它的口径</h3>
            <p>{{ planningSnapshot }} · 快照 {{ snapshot % 2 ? 'B' : 'A' }}</p>
          </div>
          <dl class="pw-source-facts">
            <div>
              <dt>赛事覆盖</dt>
              <dd>{{ planningMatches.length }} 场 · {{ sportsCatalog.length }} 项体育 / 电竞</dd>
            </div>
            <div>
              <dt>平台覆盖</dt>
              <dd>{{ planningOperators.length }} 家 · 加密体育 / 传统体育 / 预测市场</dd>
            </div>
            <div>
              <dt>当前范围</dt>
              <dd>{{ scope }}</dd>
            </div>
            <div>
              <dt>数据来源</dt>
              <dd>本地产品规划数据 · SPORTS-PLAN-1025</dd>
            </div>
            <div>
              <dt>关联处理</dt>
              <dd>使用已关联好的样例，正式逻辑由后台处理。</dd>
            </div>
          </dl>
          <details v-for="faq in faqs" :key="faq.q" class="pw-faq">
            <summary>{{ faq.q }}</summary>
            <p>{{ faq.a }}</p>
          </details>
          <button class="sp-primary sp-full" @click="open('公开计算核验')">
            查看公开计算过程
          </button></template
        >
        <template v-else
          ><p class="pw-muted">{{ panel }} · 可通过比赛卡片查看对应玩法、趋势和提醒。</p>
          <QuoteMatrix
            :market="activeMarket"
            :format="format"
            @quote="(q, i) => quote(active, activeMarket, q, i)"
        /></template></div
    ></SportsSheet>
  </div>
</template>
