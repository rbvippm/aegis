<script setup lang="ts">
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  Info,
  TriangleAlert,
  ShieldCheck,
} from '@lucide/vue'
import ResearchChart from '@/features/monitoring/ResearchChart.vue'
import ResearchPlatformCard from '@/features/monitoring/ResearchPlatformCard.vue'
import {
  researchChains,
  researchRegionLabel,
  type ResearchChain,
  type ResearchPlatform,
  type ResearchWindow,
} from '@/features/monitoring/research'
import { researchPlatforms, researchSnapshot } from '@/mocks/monitoring-research'
import { dataMode } from '@/shared/api/config'
import StatePanel from '@/shared/ui/StatePanel.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'

const route = useRoute()
const windows: ResearchWindow[] = ['24h', '7d', '30d']
const window = ref<ResearchWindow>('30d')
const search = ref('')
const chain = ref<ResearchChain | ''>('')
const grade = ref('')
const region = ref('')
const completeOnly = ref(false)
const sort = ref('score')
const visiblePlatforms = computed(() =>
  researchPlatforms
    .filter(
      (platform) =>
        platform.name.toLowerCase().includes(search.value.trim().toLowerCase()) &&
        (!chain.value || platform.chains.includes(chain.value)) &&
        (!region.value || platform.region === region.value) &&
        (!grade.value || platform.grade === grade.value) &&
        (!completeOnly.value || platform.score !== null),
    )
    .sort((a, b) => {
      if (a.score === null) return 1
      if (b.score === null) return -1
      if (sort.value === 'deposit')
        return b.windows[window.value].amount - a.windows[window.value].amount
      return b.score - a.score
    }),
)
const panel = ref<{ kind: string; platform?: ResearchPlatform } | null>(null)
const uid = ref('')
const report = ref('')
const feedback = ref('')
function open(kind: string, platform?: ResearchPlatform) {
  panel.value = { kind, platform }
  uid.value = ''
  report.value = ''
  feedback.value = ''
}
function close() {
  panel.value = null
}
function resetFilters() {
  chain.value = ''
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
    <section class="research-intro">
      <h1>实时追踪</h1>
      <p>链上资金 · 出金风险 · 玩家实测</p>
    </section>
    <template v-if="dataMode === 'demo'">
      <div class="research-search-row">
        <label class="research-search ae-glass"
          ><Search :size="21" /><input
            v-model="search"
            type="search"
            placeholder="搜索平台名称"
            aria-label="搜索平台名称"
        /></label>
        <button class="research-filter ae-glass" aria-label="筛选平台" @click="open('筛选条件')">
          <SlidersHorizontal :size="21" /><i v-if="chain || grade || region || completeOnly"></i>
        </button>
      </div>
      <div class="research-controls">
        <label class="research-chain ae-glass"
          ><span class="sr-only">平台覆盖公链</span
          ><GlassSelect v-model="chain">
            <option value="">全部公链</option>
            <option v-for="item in researchChains" :key="item">{{ item }}</option></GlassSelect
          ></label
        >
        <div class="research-period ae-glass" aria-label="存款统计时间范围">
          <button
            v-for="period in windows"
            :key="period"
            :class="{ active: window === period }"
            :aria-pressed="window === period"
            @click="window = period"
          >
            {{ period }}
          </button>
        </div>
      </div>
      <ResearchChart :window="window" />
      <div class="research-list-heading">
        <h2>平台综合对比</h2>
      </div>
      <div class="research-region-filter">
        <GlassSelect v-model="region" label="平台地区"
          ><option value="">全部地区</option>
          <option value="asia">亚洲平台</option>
          <option value="europe">欧洲平台</option></GlassSelect
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
          v-for="(platform, index) in visiblePlatforms"
          :key="platform.id"
          :platform="platform"
          :window="window"
          :rank="platform.score === null ? undefined : index + 1"
          @open="open"
        />
        <div v-if="!visiblePlatforms.length" class="research-empty">
          <StatePanel
            title="暂无匹配平台"
            description="试试其他平台名称、公链或纯净度条件。"
          /><button @click="resetFilters">重置筛选</button>
        </div>
      </div>
      <button class="research-method" @click="open('评级口径与来源')">
        <Info :size="17" /><span
          ><strong>盾牌分：储备40% · 纯净度30% · 客诉解决30%</strong
          ><small>小额 &lt;1,000U · 大额 &gt;10,000U</small></span
        ><span class="research-method__more">评级口径<ChevronRight :size="12" /></span>
      </button>
      <button class="research-live" @click="open('异动详情', researchPlatforms[1])">
        <TriangleAlert :size="17" /><strong>钱包异动 1 条</strong
        ><span>查看详情 <ChevronRight :size="13" /></span>
      </button>
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
          <template v-if="panel.kind === '筛选条件'">
            <label class="research-field"
              >覆盖公链<GlassSelect v-model="chain">
                <option value="">全部公链</option>
                <option v-for="item in researchChains" :key="item">{{ item }}</option>
              </GlassSelect></label
            >
            <p class="research-sheet-note">
              按平台覆盖的链筛选；卡片金额仍为已标记钱包的全链汇总。
            </p>
            <label class="research-field"
              >平台地区<GlassSelect v-model="region"
                ><option value="">全部地区</option>
                <option value="asia">亚洲平台</option>
                <option value="europe">欧洲平台</option></GlassSelect
              ></label
            >
            <label class="research-field"
              >纯净度<GlassSelect v-model="grade">
                <option value="">全部等级</option>
                <option v-for="item in ['S', 'A', 'B', 'C']" :key="item" :value="item">
                  {{ item }}级
                </option>
              </GlassSelect></label
            >
            <label class="research-checkbox"
              ><input v-model="completeOnly" type="checkbox" />仅看数据完整平台</label
            >
            <div class="research-sheet-actions">
              <button @click="resetFilters">重置</button
              ><button class="research-primary" @click="close">
                查看 {{ visiblePlatforms.length }} 个平台
              </button>
            </div>
          </template>
          <template v-else-if="panel.kind === '绑定 UID'">
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
            <div class="research-sheet-warning">
              <TriangleAlert :size="22" />平台 B · 24h 净流出 28%
            </div>
            <p>
              热钱包余额 $21.6M；24h 净流出 $6.0M。口径为净流出额 ÷ 当前钱包余额，结果四舍五入。
            </p>
            <p>钱包异动不等同于平台违约。需结合地址归属、资金去向与历史流向核查。</p>
            <p class="research-sheet-note">快照 {{ researchSnapshot }}</p>
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
              30d 图表为每日入金；7d 图表为每日入金；24h
              图表为分时入金。净入金剔除已识别的内部冷热钱包互转。
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
