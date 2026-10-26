<script setup lang="ts">
import { Bell, BellRing } from '@lucide/vue'
import { usePlatformFollows } from './follows'
defineProps<{ id: string; name: string; compact?: boolean }>()
const follows = usePlatformFollows()
</script>
<template>
  <button
    type="button"
    class="platform-follow"
    :class="{ active: follows.ids.includes(id), 'platform-follow--compact': compact }"
    :aria-label="`${follows.ids.includes(id) ? '取消关注' : '关注'}${name}`"
    :title="`${follows.ids.includes(id) ? '取消关注' : '关注'}${name}`"
    :aria-pressed="follows.ids.includes(id)"
    @click.stop="follows.toggle(id)"
  >
    <component :is="follows.ids.includes(id) ? BellRing : Bell" :size="compact ? 18 : 15" /><span>{{
      follows.ids.includes(id) ? '已关注' : '关注'
    }}</span>
  </button>
</template>
<style scoped>
.platform-follow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 44px;
  flex-shrink: 0;
  padding: 0 12px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 14px;
  background: var(--ae-surface, #fff);
  color: var(--ae-highlight);
  font-size: 13px;
  font-weight: 600;
}
.platform-follow.active {
  background: #e7f2ff;
  border-color: #bad8ff;
}
.platform-follow.platform-follow--compact {
  width: 44px;
  min-height: 44px;
  flex-direction: column;
  gap: 1px;
  padding: 3px 2px;
  border: 1px solid #c4dcff;
  border-radius: 12px;
  background: #f3f8ff;
  box-shadow: inset 0 1px 0 #fff;
  color: var(--ae-highlight);
}
.platform-follow--compact > span {
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  white-space: nowrap;
}
.platform-follow--compact > svg {
  width: 16px;
  height: 16px;
}
.platform-follow.platform-follow--compact.active {
  border-color: #9dc5ff;
  background: #e2efff;
  box-shadow: inset 0 1px 0 #ffffffb3;
}
.platform-follow:focus-visible {
  outline: 2px solid var(--ae-highlight);
  outline-offset: 2px;
}
</style>
