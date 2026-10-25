<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AegisMark from '@/shared/ui/AegisMark.vue'
import MessageCenterLink from '@/shared/ui/MessageCenterLink.vue'
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
        <LanguageMenu v-if="!['compare', 'monitor'].includes(String(route.name))" />
        <MessageCenterLink />
      </div>
    </header>
    <main id="main-content" class="main-content">
      <!-- Tab content and its header/layout must commit together. A leaving page
           would otherwise inherit the destination shell before it disappears. -->
      <RouterView />
    </main>
    <FloatingDock />
  </div>
</template>
