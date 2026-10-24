<script setup lang="ts">
import { ChevronLeft, ChevronRight, Crown, UsersRound, LockKeyhole, Activity } from '@lucide/vue'
import { dataMode } from '@/shared/api/config'
import type { ServiceKind } from './types'
defineProps<{
  kind: ServiceKind
  title: string
  subtitle: string
  action: string
  steps: string[]
}>()
defineEmits<{ request: [] }>()
</script>

<template>
  <div class="service-page" :class="`service-${kind}`">
    <div class="svc-subnav">
      <RouterLink custom to="/me" v-slot="{ href, navigate }"
        ><a :href="href" @click="navigate"><ChevronLeft :size="20" />返回我的</a></RouterLink
      >
      <span>{{ kind === 'vip' ? 'VIP 服务' : '代理比价' }}</span>
      <span class="svc-badge">{{ dataMode === 'demo' ? '演示数据' : '尚未接入' }}</span>
    </div>
    <section class="svc-hero">
      <div class="svc-hero-copy">
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
      <component
        :is="kind === 'vip' ? Crown : UsersRound"
        class="svc-hero-icon"
        :size="67"
        :stroke-width="1.4"
        aria-hidden="true"
      />
      <button class="svc-primary" :disabled="dataMode !== 'demo'" @click="$emit('request')">
        <span class="svc-star" aria-hidden="true">✦</span>{{ action }}<ChevronRight :size="19" />
      </button>
      <p class="svc-privacy">
        <LockKeyhole :size="12" />{{
          kind === 'vip' ? '身份隐藏 · 自主选择 · 无需承诺转移' : '保护团队身份 · 报价后自主选择'
        }}
      </p>
    </section>
    <ol class="svc-steps">
      <li v-for="(step, index) in steps" :key="step">
        <span>{{ String(index + 1).padStart(2, '0') }}</span
        ><strong>{{ step }}</strong
        ><small>{{
          (kind === 'vip'
            ? ['提交基本资料', '多平台提供方案', '对比后自主决定']
            : ['设定合作诉求', '确认结算与扣减', '多平台提供方案'])[index]
        }}</small
        ><ChevronRight v-if="index < 2" :size="14" aria-hidden="true" />
      </li>
    </ol>
    <slot />
    <div class="svc-support">
      <RouterLink to="/monitor"
        ><Activity :size="26" /><span
          ><strong>出金监测 <ChevronRight :size="13" /></strong
          ><small>平台出金数据与时效</small></span
        ></RouterLink
      >
      <RouterLink
        :to="{
          path: '/ai',
          query: {
            q:
              kind === 'vip'
                ? '比较 VIP 方案时，应该核对哪些条款？'
                : '比较代理佣金时，应该核对哪些扣费与结算条款？',
          },
        }"
        ><span class="svc-ai-star" aria-hidden="true">✦</span
        ><span
          ><strong>问 Aegis AI <ChevronRight :size="13" /></strong
          ><small>条款解读与数据洞察</small></span
        ></RouterLink
      >
    </div>
    <p class="svc-footnote">出金速度不代表平台安全评级。</p>
    <p class="svc-footnote">
      {{
        dataMode === 'demo'
          ? '虚构平台与报价，仅供演示；未接入真实 VIP / 代理服务。'
          : 'VIP / 代理服务尚未接入，暂不提供报价与需求提交。'
      }}
    </p>
  </div>
</template>
