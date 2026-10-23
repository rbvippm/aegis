<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { monitorRows } from '@/mocks/fixtures'
import { duration } from '@/shared/lib/format'
withDefaults(defineProps<{ limit?: number }>(), { limit: 3 })
</script>
<template>
  <div class="monitor-list">
    <RouterLink
      v-for="row in monitorRows.slice(0, limit)"
      :key="row.id"
      :to="{ path: '/monitor', query: { platform: row.id } }"
      class="monitor-row"
    >
      <span class="merchant-avatar" :class="`merchant-${row.id.toLowerCase()}`">{{ row.id }}</span>
      <div class="merchant-title">
        <strong>{{ row.name }}</strong
        ><span class="ae-meta">TRC20 · USDT</span>
      </div>
      <span class="monitor-state" :class="{ 'text-warning': row.warning }"
        ><span class="status-dot" :class="{ 'status-dot--warning': row.warning }"></span
        >{{ row.state }}</span
      >
      <div class="timing">
        <span class="ae-meta">出金中位耗时</span><strong>{{ duration(row.seconds) }}</strong>
      </div>
      <ChevronRight :size="16" class="text-muted" />
    </RouterLink>
  </div>
</template>
