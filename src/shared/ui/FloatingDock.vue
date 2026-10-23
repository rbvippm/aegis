<script setup lang="ts">
import { House, Database, ChartNoAxesColumn, UserRound } from '@lucide/vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const items = [
  { to: '/', label: '首页', icon: House },
  { to: '/monitor', label: '监测', icon: Database },
  { to: '/ai', label: 'AI', icon: null },
  { to: '/compare', label: '对比', icon: ChartNoAxesColumn },
  { to: '/me', label: '我的', icon: UserRound },
]
</script>
<template>
  <nav class="ae-dock ae-glass" aria-label="主导航">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      :class="{ 'ae-dock__ai': item.label === 'AI' }"
      :aria-current="route.path === item.to ? 'page' : undefined"
    >
      <svg v-if="item.label === 'AI'" class="dock-star" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M16 2c1.5 8.5 5.5 12.5 14 14-8.5 1.5-12.5 5.5-14 14C14.5 21.5 10.5 17.5 2 16 10.5 14.5 14.5 10.5 16 2Z"
          fill="currentColor"
        /></svg
      ><component
        v-else
        :is="item.icon"
        :size="24"
        :stroke-width="1.9"
        aria-hidden="true"
      /><span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
