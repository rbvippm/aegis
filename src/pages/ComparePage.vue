<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Search,
  ScanLine,
  ChevronDown,
  ChevronRight,
  Bell,
  Info,
  TriangleAlert,
  X,
} from '@lucide/vue'
import { dataMode } from '@/shared/api/config'
import SportsMatchCard from '@/features/sports/SportsMatchCard.vue'
import SportIcon from '@/features/sports/SportIcon.vue'
import SportsRanking from '@/features/sports/SportsRanking.vue'
import SportsSheet from '@/features/sports/SportsSheet.vue'
import SportsPlan from '@/features/sports/SportsPlan.vue'
import SportsSlip from '@/features/sports/SportsSlip.vue'
import SportsAlert from '@/features/sports/SportsAlert.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import { sportsMatches, sportsMovements } from '@/mocks/sports'
import { allocateBudget, bestPrice, formatOdds } from '@/features/sports/logic'
import type {
  AlertSetting,
  OddsFormat,
  SlipLeg,
  SportsMarket,
  SportsMatch,
} from '@/features/sports/types'

const route = useRoute()
const router = useRouter()
const view = ref('odds')
const format = ref<OddsFormat>('HK')
const formats: { id: OddsFormat; label: string; description: string }[] = [
  { id: 'HK', label: '港盘 HK', description: '净盈利倍数' },
  { id: 'MY', label: '马盘 MY', description: '正负水位' },
  { id: 'ID', label: '印尼盘 ID', description: '正负赔率' },
  { id: 'DEC', label: '十进制 DEC', description: '含本金的总返还倍数' },
]
const formatName = computed(() => formats.find((f) => f.id === format.value)?.label)
const sport = ref('basketball')
const search = ref('')
const status = ref('all')
const platform = ref('')
const league = ref('')
const sort = ref('time')
const followed = ref<string[]>([])
const alertSettings = ref<AlertSetting[]>([])
const feedback = ref('')
const panel = ref<string | null>(null)
const activeMatch = ref<SportsMatch>(sportsMatches[0]!)
const activeMarket = ref<SportsMarket>(activeMatch.value.markets[0]!)
const selectedQuote = ref<{ platform: string; side: 'home' | 'away' }>()
const compared = ref<Record<string, string>>({})
const slipLegs = ref<SlipLeg[]>([])
const slipBudget = ref(1000)
const slipResult = computed(() =>
  allocateBudget(
    slipBudget.value,
    slipLegs.value.map((l) => l.decimal),
  ),
)
const filteredMatches = computed(() =>
  sportsMatches
    .filter(
      (m) =>
        (sport.value === 'all' || m.sport === sport.value) &&
        (!league.value || m.league === league.value) &&
        (!search.value.trim() || `${m.home}${m.away}${m.league}`.includes(search.value.trim())) &&
        (status.value === 'all' || status.value === 'followed'
          ? status.value !== 'followed' || followed.value.includes(m.id)
          : m.phase === status.value),
    )
    .sort((a, b) =>
      sort.value === 'follow'
        ? Number(followed.value.includes(b.id)) - Number(followed.value.includes(a.id))
        : Number(a.phase !== 'live') - Number(b.phase !== 'live'),
    ),
)
const candidates = computed(() =>
  filteredMatches.value.flatMap((match) =>
    match.markets
      .filter((m) => m.calculationEligible)
      .flatMap((market) => {
        const q = {
          ...market,
          quotes: market.quotes.filter((q) => !platform.value || q.platform === platform.value),
        }
        const home = bestPrice(q, 'home'),
          away = bestPrice(q, 'away')
        const result = home && away ? allocateBudget(1000, [home, away]) : null
        return result && result.gross > 0 ? [{ match, market: q, roi: result.roi }] : []
      }),
  ),
)
const leagues = computed(() => [
  ...new Set(
    sportsMatches
      .filter((m) => sport.value === 'all' || m.sport === sport.value)
      .map((m) => m.league),
  ),
])
watch(sport, () => {
  league.value = ''
  if (status.value === 'followed') status.value = 'all'
})
function safeStore(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}
function follow(id: string) {
  followed.value = followed.value.includes(id)
    ? followed.value.filter((x) => x !== id)
    : [...followed.value, id]
  safeStore('aegis-sports-followed', followed.value)
}
function open(kind: string, match?: SportsMatch, market?: SportsMarket) {
  if (match) activeMatch.value = match
  activeMarket.value = market ?? (match ? match.markets[0]! : activeMarket.value)
  feedback.value = ''
  panel.value = kind
}
function quote(match: SportsMatch, market: SportsMarket, platform: string, side: 'home' | 'away') {
  selectedQuote.value = { platform, side }
  open('报价详情', match, market)
}
function tool(kind: string, match: SportsMatch, market: SportsMarket) {
  if (kind === '完整比价') compared.value = { ...compared.value, [match.id]: market.id }
  open(kind, match, market)
}
function plan(match: SportsMatch, market: SportsMarket, keepSelected = false) {
  if (!keepSelected) selectedQuote.value = undefined
  open('机会核验', match, market)
}
async function close() {
  panel.value = null
  if (route.query.panel)
    await router.replace({ path: '/compare', query: { ...route.query, panel: undefined } })
}
watch(
  () => route.query.panel,
  (value) => {
    if (value === 'reminders') open('提醒中心')
  },
  { immediate: true },
)
function removeAlert(index: number) {
  alertSettings.value.splice(index, 1)
  safeStore('aegis-sports-alerts', alertSettings.value)
}
function saveAlert(setting: AlertSetting) {
  const next = [
    ...alertSettings.value.filter(
      (x) =>
        !(
          x.matchId === setting.matchId &&
          x.type === setting.type &&
          x.selection === setting.selection
        ),
    ),
    setting,
  ]
  if (safeStore('aegis-sports-alerts', next)) {
    alertSettings.value = next
    feedback.value = '提醒设置已保存。'
  } else feedback.value = '本机存储不可用，设置未保存。'
}
function pickFormat(id: OddsFormat) {
  format.value = id
  try {
    localStorage.setItem('aegis-sports-format', id)
  } catch {
    /* preference is session-only */
  }
  void close()
}
function resetFilters() {
  search.value = ''
  status.value = 'all'
  platform.value = ''
  league.value = ''
  sport.value = 'basketball'
}
function addCompared(event: Event) {
  const id = (event.target as HTMLSelectElement).value
  const match = sportsMatches.find((m) => m.id === id)
  if (match) compared.value = { ...compared.value, [id]: match.markets[0]!.id }
}
function getComparedMarket(id: string) {
  const match = sportsMatches.find((m) => m.id === id)!
  return match.markets.find((m) => m.id === compared.value[id]) ?? match.markets[0]!
}
function importValidated(legs: SlipLeg[]) {
  slipLegs.value = legs
  open('注单分配试算')
}
onMounted(() => {
  try {
    const saved = localStorage.getItem('aegis-sports-format')
    if (formats.some((f) => f.id === saved)) format.value = saved as OddsFormat
    const ids: unknown = JSON.parse(localStorage.getItem('aegis-sports-followed') ?? '[]')
    if (Array.isArray(ids))
      followed.value = ids.filter(
        (x): x is string => typeof x === 'string' && sportsMatches.some((m) => m.id === x),
      )
    const alerts: unknown = JSON.parse(localStorage.getItem('aegis-sports-alerts') ?? '[]')
    if (Array.isArray(alerts))
      alertSettings.value = alerts.filter((x): x is AlertSetting =>
        Boolean(
          x &&
          typeof x === 'object' &&
          sportsMatches.some((m) => m.id === x.matchId) &&
          ['price', 'line', 'status'].includes(x.type) &&
          typeof x.selection === 'string' &&
          typeof x.cooldownMinutes === 'number' &&
          typeof x.windowSeconds === 'number' &&
          typeof x.merge === 'boolean' &&
          (x.target === null || typeof x.target === 'number'),
        ),
      )
  } catch {
    /* Corrupt or unavailable local preferences do not block the page. */
  }
})
// Homepage links resolve only known views, events and markets; untrusted query values are ignored.
watch(
  () => route.fullPath,
  () => {
    const nextView = String(route.query.view ?? '')
    if (['odds', 'arbitrage', 'ranking'].includes(nextView)) view.value = nextView
    if (dataMode !== 'demo') return
    const event = sportsMatches.find((m) => m.id === route.query.match)
    const selectedMarket =
      event?.markets.find((m) => m.id === route.query.market) ?? event?.markets[0]
    if (event) {
      sport.value = event.sport
      activeMatch.value = event
      if (selectedMarket) activeMarket.value = selectedMarket
    }
    const operator = String(route.query.platform ?? '')
    if (['A', 'B', 'C', 'D', 'E', 'F'].includes(operator)) platform.value = operator
    const kind = String(route.query.panel ?? '')
    if (kind === 'movements') open('滚球变动', event, selectedMarket)
    else if (event && selectedMarket) {
      if (
        kind === 'quote' &&
        selectedMarket.quotes.some((q) => q.platform === operator && q.status === 'active')
      )
        quote(event, selectedMarket, operator, 'home')
      else if (kind === 'market') open('盘口与结算规则', event, selectedMarket)
      else if (kind === 'opportunity' && selectedMarket.calculationEligible)
        open('机会核验', event, selectedMarket)
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="sports-page">
    <section class="sp-intro">
      <div>
        <h1>体育对比</h1>
        <p>同盘口比价，看清每次变化</p>
      </div>
      <button class="sp-format-button ae-glass" @click="open('赔率显示方式')">
        {{ formatName }}<ChevronDown :size="14" />
      </button>
    </section>
    <div class="sp-page-tabs ae-glass" aria-label="体育业务">
      <button
        v-for="tab in [
          { id: 'odds', name: '赔率对比' },
          { id: 'arbitrage', name: '套利机会' },
          { id: 'ranking', name: '平台排名' },
        ]"
        :key="tab.id"
        :class="{ active: view === tab.id }"
        :aria-pressed="view === tab.id"
        @click="view = tab.id"
      >
        {{ tab.name
        }}<span
          v-if="tab.id === 'arbitrage' && dataMode === 'demo' && candidates.length"
          class="sp-count"
          >{{ candidates.length }}</span
        >
      </button>
    </div>
    <StatePanel
      v-if="dataMode !== 'demo'"
      title="暂无赛事数据"
      description="接入报价与赛事服务后，将展示有效报价、走势与排名。"
    />
    <template v-else>
      <template v-if="view !== 'ranking'">
        <div class="sp-search-row">
          <label class="sp-search ae-glass"
            ><Search :size="19" /><input
              v-model="search"
              type="search"
              aria-label="搜索球队或联赛"
              placeholder="搜索球队 / 联赛" /></label
          ><button class="sp-identify ae-glass" @click="open('注单识别')">
            <ScanLine :size="19" />识别
          </button>
        </div>
        <div class="sp-sport-tabs">
          <button
            v-for="item in [
              { id: 'football', name: '足球' },
              { id: 'basketball', name: '篮球' },
              { id: 'tennis', name: '网球' },
              { id: 'all', name: '更多' },
            ]"
            :key="item.id"
            :class="{ active: sport === item.id }"
            :aria-pressed="sport === item.id"
            @click="sport = item.id"
          >
            <SportIcon :sport="item.id" /><span>{{ item.name }}</span>
          </button>
        </div>
        <div class="sp-status-tabs">
          <button
            v-for="tab in [
              { id: 'all', name: '全部' },
              { id: 'live', name: '滚球' },
              { id: 'upcoming', name: '赛前' },
              { id: 'followed', name: '已关注' },
            ]"
            :key="tab.id"
            :class="{ active: status === tab.id }"
            :aria-pressed="status === tab.id"
            @click="status = tab.id"
          >
            {{ tab.name }}
          </button>
        </div>
        <div class="sp-filters">
          <label
            ><span class="sr-only">联赛</span
            ><select v-model="league" aria-label="联赛">
              <option value="">联赛</option>
              <option v-for="name in leagues" :key="name">{{ name }}</option></select
            ><ChevronDown :size="12" /></label
          ><label
            ><span class="sr-only">平台</span
            ><select v-model="platform" aria-label="平台">
              <option value="">平台</option>
              <option v-for="id in ['A', 'B', 'C', 'D', 'E']" :key="id" :value="id">
                平台 {{ id }}
              </option></select
            ><ChevronDown :size="12" /></label
          ><button @click="open('筛选条件')">筛选<ChevronDown :size="12" /></button>
        </div>
      </template>
      <div class="sp-data-line">
        <button @click="open('数据来源')">数据来源<ChevronRight :size="12" /></button
        ><button v-if="alertSettings.length" @click="open('提醒中心')">
          提醒设置 {{ alertSettings.length }} 条<Bell :size="12" />
        </button>
      </div>
      <div v-if="view === 'odds'" class="sp-match-list">
        <SportsMatchCard
          v-for="match in filteredMatches.slice(0, 1)"
          :key="match.id"
          :match="match"
          :format="format"
          :platform="platform"
          :followed="followed.includes(match.id)"
          @follow="follow"
          @quote="quote"
          @tool="tool"
        />
        <div v-if="!filteredMatches.length" class="sp-card sp-empty">
          <StatePanel title="暂无匹配赛事" description="试试其他体育、联赛或关注条件。" /><button
            class="sp-secondary"
            @click="resetFilters"
          >
            重置筛选
          </button>
        </div>
        <button class="sp-movement-summary" @click="open('滚球变动')">
          <TriangleAlert :size="16" /><span
            >水位变动
            {{ sportsMovements.filter((m) => m.type === '水位' || m.type === '盘口').length }} 条 ·
            查看</span
          ><ChevronRight :size="14" />
        </button>
        <button class="sp-card sp-prediction" @click="open('预测合约')">
          <ChartIcon /><span
            ><strong>预测合约</strong><small>合约、深度与结算规则需分别核对</small></span
          ><b>独立查看<ChevronRight :size="13" /></b>
        </button>
        <SportsMatchCard
          v-for="match in filteredMatches.slice(1)"
          :key="match.id"
          :match="match"
          :format="format"
          :platform="platform"
          :followed="followed.includes(match.id)"
          @follow="follow"
          @quote="quote"
          @tool="tool"
        />
      </div>
      <div v-else-if="view === 'arbitrage'" class="sp-opportunities">
        <p class="sp-small-note">报价与费用核验通过后，才能确认机会有效。</p>
        <article
          v-for="item in candidates"
          :key="`${item.match.id}-${item.market.id}`"
          class="sp-card"
        >
          <div class="sp-section-title">
            <h3>{{ item.match.home }} <span>VS</span> {{ item.match.away }}</h3>
            <span class="sp-status-chip">待核验</span>
          </div>
          <p class="sp-small-note">
            {{ item.market.scope }} · {{ item.market.label }} · {{ item.market.line }}
          </p>
          <div class="sp-opportunity-roi">
            <div>
              <strong>{{ item.roi.toFixed(2) }}%</strong><span>理论毛收益率</span>
            </div>
            <span class="sp-muted">净收益待核算</span>
          </div>
          <div v-for="side in ['home', 'away'] as const" :key="side" class="sp-opportunity-leg">
            <span>{{ item.market.selections[side === 'home' ? 0 : 1] }}</span
            ><strong>{{ formatOdds(bestPrice(item.market, side), format) }}</strong>
          </div>
          <button class="sp-primary sp-full" @click="plan(item.match, item.market)">
            查看方案<ChevronRight :size="15" />
          </button>
        </article>
        <StatePanel
          v-if="!candidates.length"
          title="暂无匹配的套利候选"
          description="只计算规则完整且两侧均有有效报价的市场。"
        />
      </div>
      <SportsRanking
        v-else
        @explain="open('排名指标说明')"
        @platform="
          (id) => {
            platform = id
            view = 'odds'
            sport = 'football'
            status = 'all'
            search = ''
            league = ''
          }
        "
      />
      <button
        v-if="Object.keys(compared).length && view === 'odds'"
        class="sp-comparison-bar"
        @click="open('完整比价')"
      >
        已选 {{ Object.keys(compared).length }} 场 · 查看比价<ChevronRight :size="15" />
      </button>
    </template>

    <SportsSheet :open="panel !== null" :title="panel ?? ''" @close="close">
      <StatePanel
        v-if="dataMode !== 'demo' && panel !== '赔率显示方式' && panel !== '数据来源'"
        title="暂无赛事数据"
        description="真实服务接入后开放赛事与提醒功能。"
      />
      <template v-else-if="panel === '赔率显示方式'"
        ><p class="sp-tool-subtitle">切换表达方式，实际价格不变</p>
        <button
          v-for="item in formats"
          :key="item.id"
          class="sp-format-option"
          :class="{ selected: format === item.id }"
          @click="pickFormat(item.id)"
        >
          <span
            ><strong>{{ item.label }}</strong
            ><small>{{ item.description }}</small></span
          ><b>{{ formatOdds(1.9, item.id) }}</b
          ><span class="sp-radio" :class="{ checked: format === item.id }"></span>
        </button>
        <p class="sp-notice sp-notice--blue"><Info :size="16" />赔率格式与让球盘口分别设置</p>
        <p class="sp-small-note">全局同步：比价 · 详情 · 套利方案</p></template
      >
      <SportsSlip v-else-if="panel === '注单识别'" :format="format" @validated="importValidated" />
      <SportsAlert
        v-else-if="panel === '设置变动提醒'"
        :key="`${activeMatch.id}-${activeMarket.id}`"
        :match="activeMatch"
        :market="activeMarket"
        :format="format"
        @save="saveAlert"
      />
      <SportsPlan
        v-else-if="panel === '机会核验'"
        :match="activeMatch"
        :market="activeMarket"
        :format="format"
        :selected="selectedQuote"
      />
      <template v-else-if="panel === '报价详情'"
        ><div class="sp-card sp-context">
          <h3>{{ activeMatch.home }} VS {{ activeMatch.away }}</h3>
          <p>{{ activeMarket.scope }} · {{ activeMarket.line }}</p>
          <div class="sp-context-selected">
            所选报价：平台 {{ selectedQuote?.platform }} ·
            {{ activeMarket.selections[selectedQuote?.side === 'home' ? 0 : 1] }} ·
            {{
              formatOdds(
                activeMarket.quotes.find((q) => q.platform === selectedQuote?.platform)?.[
                  selectedQuote?.side ?? 'home'
                ] ?? null,
                format,
              )
            }}
          </div>
        </div>
        <p class="sp-notice">报价时效和可用限额待核验。</p>
        <button class="sp-primary sp-full" @click="plan(activeMatch, activeMarket, true)">
          保留所选报价并试算</button
        ><button class="sp-sheet-link" @click="open('数据来源')">
          查看来源<ChevronRight :size="15" /></button
      ></template>
      <template v-else-if="panel === '筛选条件'"
        ><label class="sp-field"
          >赛事状态<select v-model="status">
            <option value="all">全部</option>
            <option value="live">滚球</option>
            <option value="upcoming">赛前</option>
            <option value="followed">已关注</option>
          </select></label
        ><label class="sp-field"
          >排序<select v-model="sort">
            <option value="time">赛中优先</option>
            <option value="follow">关注优先</option>
          </select></label
        >
        <p class="sp-small-note">联赛和平台筛选与主页保持一致。</p>
        <div class="sp-split-actions">
          <button class="sp-secondary" @click="resetFilters">重置</button
          ><button class="sp-primary" @click="close">查看 {{ filteredMatches.length }} 场</button>
        </div></template
      >
      <template v-else-if="panel === '完整比价'"
        ><label class="sp-field"
          >添加赛事<select aria-label="添加比价赛事" @change="addCompared">
            <option value="">选择赛事</option>
            <option v-for="m in sportsMatches" :key="m.id" :value="m.id">
              {{ m.home }} VS {{ m.away }}
            </option>
          </select></label
        >
        <article v-for="id in Object.keys(compared)" :key="id" class="sp-card">
          <div class="sp-section-title">
            <h3>
              {{ sportsMatches.find((m) => m.id === id)?.home }} VS
              {{ sportsMatches.find((m) => m.id === id)?.away }}
            </h3>
            <button :aria-label="`移除${id}`" @click="delete compared[id]"><X :size="17" /></button>
          </div>
          <p class="sp-small-note">
            {{ getComparedMarket(id).scope }} · {{ getComparedMarket(id).line }}
          </p>
          <table class="sp-full-quotes">
            <thead>
              <tr>
                <th>平台</th>
                <th v-for="label in getComparedMarket(id).selections" :key="label">{{ label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="q in getComparedMarket(id).quotes" :key="q.platform">
                <th>平台 {{ q.platform }}</th>
                <td v-for="side in ['home', 'away'] as const" :key="side">
                  {{
                    q.status === 'active'
                      ? formatOdds(q[side], format)
                      : q.status === 'stale'
                        ? '过期'
                        : '暂停'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </article>
        <p class="sp-small-note">各赛事独立比较，不混合计算套利。</p></template
      >
      <template v-else-if="panel === '盘口与结算规则'"
        ><h3>{{ activeMarket.scope }} · {{ activeMarket.line }}</h3>
        <p class="sp-tool-subtitle">当前两侧：{{ activeMarket.selections.join(' / ') }}</p>
        <p>只比较同赛事、同市场、同盘口线、同时段和同结算规则的有效报价。</p>
        <p class="sp-small-note">
          暂停及过期报价不参与最优价。其他盘口线需数据服务提供，本页不自动生成。
        </p></template
      >
      <template v-else-if="panel === '赔率走势'"
        ><div class="sp-card">
          <h3>{{ activeMatch.home }} · 平台 A</h3>
          <p class="sp-small-note">{{ activeMarket.scope }} · {{ activeMarket.line }}</p>
          <div class="sp-local-move">
            <span>上次记录</span
            ><strong>{{ formatOdds(activeMarket.quotes[0]?.previousHome ?? null, format) }}</strong
            ><ChevronRight :size="20" /><strong>{{
              formatOdds(activeMarket.quotes[0]?.home ?? null, format)
            }}</strong
            ><span>当前记录</span>
          </div>
          <p class="sp-small-note">当前记录较少，暂不绘制连续走势。</p>
        </div>
        <button class="sp-primary sp-full" @click="open('设置变动提醒')">
          设置变动提醒
        </button></template
      >
      <template v-else-if="panel === '滚球变动' || panel === '提醒中心'"
        ><div v-for="move in sportsMovements" :key="move.id" class="sp-card sp-movement">
          <div class="sp-section-title">
            <strong
              >{{ move.type
              }}{{ move.type === '盘口' ? '调整' : move.type === '水位' ? '下降' : '报价' }}</strong
            ><span>{{ move.time }}</span>
          </div>
          <p>{{ move.description }}</p>
          <small>{{ move.detail }}</small
          ><button
            class="sp-sheet-link"
            @click="
              open(
                '设置变动提醒',
                sportsMatches.find((m) => m.id === move.matchId),
              )
            "
          >
            设置提醒<ChevronRight :size="15" />
          </button>
        </div>
        <p class="sp-small-note">事件记录。</p>
        <section v-if="alertSettings.length" class="sp-card">
          <h3>已保存的提醒</h3>
          <div v-for="(setting, index) in alertSettings" :key="index" class="sp-setting-row">
            <span
              >{{ sportsMatches.find((m) => m.id === setting.matchId)?.home }} ·
              {{
                setting.type === 'price' ? '水位' : setting.type === 'line' ? '盘口' : '状态'
              }}</span
            ><button :aria-label="`删除提醒${index + 1}`" @click="removeAlert(index)">
              <X :size="17" />
            </button>
          </div></section
      ></template>
      <template v-else-if="panel === '排名指标说明'"
        ><div
          v-for="item in [
            {
              title: '典型抽水',
              text: '同口径完整市场抽水的中位数，越低通常代表典型报价成本越低。',
            },
            { title: '优势报价', text: '观察较低抽水分位，反映较优报价水平，不代表每一场都最优。' },
            {
              title: '最优报价占比',
              text: '同盘口有效结果中取得最优价的比例；并列按同一规则统计。',
            },
          ]"
          :key="item.title"
          class="sp-card"
        >
          <h3>{{ item.title }}</h3>
          <p class="sp-tool-subtitle">{{ item.text }}</p>
        </div>
        <p class="sp-notice sp-notice--blue">足球 / 全场亚洲让球 / 近7天 / 共同样本128场</p>
        <p class="sp-small-note">样本不足、过期报价不参与排名。</p>
        <RouterLink class="sp-sheet-link" to="/monitor" @click="close"
          >平台安全与资金详情 → 前往监测<ChevronRight :size="15" /></RouterLink
      ></template>
      <template v-else-if="panel === '预测合约'"
        ><h3>预测合约</h3>
        <p class="sp-tool-subtitle">
          合约结果、可成交价格、深度、费用和结算规则需要单独核验，不与体育报价直接混算。
        </p></template
      >
      <template v-else-if="panel === '数据来源'"
        ><h3>数据来源</h3>
        <p class="sp-tool-subtitle">赛事、平台、报价与排名按同一口径整理。</p>
        <p>比分和比赛时间为记录值。</p>
        <p class="sp-small-note">
          预算分配仅作数学试算；手续费、可用限额和报价有效期未确认前，不给出可执行收益。
        </p></template
      >
      <template v-else-if="panel === '注单分配试算'"
        ><p class="sp-tool-subtitle">同一赛事与两项完整结果已匹配。输入报价仍需外部验证。</p>
        <label class="sp-field"
          >总预算（USDT）<input
            v-model.number="slipBudget"
            type="number"
            min="0.02"
            max="1000000000"
        /></label>
        <div v-if="slipResult">
          <div v-for="(leg, index) in slipLegs" :key="index" class="sp-card">
            <h3>{{ leg.selection }} · {{ leg.platform }}</h3>
            <p>
              分配 {{ slipResult.stakes[index]?.toFixed(2) }} USDT ·
              {{ formatOdds(leg.decimal, format) }}
            </p>
          </div>
          <p class="sp-gross">理论毛收益 {{ slipResult.gross.toFixed(2) }} USDT</p>
          <p class="sp-notice">费用、限额与报价有效期待核验；净收益待核算。</p>
        </div>
        <p v-else class="sp-notice">请输入有效预算。</p></template
      >
      <RouterLink
        v-if="
          dataMode === 'demo' &&
          ['报价详情', '盘口与结算规则', '机会核验', '滚球变动'].includes(panel ?? '')
        "
        class="sp-sheet-link"
        :to="{
          path: '/ai',
          query: {
            analyze: '1',
            q:
              panel === '机会核验'
                ? '帮我分析当前套利机会与预算分配'
                : panel === '滚球变动'
                  ? '帮我解读滚球盘口与水位变化'
                  : `${activeMatch.home}对${activeMatch.away}的${activeMarket.line}，同盘口报价怎么比较？`,
          },
        }"
        >让 AI 解读当前数据<ChevronRight :size="16"
      /></RouterLink>
      <p v-if="feedback" class="sp-feedback" role="status">{{ feedback }}</p>
    </SportsSheet>
  </div>
</template>
<script lang="ts">
import { ChartNoAxesColumn as ChartIcon } from '@lucide/vue'
</script>
<style src="@/features/sports/sports.css"></style>
