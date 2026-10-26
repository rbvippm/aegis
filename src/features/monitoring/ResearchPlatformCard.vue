<script setup lang="ts">
import PlatformAccountLink from '@/shared/ui/PlatformAccountLink.vue'
import { ChevronRight, ShieldCheck, TriangleAlert, Coins } from '@lucide/vue'
import { computed } from 'vue'
import { researchRegionLabel, type ResearchPlatform, type ResearchWindow } from './research'
import { researchSnapshot } from '@/mocks/monitoring-research'
const props = defineProps<{
  platform: ResearchPlatform
  window: ResearchWindow
  rank?: number
  periodLabel?: string
  snapshot?: string
  growth?: number | null
}>()
const emit = defineEmits<{ open: [kind: string, platform: ResearchPlatform] }>()
const flowLabel = computed(() => props.periodLabel ?? '24h')
const deposit = computed(() => props.platform.windows[props.window])
const warning = computed(
  () => props.platform.flowPercent !== null && props.platform.flowPercent < -25,
)
const rebate = computed(
  () => ((props.platform.commission ?? 0) * (props.platform.playerShare ?? 0)) / 100,
)
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
      ><span class="research-avatar" :class="`research-avatar--${platform.id}`">{{
        platform.id
      }}</span>
      <span class="research-platform__identity"
        ><h3 class="research-account-name">
          <button type="button" :aria-label="`${platform.name}详情`">{{ platform.name }}</button
          ><PlatformAccountLink :platform="platform.id" :name="platform.name" />
        </h3>
        <small class="research-region-badge">{{
          researchRegionLabel(platform.region)
        }}</small></span
      >
      <span v-if="platform.score !== null" class="research-score"
        ><ShieldCheck :size="19" fill="#0874ff" color="white" /><strong>{{ platform.score }}</strong
        ><small>/10</small></span
      >
      <span v-else class="research-partial">样本不足 · 暂不评分</span><ChevronRight :size="16" />
    </div>
    <template v-if="platform.score !== null">
      <button v-if="warning" class="research-warning" @click="emit('open', '异动详情', platform)">
        <TriangleAlert :size="18" /><span
          >{{ flowLabel }} 净流出 {{ Math.abs(platform.flowPercent!) }}% · 钱包异动</span
        ><ChevronRight :size="14" />
      </button>
      <div class="research-metrics">
        <div class="research-metric">
          <span>{{ periodLabel ?? window }} 真实存款</span>
          <div class="research-value">
            <strong>{{ deposit.deposit }}</strong
            ><span :class="deposit.change >= 0 ? 'research-positive' : 'research-negative'"
              >{{ growth === null ? '无可比基期' : deposit.change >= 0 ? '↑' : '↓' }}
              <template v-if="growth !== null">{{ Math.abs(deposit.change) }}%</template></span
            >
          </div>
          <small>较前一个等长窗口</small>
        </div>
        <div class="research-metric">
          <span>热钱包余额</span><strong>{{ platform.wallet }}</strong>
          <small
            >{{ flowLabel }} {{ platform.flowPercent! >= 0 ? '净流入' : '净流出' }}
            <b :class="platform.flowPercent! >= 0 ? 'research-positive' : 'research-negative'">{{
              platform.flow
            }}</b></small
          >
        </div>
        <div class="research-metric">
          <span>出金纯净度</span
          ><button
            class="research-grade"
            :class="{ 'research-grade--warning': platform.grade === 'B' }"
            :aria-label="`${platform.name}出金安全体检卡`"
            @click="emit('open', '出金安全体检卡', platform)"
          >
            <ShieldCheck :size="16" />{{ platform.grade }}级 · {{ platform.taint }}%<ChevronRight
              :size="14"
            />
          </button>
          <small>近7天 · ≤3跳关联</small>
        </div>
        <div class="research-metric research-time">
          <span>实测出款耗时</span
          ><strong>小额 {{ platform.smallMinutes }}m / 大额 {{ platform.largeMinutes }}m</strong>
          <button class="research-inline" @click="emit('open', '上报异常', platform)">
            样本 {{ platform.samples }} 笔 · 上报异常 <ChevronRight :size="12" />
          </button>
        </div>
      </div>
      <div class="research-rebate">
        <Coins :size="23" />
        <div>
          <strong
            >额外返水 <b>{{ rebate }}%</b></strong
          >
          <p>渠道佣金 {{ platform.commission }}% × 分成 {{ platform.playerShare }}%</p>
        </div>
        <button
          class="research-bind"
          :aria-label="`绑定${platform.name} UID`"
          @click="emit('open', '绑定 UID', platform)"
        >
          绑定 UID
        </button>
      </div>
      <div v-if="!warning" class="research-card-links">
        <button @click="emit('open', '地址清单', platform)">地址清单</button><span>·</span
        ><button @click="emit('open', '历史评测', platform)">历史评测</button><span>·</span
        ><button @click="emit('open', '评分依据', platform)">
          评分依据 <ChevronRight :size="12" />
        </button>
      </div>
      <button class="research-source" @click="emit('open', '数据来源', platform)">
        <span>{{ snapshot ?? researchSnapshot }}</span
        ><span>数据来源 <ChevronRight :size="12" /></span>
      </button>
    </template>
  </article>
</template>

<style scoped>
.research-platform {
  padding: 0 10px 5px;
  border: 1px solid #fff;
  border-radius: 18px;
  background: #ffffffea;
  box-shadow: 0 5px 16px #639cd615;
  scroll-margin-top: 12px;
}
button {
  border: 0;
  background: none;
}
.research-platform__header {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 48px;
  gap: 9px;
  padding: 5px 1px;
  text-align: left;
}
.research-account-name {
  display: flex;
  align-items: center;
}
.research-account-name > button:first-child {
  font: inherit;
  color: inherit;
  padding: 0;
  min-height: 44px;
}
.research-rank {
  color: #526d97;
  font-size: 14px;
  width: 12px;
}
.research-avatar {
  display: grid;
  place-items: center;
  height: 32px;
  width: 32px;
  flex-shrink: 0;
  border-radius: 10px;
  color: white;
  font-size: 23px;
  font-weight: 600;
  background: linear-gradient(145deg, #9dd9ff, #0878ff 65%, #5abaff);
  border: 1px solid #d9eeff;
  box-shadow:
    inset 0 1px 3px #fff,
    0 2px 5px #82b7ed40;
}
.research-avatar--B {
  background: linear-gradient(140deg, #7ce5e7, #02a8bd 65%, #52dddc);
}
.research-avatar--C {
  background: linear-gradient(140deg, #ccd7e4, #7c8da4);
}
h3 {
  font-size: 16px;
  font-weight: 650;
}
.research-score {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
}
.research-score small {
  font-size: 12px;
  color: #6c88ae;
}
.research-platform__header > svg {
  color: #5c77a2;
  margin-left: auto;
}
.research-score + svg {
  margin-left: 1px;
}
.research-warning {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 5px 8px;
  background: linear-gradient(100deg, #fff1cd, #fff7e8);
  border-radius: 10px;
  color: #9a5a00;
  font-size: 12px;
  font-weight: 600;
  gap: 6px;
  text-align: left;
}
.research-warning > svg:last-child {
  margin-left: auto;
}
.research-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #e9f1fa;
}
.research-warning + .research-metrics {
  border-top: 0;
  margin-top: 3px;
}
.research-metric {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  padding: 5px 9px;
}
.research-metric:nth-child(odd) {
  padding-left: 9px;
  border-right: 1px solid #e9f1fa;
}
.research-metric:nth-child(n + 3) {
  border-top: 1px solid #e9f1fa;
}
.research-metric > span {
  font-size: 12px;
  line-height: 1.3;
}
.research-metric strong {
  font-size: 23px;
  line-height: 1.15;
  letter-spacing: -0.5px;
  font-weight: 700;
}
.research-metric small {
  font-size: 12px;
  color: #526581;
  line-height: 1.5;
}
.research-metric small b {
  font-weight: 600;
}
.research-value {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}
.research-value > span {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.research-positive {
  color: #087f6b;
}
.research-negative {
  color: #b42318;
}
.research-grade {
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  padding: 4px 7px;
  min-height: 44px;
  border: 1px solid #c1ecdf;
  border-radius: 14px;
  color: #087f6b;
  background: linear-gradient(100deg, #d3f4e9, #edfff7);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.research-grade--warning {
  background: #fff3db;
  border-color: #f4dfb5;
  color: #9a5a00;
}
.research-time > strong {
  font-size: 12px;
  line-height: 28px;
  letter-spacing: -0.3px;
  font-weight: 600;
  white-space: nowrap;
}
.research-inline {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  min-height: 44px;
  margin-top: 0;
  padding: 0;
  font-size: 12px;
  color: #526581;
  gap: 2px;
}
.research-rebate {
  display: flex;
  align-items: center;
  gap: 9px;
  background: linear-gradient(110deg, #e4f2ff, #f0f8ff);
  padding: 7px 9px;
  border-radius: 11px;
}
.research-rebate > svg {
  color: #0874ff;
  filter: drop-shadow(0 2px 2px #7abbff50);
}
.research-rebate strong {
  font-size: 12px;
  font-weight: 600;
}
.research-rebate b {
  color: #0865ef;
  font-size: 16px;
}
.research-rebate p {
  font-size: 12px;
  color: #547299;
  margin-top: 3px;
}
.research-bind {
  min-height: 44px;
  padding: 0 13px;
  margin-left: auto;
  flex-shrink: 0;
  border-radius: 22px;
  border: 1px solid #c9e6ff;
  color: white;
  font-size: 12px;
  background: linear-gradient(#92ceff, #1483ff 45%, #0769f5 70%, #67bdff);
  box-shadow:
    inset 0 1px 2px white,
    0 2px 4px #87baf960;
}
.research-card-links {
  display: flex;
  align-items: center;
  gap: 5px;
  border-bottom: 1px solid #edf3fb;
  color: #6a86ab;
}
.research-card-links button {
  display: flex;
  align-items: center;
  padding: 0;
  min-height: 44px;
  font-size: 12px;
  color: #57769f;
}
.research-source {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  align-items: center;
  width: 100%;
  min-height: 44px;
  padding: 0 1px;
  color: #526581;
  font-size: 12px;
}
.research-source > span:last-child {
  display: flex;
  align-items: center;
}
.research-partial {
  margin-left: auto;
  border-radius: 12px;
  padding: 4px 8px;
  font-size: 12px;
  color: #57769f;
  background: #edf4fb;
}
.research-platform--partial {
  padding-bottom: 0;
}
.research-platform--partial .research-platform__header {
  min-height: 44px;
  gap: 7px;
}
.research-platform--partial .research-avatar {
  width: 25px;
  height: 28px;
  font-size: 18px;
  border-radius: 7px;
}
.research-platform--partial h3 {
  font-size: 13px;
}
@media (max-width: 374px) {
  .research-metric {
    padding-inline: 6px;
  }
  .research-metric strong {
    font-size: 21px;
  }
  .research-value {
    gap: 3px;
  }
  .research-time > strong {
    font-size: 12px;
  }
  .research-rebate {
    gap: 5px;
    padding-inline: 6px;
  }
  .research-bind {
    padding-inline: 10px;
  }
}
</style>
