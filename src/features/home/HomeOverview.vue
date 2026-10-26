<script setup lang="ts">
import PlatformAccountLink from '@/shared/ui/PlatformAccountLink.vue'
import HomeEvents from './HomeEvents.vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, ShieldCheck, Search, Clock3, Wallet, Info } from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import { dataMode } from '@/shared/api/config'
import { sportsMatches, sportsRankings } from '@/mocks/sports'
import { researchPlatforms, researchSnapshot } from '@/mocks/monitoring-research'
import { researchChains } from '@/features/monitoring/research'
import type { OddsFormat, SportsMarket, SportsMatch } from '@/features/sports/types'
import { walletSummary } from './overview'

const route = useRoute(),
  router = useRouter()
const demo = dataMode === 'demo'
const ranking = ref('score')
const panel = ref(''),
  search = ref('')
const format = ref<OddsFormat>('HK')
const formats: { id: OddsFormat; label: string }[] = [
  { id: 'HK', label: '港盘 HK' },
  { id: 'MY', label: '马盘 MY' },
  { id: 'ID', label: '印尼盘 ID' },
  { id: 'DEC', label: '十进制 DEC' },
]
try {
  const saved = localStorage.getItem('aegis-sports-format')
  if (formats.some((f) => f.id === saved)) format.value = saved as OddsFormat
} catch {
  /* Optional preference. */
}
const formatName = computed(() => formats.find((f) => f.id === format.value)!.label)
const wallet = walletSummary(demo ? researchPlatforms : [])
const measured = demo ? researchPlatforms[0]! : null
const warning = demo
  ? researchPlatforms.find((p) => p.flowPercent !== null && p.flowPercent < -25)
  : null
const oddsRanks = demo
  ? sportsRankings
      .filter((p) => p.status === 'active' && p.share !== null && p.samples >= 30)
      .sort((a, b) => b.share! - a.share!)
      .slice(0, 3)
  : []
const platforms = demo ? researchPlatforms : []
const searchMatches = computed(() =>
  demo && search.value.trim()
    ? sportsMatches.filter((m) => `${m.home}${m.away}${m.league}`.includes(search.value.trim()))
    : [],
)
const searchPlatforms = computed(() =>
  demo && search.value.trim()
    ? platforms.filter((p) => p.name.toLowerCase().includes(search.value.trim().toLowerCase()))
    : [],
)
function compare(
  next = 'odds',
  event?: SportsMatch,
  selected?: SportsMarket,
  detail?: string,
  platform?: string,
) {
  void router.push({
    path: '/compare',
    query: {
      view: next,
      ...(event ? { match: event.id } : {}),
      ...(selected ? { market: selected.id } : {}),
      ...(detail ? { panel: detail } : {}),
      ...(platform ? { platform } : {}),
    },
  })
}
function selectFormat(value: OddsFormat) {
  format.value = value
  try {
    localStorage.setItem('aegis-sports-format', value)
  } catch {
    /* In-memory preference remains usable. */
  }
}
async function close() {
  panel.value = ''
  if (route.query.panel)
    await router.replace({ path: '/', query: { ...route.query, panel: undefined } })
}
watch(
  () => route.query.panel,
  (value) => {
    panel.value = ['search', 'cooperation'].includes(String(value)) ? String(value) : ''
  },
  { immediate: true },
)
</script>
<template>
  <div class="hr-overview">
    <div class="hr-heading">
      <h2>赛事与机会</h2>
      <RouterLink to="/compare?view=odds">全部赛事<ChevronRight :size="14" /></RouterLink>
    </div>
    <HomeEvents
      :format="format"
      :format-name="formatName"
      @format="panel = 'format'"
      @sources="panel = 'sources'"
    />
    <div class="hr-heading">
      <h2>平台资金监测</h2>
      <RouterLink to="/monitor">查看监测<ChevronRight :size="14" /></RouterLink>
    </div>
    <section class="hr-card hr-funding" aria-label="平台资金监测">
      <StatePanel v-if="!demo" title="暂无监测数据" description="资金与出金服务尚未接入。" />
      <template v-else>
        <div class="hr-stats">
          <div>
            <small class="hr-metric-label"><Clock3 :size="14" />小额实测平均出款</small
            ><strong>{{ measured?.smallMinutes ?? '—' }} <span>min</span></strong
            ><small>平台 A · USDT · &lt;1,000 U</small>
          </div>
          <div>
            <small class="hr-metric-label"><Wallet :size="14" />已标记热钱包总额</small
            ><strong class="hr-balance">{{ wallet.amount ?? '—' }}</strong
            ><small>{{ wallet.covered }} / {{ platforms.length }} 家有余额数据</small>
          </div>
        </div>
        <button class="hr-source-row" @click="panel = 'funding'">
          <span class="hr-sample"><Info :size="13" />平台 A · {{ measured?.samples }} 笔样本</span
          ><span>口径与来源<ChevronRight :size="13" /></span>
        </button>
        <button v-if="warning" class="hr-notice hr-funding-warning" @click="panel = 'warning'">
          <span class="hr-warning-icon"><ShieldCheck :size="18" /></span
          ><span class="hr-warning-copy"
            ><strong>{{ warning.name }} · 资金异动</strong
            ><small
              >热钱包净流出 <b>{{ Math.abs(warning.flowPercent!) }}%</b>，需关注</small
            ></span
          ><ChevronRight :size="14" />
        </button>
      </template>
    </section>
    <div class="hr-heading">
      <h2>平台榜单</h2>
      <RouterLink :to="ranking === 'score' ? '/monitor' : '/compare?view=ranking'"
        >{{ ranking === 'score' ? '全部平台' : '完整榜单' }}<ChevronRight :size="14"
      /></RouterLink>
    </div>
    <section class="hr-card" aria-label="平台榜单">
      <div class="hr-tabs" aria-label="榜单指标">
        <button
          :class="{ active: ranking === 'score' }"
          :aria-pressed="ranking === 'score'"
          @click="ranking = 'score'"
        >
          综合盾牌分</button
        ><button
          :class="{ active: ranking === 'odds' }"
          :aria-pressed="ranking === 'odds'"
          @click="ranking = 'odds'"
        >
          赔率竞争力
        </button>
      </div>
      <StatePanel v-if="!demo" title="暂无平台数据" description="评分和排名服务尚未接入。" />
      <template v-else-if="ranking === 'score'">
        <div
          v-for="(p, index) in platforms"
          :key="p.id"
          class="hr-rank-row"
          @click="router.push(`/monitor?platform=${p.id}`)"
        >
          <span class="hr-rank-number">{{ p.score === null ? '—' : index + 1 }}</span
          ><span class="hr-avatar" :class="`hr-avatar-${p.id}`">{{ p.id }}</span
          ><span class="hr-rank-name"
            ><strong class="hr-account-name"
              ><RouterLink :to="`/monitor?platform=${p.id}`" @click.stop>{{ p.name }}</RouterLink
              ><PlatformAccountLink :platform="p.id" :name="p.name" /></strong
            ><small>{{
              p.grade
                ? `出金纯净度 ${p.grade} · 小额 ${p.smallMinutes} min`
                : '样本不足，暂不参与评分'
            }}</small></span
          ><span class="hr-rank-value"
            >{{ p.score?.toFixed(1) ?? '—' }}<small>综合盾牌分</small></span
          >
        </div>
      </template>
      <template v-else>
        <p class="hr-rank-scope">
          <span>足球</span><span>全场亚洲让球</span><span>近7天</span><b>共同样本 128 场</b>
        </p>
        <div
          v-for="(p, index) in oddsRanks"
          :key="p.id"
          class="hr-rank-row"
          @click="compare('ranking', undefined, undefined, undefined, p.id)"
        >
          <span class="hr-rank-number">{{ index + 1 }}</span
          ><span class="hr-avatar" :class="`hr-avatar-${p.id}`">{{ p.id }}</span
          ><span class="hr-rank-name"
            ><strong class="hr-account-name"
              ><button
                type="button"
                @click.stop="compare('ranking', undefined, undefined, undefined, p.id)"
              >
                平台 {{ p.id }}</button
              ><PlatformAccountLink :platform="p.id" :name="`平台 ${p.id}`" /></strong
            ><small>同盘口有效报价</small></span
          ><span class="hr-rank-value">{{ p.share }}%<small>最优报价占比</small></span>
        </div>
      </template>
      <button class="hr-ranking-note" @click="panel = 'ranking'">
        综合评分与赔率排名独立计算 · 查看口径与来源
      </button>
    </section>
    <footer class="hr-support">
      <RouterLink to="/me?panel=help">帮助与客服</RouterLink
      ><RouterLink to="/me?panel=feedback">意见反馈</RouterLink
      ><RouterLink to="/me?panel=about">关于我们</RouterLink>
    </footer>
    <BottomDrawer
      :open="!!panel"
      :title="
        (
          {
            search: '搜索平台与赛事',
            format: '赔率显示格式',
            warning: '钱包异动详情',
            funding: '出金与资金口径',
            ranking: '榜单口径与来源',
            cooperation: '平台合作',
            sources: '赛事数据来源',
          } as Record<string, string>
        )[panel] ?? '数据来源'
      "
      @close="close"
    >
      <div class="hr-sheet">
        <template v-if="panel === 'search'"
          ><label class="hr-search"
            ><Search :size="20" /><input
              v-model="search"
              type="search"
              placeholder="搜索球队、联赛或平台"
              aria-label="搜索球队、联赛或平台"
          /></label>
          <p v-if="!demo" class="hr-copy">搜索数据服务尚未接入。</p>
          <template v-else
            ><p class="hr-copy">
              {{ search.trim() ? '匹配当前收录的数据' : '输入球队、联赛或平台名称。' }}
            </p>
            <RouterLink
              v-for="m in searchMatches"
              :key="m.id"
              class="hr-sheet-row"
              :to="`/compare?view=odds&match=${m.id}`"
              >{{ m.home }} vs {{ m.away }}<ChevronRight :size="16" /></RouterLink
            ><RouterLink
              v-for="p in searchPlatforms"
              :key="p.id"
              class="hr-sheet-row"
              :to="`/monitor?platform=${p.id}`"
              >{{ p.name }}<ChevronRight :size="16" /></RouterLink
            ><StatePanel
              v-if="search.trim() && !searchMatches.length && !searchPlatforms.length"
              title="暂无匹配结果"
              description="试试其他球队、联赛或平台名称。" /></template
        ></template>
        <template v-else-if="panel === 'format'"
          ><button
            v-for="f in formats"
            :key="f.id"
            class="hr-sheet-row"
            :aria-pressed="format === f.id"
            @click="selectFormat(f.id)"
          >
            {{ f.label }}<span>{{ format === f.id ? '已选择' : '' }}</span>
          </button>
          <p class="hr-copy">
            仅改变显示制式，底层赔率使用十进制；偏好与对比页共用。滚球记录同步转换为当前显示制式，涨跌方向按十进制原值判断。
          </p></template
        >
        <template v-else-if="panel === 'warning' && warning"
          ><h3>{{ warning.name }} · 24h 净流出 {{ Math.abs(warning.flowPercent!) }}%</h3>
          <p class="hr-copy">
            热钱包余额 {{ warning.wallet }}；净流向 {{ warning.flow }}。预警口径为净流出额 ÷
            当前钱包余额，超过25%。
          </p>
          <p class="hr-copy">钱包异动不等同于平台违约，需结合地址归属、流向与历史核查。</p>
          <RouterLink class="hr-action hr-link" :to="`/monitor?platform=${warning.id}&panel=flow`"
            >查看平台资金详情<ChevronRight :size="16" /></RouterLink
        ></template>
        <template v-else-if="panel === 'funding'"
          ><h3>统计范围</h3>
          <p class="hr-copy">
            出款耗时来自平台 A：小额 &lt;1,000 U，平均 {{ measured?.smallMinutes ?? '—' }} 分钟，{{
              measured?.samples ?? '—'
            }}
            笔样本。统计申请至到账的平均值，不是中位数，也不等同于安全评级。样例未给出按链分组的耗时，首页不将其归属到单一链。
          </p>
          <p class="hr-copy">
            热钱包金额仅汇总已标记且有余额数据的平台；覆盖 {{ researchChains.join('、') }}。平台 C
            余额缺失，未计入总额。此总额不是储备充足率。
          </p>
          <RouterLink class="hr-link hr-action" to="/monitor"
            >查看完整监测<ChevronRight :size="16" /></RouterLink
        ></template>
        <template v-else-if="panel === 'ranking'"
          ><h3>两类排名分别比较</h3>
          <p class="hr-copy">
            综合盾牌分：储备充足率40% + 出金纯净度30% +
            客诉解决率30%。缺失分项、过期或样本不足不补分。赞助不影响排序。
          </p>
          <p class="hr-copy">
            赔率竞争力：足球 / 全场亚洲让球 / 近7天 /
            共同样本128场，以最优报价占比降序展示。仅纳入有效且样本充足的平台，不代表平台安全程度。
          </p></template
        >
        <template v-else-if="panel === 'cooperation'"
          ><h3>平台合作</h3>
          <p class="hr-copy">
            可通过意见反馈描述平台资料、数据来源及合作需求。平台入驻与资料核验服务尚未接入；合作不影响独立评分。
          </p>
          <RouterLink class="hr-link hr-action" to="/me?panel=feedback"
            >前往意见反馈<ChevronRight :size="16" /></RouterLink
        ></template>
        <template v-else
          ><p class="hr-copy">
            赛事、比分、报价和滚球动态是固定记录，不按当前时钟模拟更新。暂停和过期报价不参与较优价格计算。不同赛事的变动记录不应用到当前盘口。
          </p>
          <RouterLink class="hr-link hr-action" to="/compare"
            >查看完整赛事与报价<ChevronRight :size="16" /></RouterLink
        ></template>
        <p
          v-if="demo && ['sources', 'funding', 'ranking', 'warning', 'search'].includes(panel)"
          class="hr-source-note"
        >
          来源：项目本地样例 ·
          {{
            panel === 'sources' ? '10/24 固定记录' : researchSnapshot
          }}。真实模型、赛事、排名及链上服务尚未接入。
        </p>
      </div>
    </BottomDrawer>
  </div>
</template>

<style scoped>
.hr-account-name {
  display: flex;
  align-items: center;
}
.hr-account-name > a,
.hr-account-name > button:first-child {
  color: inherit;
  font: inherit;
  text-decoration: none;
  background: none;
  border: 0;
  padding: 0;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
}
</style>
