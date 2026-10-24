<script setup lang="ts">
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesColumn,
  ChevronRight,
  CircleAlert,
  Database,
  ThumbsUp,
} from '@lucide/vue'
import AiOrb from '@/shared/ui/AiOrb.vue'
import { aiFunding, aiOffers, aiScope } from '@/mocks/ai-conversation'
import type { ChatAnswer, DetailPanel } from './conversation-types'
defineProps<{ answer: ChatAnswer }>()
const emit = defineEmits<{ detail: [panel: DetailPanel]; followup: [question: string] }>()
</script>

<template>
  <div class="ac-answer">
    <div class="ac-identity">
      <AiOrb /><span>模型分析</span><span><BookOpen :size="12" />内部资料</span>
    </div>
    <template v-if="answer.kind === 'sports'">
      <div class="ac-card ac-fixture">
        <div class="ac-fixture-teams">
          <span class="ac-crest ac-crest--villa">AV</span><strong>阿斯顿维拉</strong
          ><span class="ac-vs">VS</span><strong>曼城</strong
          ><span class="ac-crest ac-crest--city">MC</span>
        </div>
        <p>{{ aiScope.kickoff }} <span>· 赛程待核验</span></p>
      </div>
      <p class="ac-prose">{{ answer.summary }}</p>
      <section class="ac-card ac-recommend" aria-label="方向参考">
        <h2>方向参考</h2>
        <div class="ac-selection">
          <div>
            <strong>维拉 +0.75</strong>
            <p>全场亚洲让球 · 90分钟</p>
          </div>
          <span>支持度：中等</span>
        </div>
        <h3>主要依据</h3>
        <ol>
          <li>主场对位与反击空间。</li>
          <li>密集赛程下的体能变数。</li>
        </ol>
        <button class="ac-warning" @click="emit('detail', 'analysis')">
          <CircleAlert :size="14" /><span>首发与伤停待确认</span
          ><ChevronRight :size="15" />
        </button>
        <button class="ac-text-link" @click="emit('detail', 'analysis')">
          完整分析与依据<ChevronRight :size="16" />
        </button>
      </section>
      <section class="ac-card ac-quotes" aria-label="同盘口报价">
        <div class="ac-section-heading">
          <h2>同盘口报价</h2>
          <span>主队 +0.75 · 港盘</span>
        </div>
        <table class="ac-table">
          <caption class="ac-sr-only">同盘口报价</caption>
          <thead>
            <tr>
              <th>平台</th>
              <th>水位</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quote in aiOffers.filter((item) => item.eligible)" :key="quote.platform">
              <th scope="row">平台 {{ quote.platform }}</th>
              <td>{{ quote.price }}</td>
              <td><span class="ac-valid">有效</span></td>
            </tr>
          </tbody>
        </table>
        <p class="ac-card-note">出金表现需单独比较。</p>
        <button class="ac-soft-button" @click="emit('detail', 'quotes')">
          查看同盘口完整对比<ArrowUpRight :size="15" />
        </button>
        <button class="ac-text-link" @click="emit('detail', 'sources')">
          来源与更新时间<ChevronRight :size="16" />
        </button>
      </section>
    </template>
    <template v-else-if="answer.kind === 'funding'">
      <p class="ac-prose ac-assistant-bubble">{{ answer.summary }}</p>
      <div class="ac-condition">
        <Database :size="14" /><span>比较条件：{{ aiScope.funding }}</span>
      </div>
      <section class="ac-card ac-funding-card" aria-label="出金表现">
        <h2 class="ac-recommend-heading">
          <span><ThumbsUp :size="22" /></span>已知数据下，优先关注平台 A
        </h2>
        <h3>主要原因</h3>
        <ol>
          <li>中位耗时更短。</li>
          <li>样本满足此比较条件。</li>
        </ol>
        <table class="ac-table">
          <caption class="ac-sr-only">
            {{
              aiScope.funding
            }}，出金记录
          </caption>
          <thead>
            <tr>
              <th>平台</th>
              <th>中位耗时</th>
              <th>样本</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in aiFunding"
              :key="row.platform"
              :class="{ 'ac-ineligible': !row.eligible }"
            >
              <th scope="row">平台 {{ row.platform }}</th>
              <td :class="{ 'ac-fast': row.platform === 'A' }">{{ row.median }}</td>
              <td>{{ row.samples }} 笔</td>
            </tr>
          </tbody>
        </table>
        <p class="ac-card-note">申请到到账 · {{ aiScope.window }}</p>
        <button class="ac-text-link" @click="emit('detail', 'funding')">
          统计口径与来源<ChevronRight :size="16" />
        </button>
      </section>
      <section class="ac-card" aria-label="风险与评级">
        <div class="ac-section-heading">
          <h2>风险与评级单独看</h2>
          <span class="ac-pending">存在待核验项</span>
        </div>
        <button
          v-for="label in ['储备覆盖', '资金关联风险', '客诉处理']"
          :key="label"
          class="ac-risk-row"
          @click="emit('detail', 'risk')"
        >
          <span>{{ label }}</span
          ><span>待核验<ChevronRight :size="14" /></span>
        </button>
        <button class="ac-text-link" @click="emit('detail', 'risk')">
          查看平台体检卡<ChevronRight :size="16" />
        </button>
      </section>
      <section class="ac-card ac-plan" aria-label="内部推荐方案">
        <div class="ac-plan-heading">
          <AiOrb />
          <div>
            <h2>内部推荐方案</h2>
            <p>先核对网络，再按金额查看提现限制。</p>
          </div>
        </div>
        <div class="ac-plan-actions">
          <button class="ac-primary" @click="emit('detail', 'limits')">查看限制与费用</button
          ><button class="ac-outline" @click="emit('detail', 'funding')">比较更多平台</button>
        </div>
        <p class="ac-card-note"><CircleAlert :size="13" />到账速度不代表安全保证。</p>
      </section>
    </template>
    <div v-else class="ac-card ac-clarify">
      <p class="ac-prose">{{ answer.summary }}</p>
      <p class="ac-card-note">请提供赛事名称、市场与盘口，或链、资产和金额档。</p>
    </div>
    <div class="ac-followups" aria-label="继续追问">
      <button
        v-for="question in answer.followups"
        :key="question"
        @click="emit('followup', question)"
      >
        {{ question }}<ChevronRight :size="14" />
      </button>
    </div>
    <div class="ac-answer-footnote"><ChartNoAxesColumn :size="12" />关键事实待核验</div>
  </div>
</template>
