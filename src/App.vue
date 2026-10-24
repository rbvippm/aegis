<script setup lang="ts">
import { computed } from 'vue'
import { Menu, Bell } from '@lucide/vue'
import { useRoute } from 'vue-router'
import AegisMark from '@/shared/ui/AegisMark.vue'
import LanguageMenu from '@/shared/ui/LanguageMenu.vue'
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
        <LanguageMenu v-if="!['compare', 'monitor'].includes(String(route.name))" />
        <RouterLink
          v-if="['home', 'monitor'].includes(String(route.name))"
          to="/me?section=messages"
          aria-label="消息中心"
          ><Bell :size="22"
        /></RouterLink>

        <RouterLink
          v-if="!['compare', 'home', 'monitor'].includes(String(route.name))"
          custom
          to="/me"
          v-slot="{ href, navigate }"
          ><a
            :href="href"
            aria-label="菜单"
            :aria-current="route.name === 'me' && !route.query.section ? 'page' : undefined"
            @click="navigate"
            ><Menu :size="21" :stroke-width="1.8" /></a
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
