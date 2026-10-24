<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  Activity,
  Crown,
  UsersRound,
  ChevronRight,
  ArrowDown,
  MessageCircle,
  Trophy,
  ChevronDown,
} from '@lucide/vue'
import GlassSurface from '@/shared/ui/GlassSurface.vue'
import AiComposer from '@/shared/ui/AiComposer.vue'
import MonitorList from '@/features/monitoring/MonitorList.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import { dataMode } from '@/shared/api/config'
const router = useRouter()
const shortcuts = [
  { label: '出金监测', detail: '读懂资金动态', icon: Activity, to: '/monitor', color: 'blue' },
  {
    label: '赔率对比',
    detail: '同盘口透明比较',
    icon: Trophy,
    to: '/compare',
    color: 'violet',
  },
  {
    label: 'VIP 服务',
    detail: '匿名比较专属 VIP 待遇',
    icon: Crown,
    to: '/me?section=vip',
    color: 'gold',
  },
  {
    label: '代理比价',
    detail: '佣金政策透明对比',
    icon: UsersRound,
    to: '/me?section=agents',
    color: 'teal',
  },
]
function ask(text: string) {
  void router.push({ path: '/ai', query: { q: text } })
}
</script>
<template>
  <div class="reference-home">
    <section class="home-intro">
      <h1>看清平台，再做选择</h1>
      <p>链上数据 · 出金监测 · 透明对比</p>
    </section>
    <GlassSurface variant="glass" class="ai-hero">
      <div class="ai-card-heading">
        <span class="ai-orb-small" aria-hidden="true">✦<small>Aegis AI</small></span>
        <div>
          <h2>比赛怎么看？问问 AI</h2>
          <p>大模型 × 内部知识库</p>
        </div>
      </div>
      <AiComposer compact @submit="ask" />
      <button
        class="suggestion-link"
        aria-label="试着问：今晚海港队对山城队，你怎么看？"
        @click="ask('今晚海港队对山城队，你怎么看？')"
      >
        <MessageCircle :size="17" /><span>今晚海港队对山城队，你怎么看？</span
        ><ChevronRight :size="15" />
      </button>
    </GlassSurface>
    <div class="shortcut-grid">
      <RouterLink v-for="item in shortcuts" :key="item.label" :to="item.to" class="shortcut-card"
        ><span class="shortcut-icon" :class="`icon-${item.color}`"
          ><component :is="item.icon" :size="27" :stroke-width="2.1" /></span
        ><strong>{{ item.label }}</strong></RouterLink
      >
    </div>
    <div class="home-main">
      <GlassSurface class="overview-card"
        ><div class="section-heading">
          <h2>出金监测</h2>
          <span class="label-chip">演示数据</span>
        </div>
        <div v-if="dataMode === 'demo'" class="overview-body">
          <div>
            <RouterLink to="/monitor" class="chain-pill"
              ><span>◈</span> TRC20 <ChevronDown :size="14" /></RouterLink
            ><span class="metric-caption">出金中位耗时</span>
            <div class="metric-large">
              03<span>:</span>24 <span class="trend-chip"><ArrowDown :size="12" /> -18%</span>
            </div>
          </div>
          <div class="sparkline-wrap">
            <svg viewBox="0 0 220 80" class="sparkline" aria-label="演示耗时趋势图" role="img">
              <defs>
                <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#60a5fa" stop-opacity=".25" />
                  <stop offset="100%" stop-color="#60a5fa" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 60 20 48 40 55 60 28 80 39 100 31 120 44 140 20 160 30 180 15 200 23 220 8 V80 H0Z"
                fill="url(#spark-fill)"
              />
              <path
                d="m0 60 20-12 20 7 20-27 20 11 20-8 20 13 20-24 20 10 20-15 20 8 20-15"
                fill="none"
                stroke="#397cf4"
                stroke-width="2"
                stroke-linecap="round"
              /></svg
            ><span class="ae-meta">固定快照 10/22 19:32 · UTC+8</span>
          </div>
        </div>
        <StatePanel v-else title="监测数据尚未接入" description="配置监测接口后展示真实数据。" />
      </GlassSurface>
      <GlassSurface class="platform-card"
        ><div class="section-heading">
          <h2>平台观察</h2>
          <RouterLink to="/monitor" class="text-link"
            >全部平台 <ChevronRight :size="14"
          /></RouterLink>
        </div>
        <MonitorList v-if="dataMode === 'demo'" :limit="3" /><StatePanel
          v-else
          title="暂无平台数据"
      /></GlassSurface>
    </div>
    <p class="home-demo-note">演示数据 · 模型与内部知识库尚未接入</p>
  </div>
</template>
