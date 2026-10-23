<script setup lang="ts">
import { Languages, Menu, Bell } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { dataMode } from '@/shared/api/config'
import AegisMark from '@/shared/ui/AegisMark.vue'
import FloatingDock from '@/shared/ui/FloatingDock.vue'
import { usePreferences } from '@/stores/preferences'

const preferences = usePreferences()
const route = useRoute()
</script>

<template>
  <div
    class="ae-app home-shell"
    :data-transparency="preferences.reducedTransparency ? 'reduced' : 'normal'"
  >
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="Aegis 首页">
        <span class="brand-mark"><AegisMark /></span>
        <span>Aegis</span>
      </RouterLink>
      <div class="home-header-actions">
        <RouterLink
          v-if="route.name === 'compare'"
          to="/compare?panel=reminders"
          aria-label="提醒中心"
          ><Bell :size="22"
        /></RouterLink>
        <span v-if="route.name === 'monitor'" class="monitor-mode-label">{{
          dataMode === 'demo' ? '演示数据' : '尚未接入'
        }}</span>
        <span v-else-if="route.name !== 'compare'"><Languages :size="15" /> 中文</span>
        <RouterLink v-if="route.name !== 'compare'" to="/me" aria-label="菜单"
          ><Menu :size="23"
        /></RouterLink>
      </div>
    </header>
    <main id="main-content" class="main-content">
      <RouterView v-slot="{ Component }"
        ><Transition name="page" mode="out-in"><component :is="Component" /></Transition
      ></RouterView>
    </main>
    <FloatingDock />
  </div>
</template>
