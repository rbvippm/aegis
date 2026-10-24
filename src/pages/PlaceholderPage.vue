<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => {
  if (route.name === 'me' && route.query.section === 'vip') return 'VIP 服务'
  if (route.name === 'me' && route.query.section === 'agents') return '代理比价'
  return String(route.meta.title ?? '页面')
})
</script>

<template>
  <section class="page-placeholder" :key="route.fullPath">
    <h1>{{ title }}</h1>
    <RouterLink class="placeholder-back" to="/">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.page-placeholder {
  min-height: 55dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  text-align: center;
  padding: 40px 16px;
}
.placeholder-label {
  color: #6c83a4;
  font-size: 12px;
}
h1 {
  font-size: 26px;
  line-height: 1.4;
  font-weight: 700;
  color: #081b4d;
}
p {
  font-size: 14px;
  line-height: 1.6;
  color: #617897;
}
.placeholder-back {
  color: #0864ff;
  font-size: 14px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  margin-top: 6px;
}
</style>
