<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Crown,
  Bell,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Layers,
  ShieldCheck,
  ChartNoAxesCombined,
  Database,
  Link,
  Headphones,
  UsersRound,
  Check,
} from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import { useProfile } from './store'
import {
  subscriptionPlans,
  subscriptionBenefits,
  subscriptionReset,
  getSubscriptionPlan,
  type SubscriptionLevel,
} from './subscription'
const profile = useProfile()
const route = useRoute()
const router = useRouter()
const selected = ref<SubscriptionLevel>(getSubscriptionPlan(route.query.level)?.id ?? 'L2')
const current = computed(() => getSubscriptionPlan(selected.value)!)
const index = computed(() => subscriptionPlans.findIndex((p) => p.id === selected.value))
const compare = ref(false)
const panel = ref<'plan' | 'usage' | null>(null)
const icons = {
  alerts: Bell,
  ai: Sparkles,
  vip: Crown,
  odds: ChartNoAxesCombined,
  monitor: Database,
  uid: Link,
  support: Headphones,
  agents: UsersRound,
}
watch(
  () => route.query.level,
  (value) => {
    const plan = getSubscriptionPlan(value)
    if (plan) selected.value = plan.id
  },
)
function move(direction: number) {
  const next = (index.value + direction + subscriptionPlans.length) % subscriptionPlans.length
  const plan = subscriptionPlans[next]!
  select(plan.id)
  document.getElementById(`tab-${plan.id}`)?.focus({ preventScroll: true })
}
function select(id: SubscriptionLevel) {
  selected.value = id
  void router.replace({
    path: '/me',
    query: { ...route.query, section: 'subscription', level: id },
  })
}
</script>
<template>
  <div class="sb-page">
    <section class="sb-account">
      <span class="sb-account-icon"><Crown :size="24" /></span>
      <div>
        <small>当前订阅</small>
        <h2>{{ profile.previewIdentity ? '普通用户' : '未登录' }}</h2>
        <p>
          {{ profile.previewIdentity ? '尚未开通 L1 / L2 / L3 订阅' : '登录后查看订阅与积分记录' }}
        </p>
      </div>
    </section>
    <section class="pf-card sb-usage" aria-label="AI 积分用量">
      <div class="sb-heading">
        <h2>AI 积分用量</h2>
        <button @click="panel = 'usage'">用量明细<ChevronRight :size="13" /></button>
      </div>
      <div class="sb-usage-values">
        <div>
          <span>累计消耗总积分</span><strong>—<small> 积分</small></strong>
        </div>
        <div>
          <span>本周期已消耗</span><strong>—<small> 积分</small></strong>
        </div>
      </div>
      <p class="sb-empty-usage">
        {{ profile.previewIdentity ? '暂无积分消耗记录' : '登录后查看个人积分用量' }}
      </p>
      <div class="sb-reset">
        <Clock3 :size="15" /><span
          >重置周期<small>{{ subscriptionReset }}</small></span
        ><b>每月重置</b>
      </div>
    </section>
    <div class="sb-heading sb-plan-heading">
      <h2>选择订阅档次</h2>
      <span>按需选择服务</span>
    </div>
    <div class="sb-levels" role="tablist" aria-label="订阅档次">
      <button
        v-for="plan in subscriptionPlans"
        :key="plan.id"
        role="tab"
        :aria-selected="selected === plan.id"
        :tabindex="selected === plan.id ? 0 : -1"
        @keydown.left.prevent="move(-1)"
        @keydown.right.prevent="move(1)"
        :aria-controls="`subscription-${plan.id}`"
        :id="`tab-${plan.id}`"
        :class="{ selected: selected === plan.id }"
        @click="select(plan.id)"
      >
        <strong>{{ plan.id }}</strong
        ><span>{{ plan.name }}</span>
      </button>
    </div>
    <section
      class="sb-plan"
      role="tabpanel"
      :id="`subscription-${current.id}`"
      :aria-labelledby="`tab-${current.id}`"
    >
      <div class="sb-plan-top">
        <div>
          <small>{{ current.id }} · {{ current.name }}订阅</small>
          <h2>{{ current.description }}</h2>
        </div>
        <Crown :size="32" />
      </div>
      <div class="sb-plan-points">
        <strong>{{ current.monthlyPoints.toLocaleString('en-US') }}</strong
        ><span
          >AI 积分 / 月<small>{{ subscriptionReset }}重置</small></span
        >
      </div>
      <div class="sb-key-benefits">
        <span><Check :size="14" />{{ current.alert }}</span
        ><span><Check :size="14" />{{ current.quote }}</span
        ><span><Check :size="14" />{{ current.support }}</span>
      </div>
      <button class="pf-primary pf-wide" @click="panel = 'plan'">
        了解 {{ current.id }} 订阅方案<ArrowUpRight :size="16" />
      </button>
    </section>
    <p class="sb-proposal">当前为权益方案预览；积分额度、服务优先级及价格以正式开通方案为准。</p>
    <div class="sb-heading sb-plan-heading">
      <h2>{{ current.id }} 服务与特权</h2>
      <button :aria-expanded="compare" @click="compare = !compare">
        <Layers :size="13" />{{ compare ? '收起对比' : '档次对比' }}
      </button>
    </div>
    <section v-if="compare" class="pf-card sb-comparison" aria-label="订阅权益对比">
      <table>
        <thead>
          <tr>
            <th>权益</th>
            <th v-for="plan in subscriptionPlans" :key="plan.id">{{ plan.id }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="benefit in subscriptionBenefits" :key="benefit.id">
            <th>{{ benefit.title }}</th>
            <td v-for="(value, i) in benefit.values" :key="i">{{ value }}</td>
          </tr>
          <tr>
            <th>积分重置</th>
            <td colspan="3">{{ subscriptionReset }}</td>
          </tr>
        </tbody>
      </table>
    </section>
    <div class="sb-benefits">
      <article v-for="benefit in subscriptionBenefits" :key="benefit.id" class="pf-card sb-benefit">
        <span class="sb-benefit-icon"><component :is="icons[benefit.id]" :size="21" /></span>
        <div>
          <h3>{{ benefit.title }}</h3>
          <strong>{{ benefit.values[index] }}</strong>
          <p>{{ benefit.description }}</p>
          <RouterLink :to="benefit.to">{{ benefit.action }}<ChevronRight :size="13" /></RouterLink>
        </div>
      </article>
    </div>
    <p class="sb-footnote">
      <ShieldCheck :size="15" />选择档次仅切换方案展示，不会扣款或变更当前订阅。
    </p>
    <BottomDrawer
      :open="panel !== null"
      :title="panel === 'usage' ? 'AI 积分用量明细' : `${current.id} · 订阅方案`"
      @close="panel = null"
      ><div class="sb-sheet">
        <template v-if="panel === 'usage'"
          ><div class="sb-usage-empty">
            <Sparkles :size="34" />
            <h3>暂无积分消耗记录</h3>
            <p>接入积分账单后，可查看每次分析的消耗、累计总积分与所属周期。</p>
          </div>
          <dl class="sb-facts">
            <div>
              <dt>累计消耗总积分</dt>
              <dd>暂无记录</dd>
            </div>
            <div>
              <dt>本周期消耗</dt>
              <dd>暂无记录</dd>
            </div>
            <div>
              <dt>重置周期</dt>
              <dd>{{ subscriptionReset }}</dd>
            </div>
            <div>
              <dt>下次重置</dt>
              <dd>开通订阅后显示</dd>
            </div>
          </dl>
          <RouterLink class="pf-primary pf-wide" to="/ai"
            >前往 AI 分析<ArrowUpRight :size="15" /></RouterLink
        ></template>
        <template v-else
          ><h3>{{ current.description }}</h3>
          <dl class="sb-facts">
            <div>
              <dt>订阅档次</dt>
              <dd>{{ current.id }} · {{ current.name }}</dd>
            </div>
            <div>
              <dt>方案积分</dt>
              <dd>{{ current.monthlyPoints.toLocaleString('en-US') }} / 月</dd>
            </div>
            <div>
              <dt>重置周期</dt>
              <dd>{{ subscriptionReset }}</dd>
            </div>
            <div>
              <dt>VIP 转移</dt>
              <dd>{{ current.quote }}</dd>
            </div>
            <div>
              <dt>订阅价格</dt>
              <dd>根据正式方案确认</dd>
            </div>
          </dl>
          <p class="sb-proposal">可先比较 VIP 待遇与定制报价，再选择合适的服务方案。</p>
          <RouterLink
            class="pf-primary pf-wide"
            :to="{ path: '/me', query: { section: 'vip', subscription: current.id, inquire: '1' } }"
            >获取 VIP 定制报价<ArrowUpRight :size="16" /></RouterLink
          ><RouterLink class="sb-sheet-link" to="/me?section=tickets"
            >咨询订阅与服务<ChevronRight :size="14" /></RouterLink
        ></template></div
    ></BottomDrawer>
  </div>
</template>
<style src="./subscription.css"></style>
