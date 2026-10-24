<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Copy,
  FileText,
  LockKeyhole,
} from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import { aiFunding, aiOffers, aiScope } from '@/mocks/ai-conversation'
import type { ChatAnswer, DetailPanel } from './conversation-types'
const props = defineProps<{ open: boolean; panel: DetailPanel; answer?: ChatAnswer }>()
const emit = defineEmits<{ close: [] }>()
const tab = ref<'analysis' | 'sources'>('analysis')
const copyStatus = ref('')
watch([() => props.open, () => props.panel, () => props.answer], () => {
  if (props.open) {
    tab.value = 'analysis'
    copyStatus.value = ''
  }
})
const titles = {
  analysis: '推荐依据与数据来源',
  sources: '来源与数据口径',
  quotes: '同盘口完整对比',
  funding: '出金表现与统计口径',
  risk: '平台体检卡',
  limits: '提现限制与费用',
}
async function copy() {
  try {
    if (!navigator.clipboard) throw new Error('Unavailable')
    await navigator.clipboard.writeText(
      (props.answer?.sources ?? [])
        .map((source) => `${source.title}：${source.excerpt}`)
        .join('\n'),
    )
    copyStatus.value = '来源摘要已复制'
  } catch {
    copyStatus.value = '当前浏览器无法复制，请手动选取来源文本。'
  }
}
</script>
<template>
  <BottomDrawer :open="open" :title="titles[panel]" @close="emit('close')">
    <div class="ac-details" :key="panel">
      <p class="ac-detail-subtitle">
        {{
          panel === 'analysis' || panel === 'quotes'
            ? '维拉 +0.75 · 全场90分钟'
            : panel === 'sources'
              ? '引用摘录'
              : aiScope.funding
        }}
      </p>
      <template v-if="panel === 'analysis' || panel === 'sources'">
        <div v-if="panel === 'analysis'" class="ac-detail-tabs" aria-label="详情内容">
          <button
            :class="{ active: tab === 'analysis' }"
            :aria-pressed="tab === 'analysis'"
            @click="tab = 'analysis'"
          >
            分析理由</button
          ><button
            :class="{ active: tab === 'sources' }"
            :aria-pressed="tab === 'sources'"
            @click="tab = 'sources'"
          >
            来源与口径
          </button>
        </div>
        <template v-if="panel === 'analysis' && tab === 'analysis'">
          <section class="ac-card ac-detail-reason">
            <span>01</span>
            <div>
              <h3>状态与赛程</h3>
              <p>
                比较近期表现与休息时间；缺失数据不参与判断。
              </p>
            </div>
          </section>
          <section class="ac-card ac-detail-reason">
            <span>02</span>
            <div>
              <h3>
                伤停与首发 <small class="ac-pending"><LockKeyhole :size="11" />待确认</small>
              </h3>
              <p>结合已确认的伤停情况与可能的首发阵容。首发公布后重新评估。</p>
            </div>
          </section>
          <section class="ac-card ac-detail-reason">
            <span>03</span>
            <div>
              <h3>盘口与结算</h3>
              <p>受让 +0.75：负一球输半，打平或获胜全赢。盘口支持度代表解释强度，不是预测胜率。</p>
            </div>
          </section>
        </template>
        <section class="ac-card">
          <h2>来源与数据</h2>
          <article v-for="source in answer?.sources" :key="source.id" class="ac-source-item">
            <h3>
              <BookOpen v-if="source.id === 'rules'" :size="17" /><FileText v-else :size="17" />{{
                source.title
              }}
            </h3>
            <p class="ac-source-type">{{ source.type }}</p>
            <blockquote>{{ source.excerpt }}</blockquote>
            <p class="ac-card-note">{{ source.asOf }} · {{ source.status }}</p>
          </article>
          <p class="ac-card-note">仅展示可访问的摘录，不包含内部文档地址。</p>
        </section>
        <div class="ac-detail-status">
          <p>赛事信息<span>待核验</span></p>
          <p>报价时间<span>以来源为准</span></p>
          <p>有效期<span>过期报价不参与排名</span></p>
        </div>
        <button class="ac-soft-button" @click="copy"><Copy :size="15" />复制来源摘要</button>
        <p v-if="copyStatus" role="status" class="ac-feedback">
          <Check :size="14" />{{ copyStatus }}
        </p>
      </template>
      <template v-else-if="panel === 'quotes'">
        <div class="ac-condition">{{ aiScope.market }}</div>
        <p class="ac-prose">仅比较同赛事、同选项、同盘口、同周期与同结算规则的报价。</p>
        <section class="ac-card">
          <table class="ac-table">
            <caption class="ac-sr-only">
              同盘口平台报价
            </caption>
            <thead>
              <tr>
                <th>平台</th>
                <th>港盘水位</th>
                <th>参与比较</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in aiOffers"
                :key="row.platform"
                :class="{ 'ac-ineligible': !row.eligible }"
              >
                <th scope="row">平台 {{ row.platform }}</th>
                <td>{{ row.price }}</td>
                <td>{{ row.eligible ? '有效' : row.status }}</td>
              </tr>
            </tbody>
          </table>
          <p class="ac-card-note">平台 C 已过期，即使名义水位更高也不参与排序。</p>
        </section>
        <div class="ac-warning">
          <CircleAlert :size="16" /><span
            >报价、限额与可用地区以当时记录为准。</span
          >
        </div>
        <RouterLink to="/compare" class="ac-text-link" @click="emit('close')"
          >打开体育对比页<ChevronRight :size="16"
        /></RouterLink>
      </template>
      <template v-else-if="panel === 'funding'">
        <div class="ac-condition">{{ aiScope.funding }}</div>
        <p class="ac-card-note">{{ aiScope.window }}</p>
        <section class="ac-card">
          <table class="ac-table">
            <caption class="ac-sr-only">
              同口径出金数据
            </caption>
            <thead>
              <tr>
                <th>平台</th>
                <th>中位耗时</th>
                <th>样本量</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in aiFunding"
                :key="row.platform"
                :class="{ 'ac-ineligible': !row.eligible }"
              >
                <th scope="row">平台 {{ row.platform }}</th>
                <td>{{ row.median }}</td>
                <td>{{ row.samples }} 笔</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section class="ac-card">
          <h2>如何比较</h2>
          <p>
            统计从平台申请到到账的耗时；同链、同资产、同金额档、同观察窗口与同测量方法才可排序。
          </p>
          <p>
            平台 C 的样本未达到比较条件，不参与排名。样本存在覆盖偏差，不代表全部玩家体验。
          </p>
          <p>没有完整失败记录，不推导成功率；大额样本缺失时不能套用小额结果。</p>
        </section>
        <RouterLink to="/monitor" class="ac-text-link" @click="emit('close')"
          >打开监测页查看平台研究<ChevronRight :size="16"
        /></RouterLink>
      </template>
      <template v-else-if="panel === 'risk'">
        <div class="ac-condition">平台 A · 出金体检</div>
        <section class="ac-card">
          <div
            v-for="label in ['储备覆盖', '资金关联风险', '客诉处理']"
            :key="label"
            class="ac-risk-row"
          >
            <span>{{ label }}</span
            ><span class="ac-pending">待核验</span>
          </div>
          <p class="ac-card-note">到账速度不能代替储备、资金风险与平台偿付能力评估。</p>
        </section>
      </template>
      <template v-else>
        <section class="ac-card">
          <h2>提现前核对</h2>
          <ol>
            <li>网络与资产是否匹配。</li>
            <li>最低提现金额、单笔限额与审核条件。</li>
            <li>固定手续费、网络费用及到账测量口径。</li>
          </ol>
        </section>
        <section class="ac-card">
          <h2>当前数据覆盖</h2>
          <p>
            费用、限额、地区可用性与审核条款需在提现前逐项核对。
          </p>
        </section>
      </template>
      <button class="ac-primary ac-return" @click="emit('close')">返回继续追问</button>
    </div>
  </BottomDrawer>
</template>
