<script setup lang="ts">
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Share2, SlidersHorizontal, ChevronRight, Info, ShieldCheck } from '@lucide/vue'
import ResearchAnalytics from '@/features/monitoring/ResearchAnalytics.vue'
import type { AnalyticsScope } from '@/features/monitoring/ResearchAnalytics.vue'
import ResearchPlatformCard from '@/features/monitoring/ResearchPlatformCard.vue'
import { researchRegionLabel, type ResearchPlatform } from '@/features/monitoring/research'
import { analyticsCatalog } from '@/mocks/monitoring-analytics'
import { researchSnapshot } from '@/mocks/monitoring-research'
import { monitoringPlatforms as researchPlatforms } from '@/mocks/monitoring-platforms'
import { dataMode } from '@/shared/api/config'
import StatePanel from '@/shared/ui/StatePanel.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'

const route = useRoute()
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
const search = ref(typeof route.query.search === 'string' ? route.query.search : '')
const grade = ref(typeof route.query.grade === 'string' ? route.query.grade : '')
const region = ref(
  ['asia', 'europe', 'unknown'].includes(String(route.query.region))
    ? String(route.query.region)
    : '',
)
const completeOnly = ref(route.query.complete === '1')
const sort = ref('score')
const platformLimit = ref(3)
watch(
  [search, region, grade, completeOnly, () => scope.value.period, () => scope.value.ids.join(',')],
  () => {
    platformLimit.value = 3
  },
)
function matchesPlatform(platform: ResearchPlatform) {
  return (
    platform.name.toLowerCase().includes(search.value.trim().toLowerCase()) &&
    scope.value.ids.includes(platform.id) &&
    (!region.value ||
      (region.value === 'unknown'
        ? platform.region === null
        : platform.region === region.value)) &&
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
      region: meta.region,
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
  return [...known, ...extras].sort((a, b) => {
    if (sort.value === 'deposit' || (a.score === null && b.score === null))
      return b.windows[window.value].amount - a.windows[window.value].amount
    if (a.score === null) return 1
    if (b.score === null) return -1
    return b.score - a.score
  })
})
const panel = ref<{ kind: string; platform?: ResearchPlatform } | null>(null)
const uid = ref('')
const report = ref('')
const feedback = ref('')
function open(kind: string, platform?: ResearchPlatform) {
  if (platform && ['地址清单', '数据来源'].includes(kind) && analytics.value) {
    analytics.value.showPlatformEvidence(platform.id, kind)
    return
  }
  panel.value = { kind, platform }
  uid.value = ''
  report.value = ''
  feedback.value = ''
}
function close() {
  panel.value = null
}
function resetFilters() {
  grade.value = ''
  region.value = ''
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
    const platform = researchPlatforms.find((item) => item.id === route.query.platform)
    if (platform) open(route.query.panel === 'flow' ? '异动详情' : '详情', platform)
  },
  { immediate: true },
)
</script>

<template>
  <div class="monitor-research">
    <template v-if="dataMode === 'demo'">
      <div class="research-search-row">
        <label class="research-search ae-glass"
          ><Search :size="21" /><input
            v-model="search"
            type="search"
            placeholder="搜索平台名称"
            aria-label="搜索平台名称"
        /></label>
        <button class="research-filter ae-glass" aria-label="分享监测分析" @click="analytics?.openShare()">
          <Share2 :size="20" />
        </button>
        <button class="research-filter ae-glass" aria-label="筛选平台" @click="analytics?.openFilters()">
          <SlidersHorizontal :size="21" /><i
            v-if="grade || region || completeOnly || analytics?.scopeCustomized"
          ></i>
        </button>
      </div>
      <ResearchAnalytics
        ref="analytics"
        :search="search"
        :region="region"
        :grade="grade"
        :complete-only="completeOnly"
        :result-count="visiblePlatforms.length"
        @scope="scope = $event"
        @reset="resetFilters"
        @update:region="region = $event"
        @update:grade="grade = $event"
        @update:complete-only="completeOnly = $event"
      >
        <template #platforms>
          <div class="research-list-heading">
            <h2>平台综合对比</h2>
            <span>{{ visiblePlatforms.length }} 家</span>
          </div>
          <div class="research-region-filter">
            <GlassSelect v-model="region" label="平台地区"
              ><option value="">全部地区</option>
              <option value="asia">亚洲平台</option>
              <option value="europe">欧洲平台</option>
              <option value="unknown">地区未标注</option></GlassSelect
            >
            <label
              ><span class="sr-only">平台排序</span
              ><GlassSelect v-model="sort" aria-label="平台排序">
                <option value="score">盾牌分</option>
                <option value="deposit">真实存款</option></GlassSelect
              ></label
            >
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
              @open="open"
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
            v-if="visiblePlatforms.length > 3"
            class="ma-secondary ma-platform-expand"
            :aria-expanded="platformLimit > 3"
            @click="platformLimit = platformLimit === 3 ? visiblePlatforms.length : 3"
          >
            {{
              platformLimit === 3 ? `展开全部平台（${visiblePlatforms.length}）` : '收起平台卡片'
            }}
          </button>
          <button class="research-method" @click="open('评级口径与来源')">
            <Info :size="17" /><span
              ><strong>盾牌分：储备40% · 纯净度30% · 客诉解决30%</strong
              ><small>小额 &lt;1,000U · 大额 &gt;10,000U</small></span
            ><span class="research-method__more">评级口径<ChevronRight :size="12" /></span>
          </button>
        </template>
      </ResearchAnalytics>
    </template>
    <StatePanel v-else title="暂无监测数据" description="稍后再查看链上监测与平台研究。" />

    <BottomDrawer
      :open="panel !== null"
      :title="
        panel?.platform
          ? `${panel.platform.name} · ${researchRegionLabel(panel.platform.region)} · ${panel.kind}`
          : (panel?.kind ?? '')
      "
      close-label="关闭弹窗"
      @close="close"
    >
      <template v-if="panel">
        <div class="research-sheet__body">
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
            <div class="research-inspection" :class="{ warning: panel.platform?.grade === 'B' }">
              <ShieldCheck :size="42" /><strong
                >{{ panel.platform?.grade ?? '待检测'
                }}{{ panel.platform?.grade ? '级' : '' }}</strong
              ><span
                >污染占比 {{ panel.platform?.taint ?? '暂无数据'
                }}{{ panel.platform?.taint === null ? '' : '%' }}</span
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
            <p><strong>独立评分 · 赞助不影响排名</strong></p>
            <p>盾牌分 = 储备充足率40% + 出金纯净度30% + 客诉解决率30%。分项归一化后计算。</p>
            <p>
              储备充足率须结合可核验负债，不能仅用热钱包余额替代；客诉解决率须有真实工单及解决口径。
            </p>
            <p>
              S级：&lt;0.5%；A级：0.5%–&lt;2%；B级：2%–5%；C级：&gt;5%。缺失、过期或样本不足的数据不参与评分。
            </p>
            <p>
              耗时为申请至到账的平均值，小额 &lt;1,000U，大额
              &gt;10,000U；中间金额不计入这两档。资产为 USDT，耗时不等同于安全评级。
            </p>
            <p>
              24h 图表按小时汇总；7d、30d、90d 按日汇总；365d
              按周汇总。资金统计剔除内部冷热钱包互转。
            </p>
          </template>
          <template v-else-if="panel.kind === '地址清单'">
            <p>覆盖链：{{ panel.platform?.chains.join('、') }}。</p>
          </template>
          <template v-else-if="panel.kind === '历史评测'"><p>暂无历史评测。</p></template>
          <template v-else-if="panel.kind === '详情'">
            <RouterLink
              class="research-sheet-link"
              :to="{
                path: '/ai',
                query: {
                  analyze: '1',
                  q: `解读${panel.platform?.name}的盾牌分、热钱包、纯净度与出金评级`,
                },
              }"
              >让 AI 解读平台数据<ChevronRight :size="16"
            /></RouterLink>
            <p>
              {{
                panel.platform?.score === null
                  ? '样本不足，暂不评分。'
                  : `盾牌分 ${panel.platform?.score}/10。`
              }}
            </p>
            <button
              v-for="kind in ['出金安全体检卡', '地址清单', '历史评测', '评分依据', '数据来源']"
              :key="kind"
              class="research-sheet-link"
              @click="open(kind, panel.platform)"
            >
              {{ kind }}<ChevronRight :size="16" />
            </button>
          </template>
          <template v-else
            ><p>快照：2026/{{ researchSnapshot }}。</p>
            <p>
              平台 A 共 126 笔、平台 B 共 64 笔耗时样本；平台 C 仅 8 笔，样本不足，不参与排名。
            </p></template
          >
          <p v-if="feedback" class="research-feedback" role="status">{{ feedback }}</p>
        </div>
      </template>
    </BottomDrawer>
  </div>
</template>

<style src="@/features/monitoring/research.css"></style>
