<script setup lang="ts">
import { useRoute } from 'vue-router'
import ProfileCenter from '@/features/profile/ProfileCenter.vue'
import VipService from '@/features/services/VipService.vue'
import AgentQuotes from '@/features/services/AgentQuotes.vue'
import '@/features/services/services.css'
const route = useRoute()
</script>

<template>
  <VipService v-if="route.query.section === 'vip'" />
  <AgentQuotes v-else-if="route.query.section === 'agents'" />
  <ProfileCenter v-else />
</template>
