<script setup lang="ts">
import RebateBenefit from '@/features/rewards/RebateBenefit.vue'
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
        ><ShieldCheck :size="16" fill="#0864ff" color="white" /><strong>{{ platform.score }}</strong
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
        <div class="research-metric research-metric--hero">
          <span>{{ periodLabel ?? window }} 存款额</span>
          <strong>{{ deposit.deposit }}</strong>
          <small :class="deltaClass">{{ deltaText }}</small>
          <small v-if="growth !== null">较前一个等长窗口</small>
        </div>
        <div class="research-metric research-metric--hero">
          <span>热钱包余额</span><strong>{{ platform.wallet }}</strong>
          <small v-if="platform.flowPercent === null">净流量 —</small>
          <small v-else class="research-flow"
            >{{ flowLabel }} {{ platform.flowPercent >= 0 ? '净流入' : '净流出' }}
            <b :class="platform.flowPercent >= 0 ? 'research-positive' : 'research-negative'">{{
              flowAmount
            }}</b></small
          >
        </div>
        <div class="research-metric research-metric--quiet">
          <span>出金纯净度</span
          ><span
            class="research-grade"
            :class="{ 'research-grade--warning': platform.grade === 'B' }"
            ><ShieldCheck :size="16" />{{ platform.grade }}级 · {{ platform.taint }}%</span
          >
          <small>近7天 · ≤3跳关联</small>
        </div>
        <div class="research-metric research-time research-metric--quiet">
          <span>实测出款耗时中位数</span>
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
      <div class="research-metric research-metric--hero">
        <span>{{ periodLabel ?? window }} 存款额</span>
        <strong>{{ deposit.deposit }}</strong>
        <small :class="deltaClass">{{ deltaText }}</small>
        <small v-if="growth !== null">较前一个等长窗口</small>
      </div>
      <div class="research-metric research-metric--hero">
        <span>热钱包余额</span><strong>{{ platform.wallet }}</strong>
        <small v-if="platform.flowPercent === null">净流量 —</small>
        <small v-else class="research-flow"
          >{{ flowLabel }} {{ platform.flowPercent >= 0 ? '净流入' : '净流出' }}
          <b :class="platform.flowPercent >= 0 ? 'research-positive' : 'research-negative'">{{
            flowAmount
          }}</b></small
        >
      </div>
      <div class="research-metric research-metric--wide research-metric--quiet">
        <span>范围内占比</span><strong>{{ shareText }}</strong>
      </div>
    </div>
    <RebateBenefit :platform="platform.id" :name="platform.name" binding />
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
  padding: 4px 12px 6px;
  border: 1px solid #d7e6f8;
  border-radius: 20px;
  background: #fff;
  box-shadow:
    0 1px 2px #6d9ed414,
    0 8px 20px #6d9ed414,
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
  min-height: 64px;
  gap: 5px;
  padding: 6px 0 8px;
  text-align: left;
}
.research-rank {
  flex: 0 0 16px;
  color: #526581;
  font-size: 12px;
  font-weight: 500;
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
  color: #14213d;
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
  color: #14213d;
  text-align: left;
}
.research-account-name :deep(.platform-account-link) {
  flex: 0 0 44px;
}
.research-platform :deep(.platform-follow.platform-follow--compact) {
  border-color: #c5dbf8;
  background: #fff;
  box-shadow:
    0 1px 2px #6d9ed414,
    inset 0 1px #fff;
  color: #0864ff;
}
.research-platform :deep(.platform-follow.platform-follow--compact.active) {
  border-color: #8eb7f5;
  background: #d9ebff;
  box-shadow: inset 0 1px #fff;
}
.research-platform :deep(.platform-follow:focus-visible) {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
.research-score {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 3px;
  color: #0864ff;
  white-space: nowrap;
}
.research-score strong {
  color: #0864ff;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.4px;
  line-height: 1;
}
.research-score small {
  align-self: flex-end;
  margin-bottom: 1px;
  color: #526581;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
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
  margin-right: -8px;
  border-radius: 12px;
  color: #0864ff;
}
.research-detail-arrow:active {
  background: #eaf3ff;
}
.research-warning {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 8px;
  padding: 8px 10px;
  border-radius: 12px;
  background: #fff6e4;
  color: var(--ae-warning);
  font-size: 12px;
  line-height: 1.45;
}
.research-warning > svg {
  flex-shrink: 0;
}
.research-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin: 0 0 2px;
  padding: 6px;
  border-radius: 16px;
  background: #eaf3ff;
}
.research-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 8px;
  border: 1px solid transparent;
  border-radius: 14px;
}
.research-metric--hero {
  border-color: #fff;
  background: #fff;
  box-shadow:
    0 1px 2px #6d9ed414,
    inset 0 1px #fff;
}
.research-metric--quiet {
  gap: 6px;
  border-color: #c5dbf8;
  background: #f7fbff;
  box-shadow: inset 0 1px #fff;
}
.research-metric > span:first-child {
  color: #3d5d86;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
}
.research-metric > strong {
  max-width: 100%;
  overflow: hidden;
  color: #14213d;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.3px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.research-metric--hero > strong {
  margin-top: 1px;
  font-size: 26px;
  letter-spacing: -0.6px;
}
.research-metric > small {
  max-width: 100%;
  color: #526581;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}
.research-metric > small.research-positive,
.research-metric > small.research-negative {
  font-size: 13px;
  font-weight: 650;
  line-height: 1.3;
}
.research-metric > small.research-positive {
  color: #087f6b;
}
.research-metric > small.research-negative {
  color: #c4273d;
}
.research-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 1px 4px;
}
.research-flow b {
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}
.research-positive {
  color: #087f6b;
}
.research-negative {
  color: #c4273d;
}
.research-grade {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  max-width: 100%;
  gap: 4px;
  min-height: 26px;
  padding: 3px 8px;
  border: 1px solid #c1ecdf;
  border-radius: 10px;
  background: #e7f6f1;
  color: #087f6b;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}
.research-grade--warning {
  border-color: #f4dfb5;
  background: #fff6e4;
  color: var(--ae-warning);
}
.research-timing-values {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: center;
  gap: 4px;
  width: 100%;
  min-height: 26px;
}
.research-timing-values > span {
  display: inline-flex;
  align-items: baseline;
  min-width: 0;
  gap: 4px;
  white-space: nowrap;
}
.research-timing-values small {
  color: #526581;
  font-size: 12px;
  font-weight: 500;
}
.research-timing-values b {
  color: #14213d;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.2px;
}
.research-card-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 44px;
}
.research-card-snapshot {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  color: #526581;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}
.research-card-snapshot > svg {
  flex-shrink: 0;
}
.research-card-detail {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  margin-right: -6px;
  padding: 0 6px;
  color: #0864ff;
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
}
.research-partial {
  flex-shrink: 0;
  max-width: 108px;
  padding: 4px 7px;
  border: 1px solid #d7e6f8;
  border-radius: 8px;
  background: #f5f8ff;
  color: #526581;
  font-size: 12px;
  line-height: 1.35;
}
.research-metric--wide {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.research-metric--wide > strong {
  font-size: 18px;
  letter-spacing: -0.3px;
}
@media (max-width: 374px) {
  .research-platform {
    padding-inline: 10px;
  }
  .research-platform__header {
    gap: 4px;
  }
  .research-account-name {
    font-size: 14px;
  }
  .research-score strong {
    font-size: 18px;
  }
  .research-metrics {
    gap: 5px;
    padding: 5px;
  }
  .research-metric--hero {
    padding: 8px 7px;
  }
  .research-metric--hero > strong {
    font-size: 24px;
    letter-spacing: -0.5px;
  }
  .research-metric--quiet {
    padding: 8px 7px;
  }
  .research-partial {
    max-width: 96px;
  }
}
</style>
