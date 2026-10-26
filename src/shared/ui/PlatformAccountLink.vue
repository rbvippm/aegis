<script setup lang="ts">
import { computed } from 'vue'
import { Link2 } from '@lucide/vue'
import { openPlatformAccount } from '@/shared/lib/platform-account'
const props = defineProps<{ platform: string; name?: string; label?: boolean }>()
const platformLabel = computed(() => props.name || `平台 ${props.platform}`)
</script>

<template>
  <button
    type="button"
    class="platform-account-link"
    :aria-label="`${platformLabel}账户关联`"
    :title="`${platformLabel}账户关联`"
    aria-haspopup="dialog"
    @click.stop.prevent="openPlatformAccount(platform, platformLabel)"
    @keydown.stop
    @pointerdown.stop
  >
    <span v-if="label">{{ platformLabel }}</span>
    <Link2 :size="16" aria-hidden="true" />
  </button>
</template>

<style>
.platform-account-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 1 auto;
  max-width: 100%;
  min-width: 44px;
  width: auto;
  gap: 4px;
  font: inherit;
  white-space: nowrap;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: inherit;
  vertical-align: middle;
}
.platform-account-link > span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.platform-account-link > svg {
  color: var(--ae-highlight);
  flex-shrink: 0;
}
.platform-account-link:active {
  background: var(--ae-bg);
}
.platform-account-link:focus-visible {
  outline: 2px solid var(--ae-highlight);
  outline-offset: -2px;
}
</style>
