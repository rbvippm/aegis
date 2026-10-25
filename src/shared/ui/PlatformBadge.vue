<script setup lang="ts">
import { getSportsPlatform, platformName } from '@/features/sports/platforms'
defineProps<{ platform: string }>()
</script>
<template>
  <span class="platform-badge"
    ><i :class="`platform-badge__mark--${platform}`" aria-hidden="true">{{
      getSportsPlatform(platform)?.mark ?? platform
    }}</i
    ><span>{{ platformName(platform) }}</span></span
  >
</template>
<style>
.platform-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
  color: #526581;
}
.platform-badge i {
  display: grid;
  place-items: center;
  width: 19px;
  height: 20px;
  border-radius: 6px;
  background: linear-gradient(145deg, #76c6ff, #0867ed);
  box-shadow: inset 0 1px 1px #ffffff8f;
  color: white;
  font-size: 13px;
  font-style: normal;
  font-weight: 700;
}
.platform-badge .platform-badge__mark--B {
  background: linear-gradient(145deg, #80deed, #08a4b7);
}
.platform-badge .platform-badge__mark--C {
  background: linear-gradient(145deg, #b6b4ff, #6b52e6);
}
.platform-badge .platform-badge__mark--D {
  background: linear-gradient(145deg, #ffce8e, #dc9533);
}
.platform-badge .platform-badge__mark--E {
  background: linear-gradient(145deg, #9cb6d3, #657e9f);
}
</style>
