<script setup lang="ts">
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getSubscriptionPlan } from '@/features/profile/subscription'
import { ChevronRight, LockKeyhole } from '@lucide/vue'
import ServiceLayout from './ServiceLayout.vue'
import AnonymousRequest from './AnonymousRequest.vue'
import RequestSummary from './RequestSummary.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import { dataMode } from '@/shared/api/config'
import { vipOffers, anonymousRankings, serviceSnapshot } from '@/mocks/services'
import { useServiceRequests } from './store'
import { formatUnits } from './logic'
import type { VipOffer } from './types'

const route = useRoute()
const subscription = computed(() => getSubscriptionPlan(route.query.subscription))
const store = useServiceRequests()
const tab = ref('offers')
const period = ref<'30' | '90'>('30')
const platform = ref('all')
const sort = ref('default')
const requestOpen = ref(Boolean(subscription.value && route.query.inquire === '1'))
const panel = ref<'terms' | 'compare' | 'privacy' | null>(null)
const selected = ref<VipOffer>(vipOffers[0]!)
const tabs = [
  { id: 'offers', label: '专属报价' },
  { id: 'ranking', label: '匿名充值榜' },
  { id: 'requests', label: '我的需求' },
]
const offers = computed(() => {
  if (dataMode !== 'demo') return []
  const items = vipOffers.filter((offer) => platform.value === 'all' || offer.id === platform.value)
  return items.sort((a, b) =>
    sort.value === 'level'
      ? b.level - a.level
      : sort.value === 'lossback'
        ? b.lossback - a.lossback
        : sort.value === 'cashback'
          ? b.cashback - a.cashback
          : a.id.localeCompare(b.id),
  )
})
const compared = computed(() =>
  vipOffers.filter((offer) => dataMode === 'demo' && store.comparison.includes(offer.id)),
)
function terms(offer: VipOffer) {
  selected.value = offer
  panel.value = 'terms'
}
function toggleSort(value: string) {
  sort.value = sort.value === value ? 'default' : value
}
</script>

<template>
  <ServiceLayout
    kind="vip"
    title="让平台为你提供方案"
    subtitle="匿名核验资料，比较专属 VIP 待遇"
    action="匿名获取 VIP 报价"
    :steps="['匿名建档', '经理盲拍', '比较选择']"
    @request="requestOpen = true"
  >
    <p v-if="subscription" class="svc-subscription-context">
      {{ subscription.id }} · {{ subscription.name }}订阅咨询<span>VIP 转移 · 定制化报价</span>
    </p>
    <div class="svc-tabs" aria-label="VIP 服务视图">
      <button
        v-for="item in tabs"
        :key="item.id"
        :class="{ selected: tab === item.id }"
        :aria-pressed="tab === item.id"
        @click="tab = item.id"
      >
        {{ item.label }}
      </button>
    </div>
    <StatePanel
      v-if="dataMode !== 'demo'"
      title="暂无 VIP 方案"
      description="暂时没有可比较的报价。"
    />
    <template v-else>
      <section v-if="tab === 'offers'" class="svc-card">
        <div class="svc-heading">
          <h2>VIP 方案对比</h2>
        </div>
        <div class="svc-filters">
          <GlassSelect v-model="platform" aria-label="VIP 平台筛选">
            <option value="all">全部平台</option>
            <option value="A">平台 A</option>
            <option value="B">平台 B</option></GlassSelect
          ><button :aria-pressed="sort === 'level'" @click="toggleSort('level')">等级匹配</button
          ><button :aria-pressed="sort === 'lossback'" @click="toggleSort('lossback')">
            Lossback</button
          ><button :aria-pressed="sort === 'cashback'" @click="toggleSort('cashback')">
            日返水
          </button>
        </div>
        <p v-if="sort === 'lossback'" class="svc-note">
          按名义比例排序；周期、上限与流水要求不同，实际待遇需结合完整条款比较。
        </p>
        <article
          v-for="offer in offers"
          :key="offer.id"
          class="svc-offer"
          :aria-label="`${offer.name} VIP 方案`"
        >
          <header>
            <span class="svc-avatar" :class="{ purple: offer.id === 'B' }">{{ offer.id }}</span>
            <div>
              <h3>{{ offer.name }}</h3>
              <p>专属方案</p>
            </div>
            <button
              class="svc-text"
              :aria-label="`${offer.name} VIP 条款来源`"
              @click="terms(offer)"
            >
              条款来源 <ChevronRight :size="13" />
            </button>
          </header>
          <dl class="svc-metrics">
            <div>
              <dt>等级匹配</dt>
              <dd>VIP {{ offer.level }}</dd>
            </div>
            <div>
              <dt>Lossback</dt>
              <dd>{{ offer.lossback }}%</dd>
            </div>
            <div>
              <dt>日返水</dt>
              <dd>{{ offer.cashback }}%</dd>
            </div>
          </dl>
          <p class="svc-offer-caption">
            按{{ offer.period }}净亏损计算 · 返现上限 {{ formatUnits(offer.cap) }}
          </p>
          <p class="svc-offer-disclaimer">有效投注口径、流水要求以条款为准</p>
          <footer>
            <button
              class="svc-text"
              :aria-label="`${offer.name}完整 VIP 条款`"
              @click="terms(offer)"
            >
              查看完整条款 <ChevronRight :size="12" /></button
            ><button
              class="svc-outline"
              :aria-label="`${store.comparison.includes(offer.id) ? '移出' : '加入'}对比 ${offer.name}`"
              :aria-pressed="store.comparison.includes(offer.id)"
              @click="store.toggleComparison(offer.id)"
            >
              {{ store.comparison.includes(offer.id) ? '已加入 · 移除' : '加入对比' }}
            </button>
          </footer>
        </article>
        <div v-if="store.comparison.length" class="svc-compare-bar" role="status">
          <span>已选 {{ store.comparison.length }} 个方案</span
          ><button class="svc-outline" :disabled="compared.length < 2" @click="panel = 'compare'">
            {{ compared.length < 2 ? '再选一个方案' : '查看方案对比' }}
          </button>
        </div>
      </section>
      <section v-if="tab !== 'requests'" class="svc-card">
        <div class="svc-heading">
          <h2>匿名充值排行</h2>
          <button class="svc-heading-link" @click="panel = 'privacy'">
            <LockKeyhole :size="14" />{{ tab === 'ranking' ? '隐私说明' : '经授权 · 区间展示' }}
          </button>
        </div>
        <div class="svc-period" aria-label="匿名排行观察窗口">
          <button :aria-pressed="period === '30'" @click="period = '30'">近30日</button
          ><button :aria-pressed="period === '90'" @click="period = '90'">近90日</button>
        </div>
        <ol class="svc-rank-list">
          <li v-for="(item, index) in anonymousRankings[period]" :key="item.alias">
            <span class="svc-rank">#{{ String(index + 1).padStart(2, '0') }}</span>
            <div>
              <strong>{{ item.alias }}</strong>
              <p>充值 {{ item.volume }}</p>
            </div>
            <span class="svc-rank-quotes">{{ item.quotes }} 份报价</span>
          </li>
        </ol>
        <p class="svc-note">仅展示脱敏区间，不公开身份与充值凭证。</p>
      </section>
      <RequestSummary v-if="tab === 'requests'" kind="vip" @create="requestOpen = true" />
    </template>
    <AnonymousRequest
      :open="requestOpen"
      kind="vip"
      :subscription-level="subscription?.id"
      @close="requestOpen = false"
      @saved="tab = 'requests'"
    />
    <BottomDrawer
      :open="panel !== null"
      :title="
        panel === 'compare'
          ? 'VIP 方案并排对比'
          : panel === 'privacy'
            ? '匿名排行与盲拍说明'
            : `${selected.name} · VIP 完整条款`
      "
      @close="panel = null"
    >
      <div class="svc-panel">
        <template v-if="panel === 'terms'">
          <dl class="svc-detail-list">
            <div>
              <dt>等级匹配</dt>
              <dd>VIP {{ selected.level }}，需私下核验原平台等级；不保证自动匹配。</dd>
            </div>
            <div>
              <dt>负盈利返现</dt>
              <dd>
                按{{ selected.period }}已结算净亏损 × {{ selected.lossback }}%，每{{
                  selected.period
                }}上限 {{ formatUnits(selected.cap) }}；不与其他补贴叠加。
              </dd>
            </div>
            <div>
              <dt>净亏损口径</dt>
              <dd>仅含当期已结算有效投注亏损，扣除已获得优惠；充值金额不视为亏损。</dd>
            </div>
            <div>
              <dt>专属日返水</dt>
              <dd>
                合格有效投注额 × {{ selected.cashback }}%，按日结算；作废、对冲与部分场馆不计入。
              </dd>
            </div>
            <div>
              <dt>流水与排除</dt>
              <dd>{{ selected.rollover }}。完整适用场馆清单需另行确认。</dd>
            </div>
            <div>
              <dt>结算与有效期</dt>
              <dd>按结算周期发放，具体领取方式与有效期以条款为准。</dd>
            </div>
            <div>
              <dt>来源与快照</dt>
              <dd>{{ serviceSnapshot }}</dd>
            </div>
          </dl>
          <button class="svc-outline" @click="store.toggleComparison(selected.id)">
            {{ store.comparison.includes(selected.id) ? '从对比中移除' : '加入对比' }}
          </button>
        </template>
        <template v-else-if="panel === 'compare'">
          <table class="svc-table">
            <caption>
              不同周期与上限不可仅按返现比例判断
            </caption>
            <thead>
              <tr>
                <th scope="col">比较项</th>
                <th v-for="offer in compared" :key="offer.id" scope="col">{{ offer.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">等级匹配</th>
                <td v-for="offer in compared" :key="offer.id">VIP {{ offer.level }}</td>
              </tr>
              <tr>
                <th scope="row">Lossback</th>
                <td v-for="offer in compared" :key="offer.id">
                  {{ offer.lossback }}% / {{ offer.period }}
                </td>
              </tr>
              <tr>
                <th scope="row">返现上限</th>
                <td v-for="offer in compared" :key="offer.id">
                  {{ formatUnits(offer.cap) }} / {{ offer.period }}
                </td>
              </tr>
              <tr>
                <th scope="row">日返水</th>
                <td v-for="offer in compared" :key="offer.id">{{ offer.cashback }}%</td>
              </tr>
              <tr>
                <th scope="row">流水条件</th>
                <td v-for="offer in compared" :key="offer.id">{{ offer.rollover }}</td>
              </tr>
            </tbody>
          </table>
          <p class="svc-note">
            平台 B 的周返现与平台 A 的月返现不直接等价。选择前还需核对场馆限制、领取方式与有效期。
          </p>
        </template>
        <template v-else
          ><h3>匿名公开，私下核验</h3>
          <p class="svc-note">
            用户授权后私下核验资料，平台仅看到脱敏区间和待遇诉求，独立提交报价；其他平台看不到竞价内容，用户自主选择。
          </p>
          <p class="svc-note">
            排行榜不公开真实身份、钱包、账户或凭证。充值以区间展示，不代表精确金额顺序。
          </p></template
        >
      </div>
    </BottomDrawer>
  </ServiceLayout>
</template>
