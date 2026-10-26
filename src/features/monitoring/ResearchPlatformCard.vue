<script setup lang="ts">
import PlatformFollowButton from './PlatformFollowButton.vue'
import PlatformAccountLink from '@/shared/ui/PlatformAccountLink.vue'
import { ChevronRight, ShieldCheck, TriangleAlert, Clock3 } from '@lucide/vue'
import { computed } from 'vue'
import { percent } from './analytics-model'
import type { ResearchPlatform, ResearchWindow } from './research'
import { researchSnapshot } from '@/mocks/monitoring-research'
const props = defineProps<{
  platform: ResearchPlatform
  window: ResearchWindow
  rank?: number
  periodLabel?: string
  snapshot?: string
  growth?: number | null
  share?: number | null
}>()
const emit = defineEmits<{ open: [kind: string, platform: ResearchPlatform] }>()
const flowLabel = computed(() => props.periodLabel ?? '24h')
const deposit = computed(() => props.platform.windows[props.window])
const warning = computed(
  () => props.platform.flowPercent !== null && props.platform.flowPercent < -25,
)
const deltaText = computed(() => percent(props.growth ?? null))
const deltaClass = computed(() =>
  props.growth === null || props.growth === undefined
    ? ''
    : props.growth >= 0
      ? 'research-positive'
      : 'research-negative',
)
const flowAmount = computed(() => (props.platform.flow ?? '—').replace(/^[-−]/, ''))
const shareText = computed(() =>
  props.share === null || props.share === undefined ? '—' : `${props.share.toFixed(1)}%`,
)
const mark = computed(() =>
  props.platform.id.length <= 2
    ? props.platform.id
    : (props.platform.name.match(/[\u4e00-\u9fff]$/)?.[0] ?? props.platform.name.slice(0, 1)),
)
const comparable = computed(() => props.platform.score === null && props.platform.wallet !== null)
</script>

<template>
  <article
    :id="`platform-${platform.id}`"
    class="research-platform"
    :class="{ 'research-platform--partial': platform.score === null }"
    :aria-label="platform.name"
  >
    <div class="research-platform__header" @click="emit('open', '详情', platform)">
      <span v-if="rank" class="research-rank">{{ rank }}</span
      ><span class="research-avatar" :class="`research-avatar--${platform.id}`">{{ mark }}</span>
      <span class="research-platform__identity"
        ><h3 class="research-account-name">
          <button type="button" :title="platform.name" :aria-label="`${platform.name}详情`">
            {{ platform.name }}</button
          ><PlatformAccountLink :platform="platform.id" :name="platform.name" /></h3
      ></span>
      <PlatformFollowButton compact :id="platform.id" :name="platform.name" />
      <span v-if="platform.score !== null" class="research-score"
        ><ShieldCheck :size="19" fill="#0874ff" color="white" /><strong>{{ platform.score }}</strong
        ><small>/10</small></span
      >
      <span v-else-if="!comparable" class="research-partial">样本不足 · 暂不评分</span
      ><button
        class="research-detail-arrow"
        :aria-label="`${platform.name}全部细项`"
        @click.stop="emit('open', '详情', platform)"
      >
        <ChevronRight :size="16" />
      </button>
    </div>
    <template v-if="platform.score !== null">
      <p v-if="warning" class="research-warning">
        <TriangleAlert :size="18" /><span
          >{{ flowLabel }} 余额变化 {{ platform.flowPercent }}% · 查看详情了解异动</span
        >
      </p>
      <div class="research-metrics">
        <div class="research-metric">
          <span>{{ periodLabel ?? window }} 存款额</span>
          <strong>{{ deposit.deposit }}</strong>
          <small :class="deltaClass">{{ deltaText }}</small>
          <small v-if="growth !== null">较前一个等长窗口</small>
        </div>
        <div class="research-metric">
          <span>热钱包余额</span><strong>{{ platform.wallet }}</strong>
          <small v-if="platform.flowPercent === null">净流量 —</small>
          <small v-else
            >{{ flowLabel }} {{ platform.flowPercent >= 0 ? '净流入' : '净流出' }}
            <b :class="platform.flowPercent >= 0 ? 'research-positive' : 'research-negative'">{{
              flowAmount
            }}</b></small
          >
        </div>
        <div class="research-metric">
          <span>出金纯净度</span
          ><span
            class="research-grade"
            :class="{ 'research-grade--warning': platform.grade === 'B' }"
            ><ShieldCheck :size="16" />{{ platform.grade }}级 · {{ platform.taint }}%</span
          >
          <small>近7天 · ≤3跳关联</small>
        </div>
        <div class="research-metric research-time">
          <span>实测出款耗时</span>
          <div class="research-timing-values">
            <span
              ><small>小额</small><b>{{ platform.smallMinutes }}m</b></span
            ><span
              ><small>大额</small><b>{{ platform.largeMinutes }}m</b></span
            >
          </div>
          <small>样本 {{ platform.samples }} 笔</small>
        </div>
      </div>
    </template>
    <div v-else-if="comparable" class="research-metrics">
      <div class="research-metric">
        <span>{{ periodLabel ?? window }} 存款额</span>
        <strong>{{ deposit.deposit }}</strong>
        <small :class="deltaClass">{{ deltaText }}</small>
        <small v-if="growth !== null">较前一个等长窗口</small>
      </div>
      <div class="research-metric">
        <span>热钱包余额</span><strong>{{ platform.wallet }}</strong>
        <small v-if="platform.flowPercent === null">净流量 —</small>
        <small v-else
          >{{ flowLabel }} {{ platform.flowPercent >= 0 ? '净流入' : '净流出' }}
          <b :class="platform.flowPercent >= 0 ? 'research-positive' : 'research-negative'">{{
            flowAmount
          }}</b></small
        >
      </div>
      <div class="research-metric research-metric--wide">
        <span>范围内占比</span><strong>{{ shareText }}</strong>
      </div>
    </div>
    <div v-if="platform.score !== null || comparable" class="research-card-summary">
      <span class="research-card-snapshot" :title="`数据快照：${snapshot ?? researchSnapshot}`"
        ><Clock3 :size="12" aria-hidden="true" />{{ snapshot ?? researchSnapshot }}</span
      >
      <button
        class="research-card-detail"
        :aria-label="`查看${platform.name}完整详情`"
        @click="emit('open', '详情', platform)"
      >
        查看详情<ChevronRight :size="13" aria-hidden="true" />
      </button>
    </div>
  </article>
</template>

<style scoped>
.research-platform {
  min-width: 0;
  padding: 0 14px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 20px;
  background: var(--ae-surface);
  box-shadow:
    0 4px 16px #729ed80d,
    inset 0 1px #fff;
  scroll-margin-top: 12px;
  font-variant-numeric: tabular-nums;
}
button {
  border: 0;
  background: none;
  font: inherit;
}
.research-platform__header {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 66px;
  gap: 6px;
  padding: 8px 0;
  text-align: left;
}
.research-rank {
  flex: 0 0 16px;
  color: var(--ae-muted);
  font-size: 12px;
  text-align: center;
}
.research-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border: 1px solid #ffffffb3;
  border-radius: 11px;
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  color: white;
  font-size: 21px;
  font-weight: 650;
}
.research-avatar--B {
  background: linear-gradient(145deg, #7ce5e7, #02a8bd);
}
.research-avatar--C {
  background: linear-gradient(145deg, #ccd7e4, #7c8da4);
}
.research-platform__identity {
  flex: 1;
  min-width: 0;
}
.research-account-name {
  display: flex;
  align-items: center;
  min-width: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.35;
}
.research-account-name > button:first-child {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  min-width: 0;
  min-height: 44px;
  max-height: 44px;
  max-width: calc(100% - 44px);
  padding: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
  color: var(--ae-text);
  text-align: left;
}
.research-account-name :deep(.platform-account-link) {
  flex: 0 0 44px;
}
.research-score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 3px;
  color: var(--ae-text);
  white-space: nowrap;
}
.research-score strong {
  font-size: 18px;
  font-weight: 700;
}
.research-score small {
  font-size: 11px;
  color: var(--ae-muted);
}
.research-score > svg {
  width: 16px;
  height: 16px;
}
.research-detail-arrow {
  display: grid;
  place-items: center;
  flex: 0 0 44px;
  width: 44px;
  min-height: 44px;
  margin-right: -6px;
  border-radius: 12px;
  color: var(--ae-label);
}
.research-detail-arrow:active {
  background: var(--ae-bg);
}
.research-warning {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: #fff6e4;
  color: var(--ae-warning);
  font-size: 11px;
  line-height: 1.5;
}
.research-warning > svg {
  flex-shrink: 0;
}
.research-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border-top: 1px solid var(--ae-line-strong);
}
.research-metric {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 10px;
}
.research-metric:nth-child(odd) {
  padding-left: 0;
  border-right: 1px solid var(--ae-line-strong);
}
.research-metric:nth-child(even) {
  padding-right: 0;
}
.research-metric:nth-child(n + 3) {
  border-top: 1px solid var(--ae-line-strong);
}
.research-metric > span:first-child {
  color: var(--ae-label);
  font-size: 12px;
  line-height: 1.4;
}
.research-metric > strong {
  color: var(--ae-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.5px;
  white-space: nowrap;
}
.research-metric > small {
  color: var(--ae-muted);
  font-size: 11px;
  line-height: 1.5;
}
.research-metric > small b {
  font-weight: 600;
  white-space: nowrap;
}
.research-metric > small.research-positive,
.research-positive {
  color: var(--ae-up);
}
.research-metric > small.research-negative,
.research-negative {
  color: var(--ae-down);
}
.research-grade {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  min-height: 28px;
  padding: 3px 8px;
  border: 1px solid #c1ecdf;
  border-radius: 9px;
  color: var(--ae-up);
  background: #e7f6f1;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.research-grade--warning {
  color: var(--ae-warning);
  background: #fff6e4;
  border-color: #f4dfb5;
}
.research-timing-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 4px;
  min-height: 28px;
}
.research-timing-values > span {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  white-space: nowrap;
}
.research-timing-values small {
  color: var(--ae-muted);
  font-size: 11px;
}
.research-timing-values b {
  color: var(--ae-text);
  font-size: 12px;
  font-weight: 600;
}
.research-card-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 48px;
  border-top: 1px solid var(--ae-line-strong);
}
.research-card-snapshot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: var(--ae-muted);
  font-size: 11px;
  white-space: nowrap;
}
.research-card-snapshot > svg {
  flex-shrink: 0;
}
.research-card-detail {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 72px;
  min-height: 44px;
  padding: 0;
  color: var(--ae-highlight);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}
.research-partial {
  flex-shrink: 0;
  max-width: 106px;
  padding: 4px 7px;
  border-radius: 8px;
  color: var(--ae-muted);
  background: var(--ae-bg);
  font-size: 11px;
  line-height: 1.5;
}
.research-metric.research-metric--wide {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  padding-inline: 0;
  border-right: 0;
}
.research-metric--wide > strong {
  font-size: 17px;
}
@media (max-width: 374px) {
  .research-platform {
    padding-inline: 12px;
  }
  .research-platform__header {
    gap: 4px;
  }
  .research-account-name {
    font-size: 14px;
  }
  .research-score strong {
    font-size: 17px;
  }
  .research-score small {
    font-size: 10px;
  }
  .research-metric {
    padding-inline: 8px;
  }
  .research-metric > strong {
    font-size: 22px;
  }
  .research-partial {
    max-width: 94px;
  }
}
</style>
