<script setup lang="ts">
import { computed, ref } from 'vue'
import { TriangleAlert, ChevronRight } from '@lucide/vue'
import { sportsMatches } from '@/mocks/sports'
import { formatOdds, validateSlip } from './logic'
import type { OddsFormat, SlipLeg } from './types'
const props = defineProps<{ format: OddsFormat }>()
const emit = defineEmits<{ validated: [legs: SlipLeg[]] }>()
const text = ref('')
const parsed = ref(false)
const legs = ref<SlipLeg[]>([])
const errors = ref<string[]>([])
const validation = computed(() =>
  errors.value.length
    ? { valid: false, reason: errors.value.join('；') }
    : validateSlip(legs.value),
)
function example() {
  text.value = '海港队胜 @ 2.10 平台 A\n北辰队胜 @ 2.10 平台 B'
  parsed.value = false
}
function parse() {
  legs.value = []
  errors.value = []
  parsed.value = true
  const lines = text.value
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
  if (lines.length > 12) {
    errors.value = ['最多识别12条，请减少条数。']
    return
  }
  lines.forEach((line, index) => {
    const found = line.match(/^(.+?)\s*@\s*(\d+(?:\.\d+)?)\s+(.+)$/)
    if (!found || Number(found[2]) <= 1) {
      errors.value.push(`第${index + 1}条格式不完整，请使用“选项 @ 十进制赔率 平台”`)
      return
    }
    const selection = found[1]!.trim()
    const matches = sportsMatches.filter(
      (m) => selection === `${m.home}胜` || selection === `${m.away}胜`,
    )
    const match = matches.length === 1 ? matches[0] : undefined
    legs.value.push({
      eventId: match?.id ?? null,
      eventName: match ? `${match.home} VS ${match.away}` : selection,
      sport: match?.sport === 'basketball' ? '篮球' : '足球',
      platform: found[3]!.trim(),
      selection,
      decimal: Number(found[2]),
      result: match ? (selection === `${match.home}胜` ? 'home' : 'away') : null,
      marketId:
        match?.markets.find((m) => m.kind === 'winner' && m.calculationEligible)?.id ?? null,
    })
  })
}
</script>
<template>
  <div class="sp-slip">
    <p class="sp-tool-subtitle">先确认赛事与盘口，再进行试算</p>
    <section class="sp-card">
      <h3>粘贴注单文字</h3>
      <textarea
        v-model="text"
        aria-label="注单文字"
        rows="4"
        placeholder="选项 @ 十进制赔率 平台，例如：北辰队胜 @ 2.10 平台 A"
        @input="parsed = false"
      ></textarea>
      <p class="sp-small-note">仅本地处理，不自动读取剪贴板</p>
      <div class="sp-split-actions">
        <button class="sp-secondary" @click="example">填入示例</button
        ><button class="sp-primary" @click="parse">识别并核对</button>
      </div>
    </section>
    <section v-if="parsed" class="sp-card">
      <div class="sp-section-title">
        <h3>识别结果</h3>
        <span>{{ legs.length }} 条</span>
      </div>
      <div v-for="(leg, index) in legs" :key="index" class="sp-slip-leg">
        <h3>{{ leg.eventName }}</h3>
        <dl>
          <div>
            <dt>赛事类型</dt>
            <dd>{{ leg.sport }} / 全场{{ leg.sport === '足球' ? '胜平负' : '胜负' }}</dd>
          </div>
          <div>
            <dt>选项</dt>
            <dd>{{ leg.selection }}</dd>
          </div>
          <div>
            <dt>平台与赔率</dt>
            <dd>{{ leg.platform }} · {{ formatOdds(leg.decimal, props.format) }}</dd>
          </div>
        </dl>
        <p v-if="!leg.marketId" class="sp-notice">市场或结算范围待确认</p>
      </div>
      <p :class="validation.valid ? 'sp-feedback' : 'sp-notice'" role="status">
        <TriangleAlert :size="17" />{{ validation.valid ? '基础匹配通过' : '无法组成对冲方案' }}：{{
          validation.reason
        }}
      </p>
      <button
        class="sp-primary sp-full"
        :disabled="!validation.valid"
        @click="emit('validated', legs)"
      >
        {{ validation.valid ? '查看分配试算' : '校验通过后试算'
        }}<ChevronRight v-if="validation.valid" :size="15" />
      </button>
    </section>
  </div>
</template>
