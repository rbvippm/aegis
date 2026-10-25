<script setup lang="ts">
import { Bell } from '@lucide/vue'
withDefaults(defineProps<{ unread?: boolean }>(), { unread: false })
</script>
<template>
  <RouterLink to="/me?section=messages" class="header-message-link" aria-label="消息中心"
    ><Bell :size="22" /><span
      v-if="unread"
      class="header-message-link__dot"
      aria-hidden="true"
    ></span
  ></RouterLink>
</template>
<style>
.header-message-link {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  color: #081b4d;
  border-radius: 50%;
  text-decoration: none;
}
.header-message-link__dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #0874ff;
}
</style>
