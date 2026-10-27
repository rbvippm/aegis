<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Activity, Crown, UsersRound, Trophy } from '@lucide/vue'
import InstallAppEntry from '@/features/install/InstallAppEntry.vue'
import HomeBanner from '@/features/home/HomeBanner.vue'
import HomeOverview from '@/features/home/HomeOverview.vue'
import GlassSurface from '@/shared/ui/GlassSurface.vue'
import AiComposer from '@/shared/ui/AiComposer.vue'
import AiOrb from '@/shared/ui/AiOrb.vue'
import '@/features/home/home.css'
const router = useRouter()
const shortcuts = [
  { label: '出金监测', icon: Activity, to: '/monitor', color: 'blue' },
  { label: '赔率对比', icon: Trophy, to: '/compare', color: 'violet' },
  { label: 'VIP 服务', icon: Crown, to: '/me?section=vip', color: 'gold' },
  { label: '代理比价', icon: UsersRound, to: '/me?section=agents', color: 'teal' },
]
function ask(text: string) {
  void router.push({ path: '/ai', query: { q: text, submit: '1' } })
}
</script>
<template>
  <div class="reference-home home-rich">
    <HomeBanner />
    <GlassSurface variant="glass" class="ai-hero">
      <div class="ai-card-heading">
        <span class="ai-card-brand" aria-hidden="true"><AiOrb /></span>
        <div>
          <h2>想了解什么？问问 AI</h2>
          <p>赛事分析、平台研究，一问看懂</p>
        </div>
      </div>
      <AiComposer compact @submit="ask" />
      <div class="hr-prompts">
        <button
          aria-label="试着问：今晚维拉 vs 曼城，怎么看？"
          @click="ask('今晚维拉 vs 曼城，怎么看？')"
        >
          今晚维拉 vs 曼城，怎么看？
        </button>
        <button @click="ask('哪家平台出金更稳定？请结合链、金额范围和样本分析。')">
          哪家出金更稳定？
        </button>
      </div>
    </GlassSurface>
    <div class="shortcut-grid">
      <RouterLink v-for="item in shortcuts" :key="item.label" :to="item.to" class="shortcut-card">
        <span class="shortcut-icon" :class="`icon-${item.color}`"
          ><component :is="item.icon" :size="27" :stroke-width="2.1" /></span
        ><strong>{{ item.label }}</strong>
      </RouterLink>
    </div>
    <HomeOverview />
    <InstallAppEntry />
  </div>
</template>
