<script setup lang="ts">
import { useServiceRequests } from './store'
import type { ServiceKind } from './types'
defineProps<{ kind: ServiceKind }>()
defineEmits<{ create: [] }>()
const store = useServiceRequests()
</script>
<template>
  <section class="svc-card svc-request-summary">
    <div class="svc-heading">
      <h2>{{ kind === 'vip' ? '我的 VIP 需求' : '我的团队需求' }}</h2>
    </div>
    <template v-if="store.requests[kind]">
      <p class="svc-note">待处理</p>
      <dl class="svc-detail-list">
        <div v-if="store.requests[kind]?.subscriptionLevel">
          <dt>咨询的订阅方案</dt>
          <dd>{{ store.requests[kind]?.subscriptionLevel }}</dd>
        </div>
        <div>
          <dt>{{ kind === 'vip' ? '充值区间' : '月净收益区间' }}</dt>
          <dd>{{ store.requests[kind]?.volume }}</dd>
        </div>
        <div>
          <dt>{{ kind === 'vip' ? '当前等级' : '团队规模' }}</dt>
          <dd>{{ store.requests[kind]?.tier }}</dd>
        </div>
        <div>
          <dt>优先诉求</dt>
          <dd>{{ store.requests[kind]?.preference }}</dd>
        </div>
        <div v-if="store.requests[kind]?.note">
          <dt>补充诉求</dt>
          <dd>{{ store.requests[kind]?.note }}</dd>
        </div>
      </dl>
      <div class="svc-actions">
        <button class="svc-outline" @click="$emit('create')">编辑需求</button
        ><button class="svc-text" @click="store.remove(kind)">清除需求</button>
      </div>
    </template>
    <template v-else
      ><p class="svc-note">暂无需求。创建匿名需求后，可在这里查看与编辑。</p>
      <button class="svc-outline" @click="$emit('create')">创建匿名需求</button></template
    >
  </section>
</template>
