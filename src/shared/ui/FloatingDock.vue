<script setup lang="ts">
import { House, Database, Trophy, UserRound, ArrowUpToLine } from '@lucide/vue'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const scrolled = ref(false)
let main: HTMLElement | null = null
function updateScroll() {
  scrolled.value = (main?.scrollTop ?? 0) > 180
}
function activate(event: MouseEvent, to: string) {
  if (to === '/compare' && route.path === '/compare' && scrolled.value) {
    event.preventDefault()
    main?.scrollTo({
      top: 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }
}
onMounted(() => {
  main = document.getElementById('main-content')
  main?.addEventListener('scroll', updateScroll, { passive: true })
  updateScroll()
})
onUnmounted(() => main?.removeEventListener('scroll', updateScroll))
watch(
  () => route.path,
  () => {
    scrolled.value = false
  },
)
const items = [
  { to: '/', label: '首页', icon: House },
  { to: '/monitor', label: '监测', icon: Database },
  { to: '/ai', label: 'AI', icon: null },
  { to: '/compare', label: '赔率', icon: Trophy },
  { to: '/me', label: '我的', icon: UserRound },
]
</script>
<template>
  <nav class="ae-dock ae-glass" aria-label="主导航">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      @click="activate($event, item.to)"
      :aria-label="
        item.to === '/compare' && route.path === '/compare' && scrolled ? '回到顶部' : item.label
      "
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
        :is="
          item.to === '/compare' && route.path === '/compare' && scrolled
            ? ArrowUpToLine
            : item.icon
        "
        :size="24"
        :stroke-width="1.9"
        aria-hidden="true"
      /><span>{{
        item.to === '/compare' && route.path === '/compare' && scrolled ? '顶部' : item.label
      }}</span>
    </RouterLink>
  </nav>
</template>
