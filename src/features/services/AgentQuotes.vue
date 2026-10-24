<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight, UsersRound, ShieldCheck } from '@lucide/vue'
import ServiceLayout from './ServiceLayout.vue'
import AnonymousRequest from './AnonymousRequest.vue'
import RequestSummary from './RequestSummary.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import { dataMode } from '@/shared/api/config'
import { agentPolicies, serviceSnapshot } from '@/mocks/services'
import { estimateCommission, formatUnits } from './logic'
import type { AgentPolicy } from './types'

const tab = ref('policies')
const settlement = ref('all')
const fee = ref('all')
const model = ref('net')
const requestOpen = ref(false)
const panel = ref<'calculator' | 'terms' | 'method' | 'evidence' | 'roadmap' | null>(null)
const selected = ref<AgentPolicy>(agentPolicies[0]!)
const netRevenue = ref<number | string>(10000)
const costs = ref<Record<string, number | string>>({ A: 0, B: 0 })
const customPolicies = ref(agentPolicies.map((policy) => ({ ...policy })))
const calculated = ref(false)
const tabs = [
  { id: 'policies', label: '佣金比价' },
  { id: 'reputation', label: '信誉档案' },
  { id: 'team', label: '团队竞价' },
]
const policies = computed(() =>
  dataMode === 'demo'
    ? agentPolicies.filter(
        (policy) =>
          model.value === 'net' &&
          (settlement.value === 'all' || policy.settlement === settlement.value) &&
          (fee.value === 'all' ||
            (fee.value === 'low' ? policy.venueFee <= 8 : policy.venueFee === 0)),
      )
    : [],
)
function terms(policy: AgentPolicy) {
  selected.value = policy
  panel.value = 'terms'
}
function evidence(policy: AgentPolicy) {
  selected.value = policy
  panel.value = 'evidence'
}
function amount(value: number | string | undefined) {
  return value === '' || value === undefined ? NaN : Number(value)
}
function total(policy: AgentPolicy) {
  return estimateCommission(amount(netRevenue.value), policy, amount(costs.value[policy.id]))
}
function calculator() {
  panel.value = 'calculator'
  calculated.value = false
}
function resetFilters() {
  model.value = 'net'
  settlement.value = 'all'
  fee.value = 'all'
}
</script>

<template>
  <ServiceLayout
    kind="agents"
    title="把佣金规则放到明面"
    subtitle="佣金政策对比 · 履约记录 · 匿名竞价"
    action="发布匿名合作需求"
    :steps="['筛选政策', '核对口径', '匿名竞价']"
    @request="requestOpen = true"
  >
    <div class="svc-tabs" aria-label="代理服务视图">
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
      title="暂无代理政策"
      description="暂时没有可比较的政策与履约记录。"
    />
    <template v-else>
      <section v-if="tab === 'policies'" class="svc-card">
        <div class="svc-heading">
          <h2>代理政策对比</h2>
        </div>
        <div class="svc-filters">
          <select v-model="model" aria-label="佣金模式">
            <option value="net">净收益分成</option>
            <option value="cpa">CPA 固定佣金</option></select
          ><select v-model="settlement" aria-label="代理结算周期">
            <option value="all">结算周期</option>
            <option value="weekly">周结 U</option>
            <option value="daily">日结 U</option></select
          ><select v-model="fee" aria-label="场馆费筛选">
            <option value="all">场馆费</option>
            <option value="low">≤ 8%</option>
            <option value="none">不扣场馆费</option>
          </select>
        </div>
        <template v-if="policies.length">
          <table class="svc-table svc-policy-table">
            <caption class="svc-sr-only">
              代理佣金政策比较表
            </caption>
            <thead>
              <tr>
                <th scope="col">政策项</th>
                <th v-for="policy in policies" :key="policy.id" scope="col">
                  <span class="svc-avatar small" :class="{ purple: policy.id === 'B' }">{{
                    policy.id
                  }}</span
                  >{{ policy.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">基础返佣</th>
                <td v-for="policy in policies" :key="policy.id">
                  <strong>{{ policy.commission }}%</strong>
                </td>
              </tr>
              <tr>
                <th scope="row">结算周期</th>
                <td v-for="policy in policies" :key="policy.id">
                  {{ policy.settlement === 'weekly' ? '周结' : '日结' }} · USDT
                </td>
              </tr>
              <tr>
                <th scope="row">场馆费</th>
                <td v-for="policy in policies" :key="policy.id">扣 {{ policy.venueFee }}%</td>
              </tr>
              <tr>
                <th scope="row">负盈利结转</th>
                <td v-for="policy in policies" :key="policy.id">
                  {{ policy.carryover ? '跨月结转' : '不结转' }}
                </td>
              </tr>
              <tr>
                <th scope="row">其他扣减</th>
                <td v-for="policy in policies" :key="policy.id">{{ policy.deductions }}</td>
              </tr>
              <tr>
                <th scope="row">政策来源</th>
                <td v-for="policy in policies" :key="policy.id">
                  <button
                    class="svc-text"
                    :aria-label="`${policy.name}代理条款`"
                    @click="terms(policy)"
                  >
                    查看条款 <ChevronRight :size="12" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="svc-estimate">
            <div class="svc-heading">
              <h3>同口径试算</h3>
              <span>仅扣场馆费</span>
            </div>
            <p class="svc-note">假设净收益 {{ formatUnits(amount(netRevenue)) }}，未计其他扣减</p>
            <div class="svc-estimate-values">
              <div v-for="policy in policies" :key="policy.id">
                <span class="svc-avatar small" :class="{ purple: policy.id === 'B' }">{{
                  policy.id
                }}</span
                ><span
                  ><small>预计佣金</small
                  ><strong>{{
                    formatUnits(estimateCommission(amount(netRevenue), policy))
                  }}</strong></span
                >
              </div>
            </div>
            <p class="svc-note">
              计算：净收益 ×（1 − 场馆费率）× 返佣比例。完整结算还受其他扣减与负盈利结转影响。
            </p>
            <div class="svc-actions">
              <button class="svc-text" @click="terms(policies[0]!)">
                查看扣减与锁佣条款 <ChevronRight :size="12" /></button
              ><button class="svc-outline" @click="calculator">自定义试算</button>
            </div>
          </div>
        </template>
        <div v-else class="svc-empty" role="status">
          <h3>暂无匹配政策</h3>
          <p>当前筛选条件下没有匹配政策。</p>
          <button class="svc-outline" @click="resetFilters">重置筛选</button>
        </div>
      </section>
      <section v-if="tab !== 'team'" class="svc-card">
        <div class="svc-heading">
          <h2>代理履约与争议</h2>
          <button class="svc-text" @click="panel = 'method'">
            评级方法 <ChevronRight :size="12" />
          </button>
        </div>
        <button
          v-for="policy in agentPolicies"
          :key="policy.id"
          class="svc-evidence-row"
          :aria-label="`${policy.name}履约与争议证据`"
          @click="evidence(policy)"
        >
          <span class="svc-avatar small" :class="{ purple: policy.id === 'B' }">{{
            policy.id
          }}</span
          ><strong>{{ policy.name }}</strong
          ><span
            ><span class="svc-badge">样本不足，暂不评级</span
            ><small>结算记录待核验</small></span
          ><ChevronRight :size="14" />
        </button>
        <button class="svc-text" @click="evidence(agentPolicies[0]!)">
          查看扣量、锁佣与争议处理证据 <ChevronRight :size="12" />
        </button>
      </section>
      <template v-if="tab !== 'reputation'">
        <button class="svc-team-card" @click="requestOpen = true">
          <UsersRound :size="32" /><span
            ><strong>大团队匿名竞价</strong><small>按团队规模与合作诉求，收集定制报价</small></span
          ><span class="svc-team-link">创建需求 <ChevronRight :size="12" /></span>
        </button>
        <button class="svc-roadmap" @click="panel = 'roadmap'">
          <ShieldCheck :size="31" /><span
            ><strong>第三方佣金担保 / 仲裁</strong><small>按合作条款提供结算保障</small></span
          ><ChevronRight :size="14" />
        </button>
      </template>
      <RequestSummary v-if="tab === 'team'" kind="agents" @create="requestOpen = true" />
    </template>
    <AnonymousRequest
      :open="requestOpen"
      kind="agents"
      @close="requestOpen = false"
      @saved="tab = 'team'"
    />
    <BottomDrawer
      :open="panel !== null"
      :title="
        panel === 'calculator'
          ? '自定义佣金试算'
          : panel === 'terms'
            ? `${selected.name} · 扣减与锁佣条款`
            : panel === 'evidence'
              ? `${selected.name} · 履约与争议证据`
              : panel === 'method'
                ? '信誉评级方法'
                : '第三方担保与仲裁规划'
      "
      subtitle="代理条款"
      @close="panel = null"
    >
      <div class="svc-panel">
        <form v-if="panel === 'calculator'" class="svc-form" @submit.prevent="calculated = true">
          <p class="svc-note">
            试算仅作条款比较，不代表实际佣金承诺。下方可调整各平台费率与其他扣减。
          </p>
          <label
            >当期净收益（U）<input
              v-model="netRevenue"
              type="number"
              min="0"
              max="1000000000000"
              step="0.01"
              required
              inputmode="decimal"
          /></label>
          <fieldset v-for="policy in customPolicies" :key="policy.id">
            <legend>{{ policy.name }} · 自定义假设</legend>
            <label
              >返佣比例（%）<input
                v-model.number="policy.commission"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                inputmode="decimal" /></label
            ><label
              >场馆费率（%）<input
                v-model.number="policy.venueFee"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                inputmode="decimal" /></label
            ><label
              >其他扣减（U）<input
                v-model="costs[policy.id]"
                type="number"
                min="0"
                max="1000000000000"
                step="0.01"
                required
                inputmode="decimal"
            /></label>
          </fieldset>
          <button class="svc-primary" type="submit">计算预计佣金</button>
          <div v-if="calculated" role="status" class="svc-calculator-result">
            <h3>试算结果</h3>
            <p v-for="policy in customPolicies" :key="policy.id">
              {{ policy.name }}：<strong>{{ formatUnits(total(policy)) }}</strong>
            </p>
          </div>
          <p class="svc-note">
            公式：max(0，净收益 ×（1 − 场馆费率）− 其他扣减) ×
            返佣比例。按“扣费后分成”假设，结果四舍五入至 0.01 U；跨期负盈利未计入，需单独核对合同。
          </p>
        </form>
        <template v-else-if="panel === 'terms'">
          <div class="svc-inline-tabs">
            <button
              v-for="policy in agentPolicies"
              :key="policy.id"
              :aria-pressed="selected.id === policy.id"
              @click="selected = policy"
            >
              {{ policy.name }}
            </button>
          </div>
          <dl class="svc-detail-list">
            <div>
              <dt>净收益与场馆费</dt>
              <dd>
                已结算有效投注形成的净收益，先扣 {{ selected.venueFee }}%
                场馆费及其他成本，再按 {{ selected.commission }}%
                分成；各场馆费率以原始账单为准。
              </dd>
            </div>
            <div>
              <dt>其他扣减</dt>
              <dd>
                {{
                  selected.deductions
                }}。主页面试算未计入其他扣减，完整结算以政策明细为准。
              </dd>
            </div>
            <div>
              <dt>负盈利结转</dt>
              <dd>
                {{
                  selected.carryover
                    ? '负余额跨月带入下一期，先抵扣新收益再计算佣金；具体到期与重置条件应书面约定。'
                    : '不跨期结转负盈利；当期可分成收益不为正时，佣金按 0 计。'
                }}
              </dd>
            </div>
            <div>
              <dt>结算周期</dt>
              <dd>
                {{ selected.settlement === 'weekly' ? '周结' : '日结' }}
                USDT。具体截账时间、时区、支付日期、网络与最低支付额均需在正式协议确认。
              </dd>
            </div>
            <div>
              <dt>扣量与锁佣</dt>
              <dd>{{ selected.lockTerms }} 不应只以平台单方统计作为核验依据。</dd>
            </div>
            <div>
              <dt>来源与状态</dt>
              <dd>{{ serviceSnapshot }}</dd>
            </div>
          </dl>
        </template>
        <template v-else-if="panel === 'method'">
          <h3>先有证据，再给评级</h3>
          <p class="svc-note">
            拟结合政策透明度、按期结算记录、扣量与锁佣争议、申诉响应及处理结果，建立可追溯信誉档案。出金速度不作为代理信誉或平台安全评级的替代。
          </p>
          <dl class="svc-detail-list">
            <div>
              <dt>来源要求</dt>
              <dd>保存政策版本、原始结算凭证、样本窗口与双方陈述；公开前需脱敏及用户授权。</dd>
            </div>
            <div>
              <dt>缺失与过期</dt>
              <dd>
                样本不足、来源不明或记录过期时不输出分数；单方投诉保留争议状态，不直接认定违约。
              </dd>
            </div>
            <div>
              <dt>当前状态</dt>
              <dd>评级按证据给出。样本不足时不输出分数。出金速度不作为代理信誉的替代。</dd>
            </div>
          </dl>
        </template>
        <template v-else-if="panel === 'evidence'">
          <p class="svc-notice">样本不足，暂不评级。</p>
          <dl class="svc-detail-list">
            <div>
              <dt>佣金政策</dt>
              <dd>条款待外部来源核验。</dd>
            </div>
            <div>
              <dt>结算履约</dt>
              <dd>暂无数据；无已核验样本，不展示准时率。</dd>
            </div>
            <div>
              <dt>扣量与锁佣</dt>
              <dd>暂无数据；无原始订单、账单与平台回复。</dd>
            </div>
            <div>
              <dt>争议处理</dt>
              <dd>暂无数据；不以缺少投诉推断信誉良好。</dd>
            </div>
            <div>
              <dt>观察窗口</dt>
              <dd>证据更新时间与样本量暂无数据。</dd>
            </div>
          </dl>
          <button class="svc-outline" @click="panel = 'terms'">查看政策</button>
        </template>
        <template v-else
          ><h3>第三方担保与仲裁</h3>
          <p class="svc-note">
            担保范围、证据标准与争议规则以书面约定为准，不接收任何担保资金。
          </p></template
        >
      </div>
    </BottomDrawer>
  </ServiceLayout>
</template>
