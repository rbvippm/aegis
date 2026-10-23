<script setup lang="ts">
import StatePanel from '@/shared/ui/StatePanel.vue'
</script>
<template>
  <StatePanel title="这个页面还没有被发现" description="你可以返回首页，开始新的探索。"
    ><RouterLink class="ae-button ae-button--primary ae-pill" to="/"
      >返回首页</RouterLink
    ></StatePanel
  >
</template>
