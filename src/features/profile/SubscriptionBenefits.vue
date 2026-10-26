<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Crown, ChevronRight, Check, CreditCard, QrCode, Sparkles, LockKeyhole } from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import { useProfile } from './store'
import {
  subscriptionPlans,
  subscriptionReset,
  getSubscriptionPlan,
  type SubscriptionLevel,
} from './subscription'
const profile = useProfile()
const route = useRoute()
const router = useRouter()
const selected = ref<SubscriptionLevel>(getSubscriptionPlan(route.query.level)?.id ?? 'L2')
const current = computed(() => getSubscriptionPlan(selected.value)!)
const panel = ref<'payment' | 'usage' | null>(null)
const method = ref<'card' | 'wechat' | 'alipay'>('card')
const methods = [
  { id: 'card', name: 'Visa / Mastercard', detail: '银行卡', icon: CreditCard },
  { id: 'wechat', name: '微信支付', detail: '扫码支付', icon: QrCode },
  { id: 'alipay', name: '支付宝', detail: '扫码支付', icon: QrCode },
] as const
watch(
  () => route.query.level,
  (value) => {
    const plan = getSubscriptionPlan(value)
    if (plan) selected.value = plan.id
  },
)
function checkout(id: SubscriptionLevel) {
  selected.value = id
  method.value = 'card'
  panel.value = 'payment'
  void router.replace({
    path: '/me',
    query: { ...route.query, section: 'subscription', level: id },
  })
}
</script>
<template>
  <div class="sb-page">
    <section class="sb-account">
      <span class="sb-account-icon"><Crown :size="22" /></span>
      <div>
        <small>当前等级</small>
        <h2>
          {{
            profile.previewIdentity
              ? profile.subscriptionPlan
                ? `${profile.subscriptionPlan.id} ${profile.subscriptionPlan.name}`
                : '未订阅'
              : '未登录'
          }}
        </h2>
      </div>
      <button class="sb-usage-link" @click="panel = 'usage'">
        AI 用量<ChevronRight :size="14" />
      </button>
    </section>
    <div class="sb-heading">
      <h2>选择订阅</h2>
      <span>按月订阅</span>
    </div>
    <section class="sb-plans" aria-label="订阅方案">
      <article
        v-for="plan in subscriptionPlans"
        :key="plan.id"
        :class="['sb-plan', `sb-plan--${plan.id}`]"
      >
        <header>
          <div>
            <h3>
              {{ plan.id }} <span>{{ plan.name }}</span>
            </h3>
            <p>{{ plan.description }}</p>
          </div>
          <span
            v-if="profile.previewIdentity && profile.subscriptionLevel === plan.id"
            class="sb-current"
            >当前等级</span
          >
        </header>
        <div class="sb-points">
          <strong>¥{{ plan.monthlyPriceCny.toLocaleString('zh-CN') }}</strong><span>/ 月</span>
        </div>
        <ul>
          <li><Check :size="14" />{{ plan.monthlyPoints.toLocaleString('en-US') }} AI 积分 / 月</li>
          <li><Check :size="14" />{{ plan.alert }}</li>
          <li><Check :size="14" />{{ plan.support }}</li>
        </ul>
        <button
          class="pf-primary pf-wide"
          :aria-label="`订阅 ${plan.id}，前往付款`"
          @click="checkout(plan.id)"
        >
          订阅 {{ plan.id }}<ChevronRight :size="16" />
        </button>
      </article>
    </section>
    <p class="sb-note">订阅等级适用于站内功能与服务，VIP 转移计划独立办理。</p>
    <BottomDrawer
      :open="panel !== null"
      :title="panel === 'usage' ? 'AI 积分用量' : `${current.id} · 订阅付款`"
      @close="panel = null"
    >
      <div class="sb-sheet">
        <template v-if="panel === 'usage'">
          <div class="sb-usage-empty">
            <Sparkles :size="28" />
            <h3>暂无积分消耗记录</h3>
            <p>{{ subscriptionReset }}重置</p>
          </div>
          <RouterLink class="pf-primary pf-wide" to="/ai"
            >前往 AI<ChevronRight :size="16"
          /></RouterLink>
        </template>
        <template v-else>
          <section class="sb-order" aria-label="订单摘要">
            <div>
              <strong>{{ current.id }} {{ current.name }}</strong
              ><span>{{ current.monthlyPoints.toLocaleString('en-US') }} AI 积分 / 月</span>
            </div>
            <div class="sb-order-price"><strong>¥{{ current.monthlyPriceCny.toLocaleString('zh-CN') }}</strong><span>月付订阅</span></div>
          </section>
          <fieldset class="sb-methods">
            <legend>付款方式</legend>
            <label v-for="item in methods" :key="item.id" :class="{ selected: method === item.id }"
              ><input
                v-model="method"
                type="radio"
                name="payment-method"
                :aria-label="item.name"
                :value="item.id" /><component :is="item.icon" :size="22" /><span
                ><strong>{{ item.name }}</strong
                ><small>{{ item.detail }}</small></span
              ><Check v-if="method === item.id" :size="16"
            /></label>
          </fieldset>
          <section class="sb-payment-state" aria-live="polite">
            <template v-if="method === 'card'"
              ><LockKeyhole :size="24" />
              <h3>绑定银行卡并支付</h3>
              <p>进入安全收银台后填写卡号、有效期及安全码。</p></template
            >
            <template v-else
              ><QrCode :size="36" />
              <h3>{{ method === 'wechat' ? '微信' : '支付宝' }}扫码付款</h3>
              <p>订单创建后在此显示付款二维码与有效期。</p></template
            >
          </section>
          <button class="pf-primary pf-wide" disabled>
            {{ method === 'card' ? '继续至安全收银台' : '生成付款二维码' }}
          </button>
          <p class="sb-payment-note">暂未配置支付商户，当前无法付款。</p>
        </template>
      </div>
    </BottomDrawer>
  </div>
</template>
<style src="./subscription.css"></style>
