<script setup lang="ts">
import { computed } from 'vue'
import { Languages, Menu, Bell } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { dataMode } from '@/shared/api/config'
import AegisMark from '@/shared/ui/AegisMark.vue'
import FloatingDock from '@/shared/ui/FloatingDock.vue'
import { usePreferences } from '@/stores/preferences'

const preferences = usePreferences()
const route = useRoute()
const profilePage = computed(
  () => route.name === 'me' && !['vip', 'agents'].includes(String(route.query.section)),
)
const customHeader = computed(() => route.name === 'ai' || profilePage.value)
</script>

<template>
  <div
    class="ae-app home-shell"
    :class="{ 'ai-chat-shell': route.name === 'ai', 'profile-shell': profilePage }"
    :data-transparency="preferences.reducedTransparency ? 'reduced' : 'normal'"
  >
    <div class="ambient ambient-one" aria-hidden="true"></div>
    <div class="ambient ambient-two" aria-hidden="true"></div>
    <header v-if="!customHeader" class="site-header">
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
        <RouterLink v-if="route.name !== 'compare'" custom to="/me" v-slot="{ href, navigate }"
          ><a
            :href="href"
            aria-label="菜单"
            :aria-current="route.name === 'me' && !route.query.section ? 'page' : undefined"
            @click="navigate"
            ><Menu :size="23" /></a
        ></RouterLink>
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
