<script setup lang="ts">
import GlassSelect from '@/shared/ui/GlassSelect.vue'
import { computed, reactive, ref, watch } from 'vue'
import { LockKeyhole } from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import { useServiceRequests } from './store'
import type { AnonymousRequest, ServiceKind } from './types'
const props = defineProps<{
  open: boolean
  kind: ServiceKind
  subscriptionLevel?: 'L1' | 'L2' | 'L3'
}>()
const emit = defineEmits<{ close: []; saved: [] }>()
const store = useServiceRequests()
const saved = ref(false)
const form = reactive<AnonymousRequest>({
  kind: props.kind,
  volume: '',
  tier: '',
  preference: '',
  note: '',
})
const vip = computed(() => props.kind === 'vip')
watch(
  () => props.open,
  (open) => {
    if (!open) return
    saved.value = false
    Object.assign(
      form,
      { kind: props.kind, volume: '', tier: '', preference: '', note: '' },
      store.requests[props.kind],
    )
    if (props.subscriptionLevel) form.subscriptionLevel = props.subscriptionLevel
  },
  { immediate: true },
)
function submit() {
  if (!form.volume || !form.tier || !form.preference) return
  if (store.save({ ...form })) {
    saved.value = true
    emit('saved')
  }
}
</script>

<template>
  <BottomDrawer
    :open="open"
    :title="vip ? '匿名 VIP 需求' : '匿名团队合作需求'"
    @close="emit('close')"
  >
    <div class="svc-panel">
      <template v-if="saved">
        <div class="svc-success" role="status">
          <LockKeyhole :size="30" />
          <h3>需求已保存</h3>
          <p>可在「我的需求」中查看和编辑。</p>
        </div>
        <button class="svc-primary" @click="emit('close')">查看我的需求</button>
      </template>
      <form v-else class="svc-form" @submit.prevent="submit">
        <p v-if="form.subscriptionLevel" class="svc-subscription-context">
          {{ form.subscriptionLevel }} 订阅方案咨询<span>VIP 转移 · 定制化报价</span>
        </p>
        <p class="svc-note">仅选择区间与偏好。请勿填写姓名、联系方式、账户、凭证或其他个人资料。</p>
        <label
          >{{ vip ? '近 30 日充值区间' : '团队月净收益规模'
          }}<GlassSelect v-model="form.volume" required>
            <option disabled value="">请选择区间</option>
            <option>1万 U 以下</option>
            <option>1–5万 U</option>
            <option>5–10万 U</option>
            <option>10–20万 U</option>
            <option>20万 U 以上</option>
          </GlassSelect></label
        >
        <label
          >{{ vip ? '当前 VIP 等级' : '团队规模'
          }}<GlassSelect v-model="form.tier" required>
            <option disabled value="">请选择</option>
            <template v-if="vip"
              ><option>尚无 VIP 等级</option>
              <option>VIP 1–3</option>
              <option>VIP 4–6</option>
              <option>VIP 7 及以上</option></template
            ><template v-else
              ><option>个人代理</option>
              <option>2–10 人</option>
              <option>11–50 人</option>
              <option>50 人以上</option></template
            >
          </GlassSelect></label
        >
        <label
          >{{ vip ? '最关注的待遇' : '优先合作条件'
          }}<GlassSelect v-model="form.preference" required>
            <option disabled value="">请选择</option>
            <template v-if="vip"
              ><option>VIP 等级匹配</option>
              <option>Lossback 负盈利返现</option>
              <option>专属日返水</option></template
            ><template v-else
              ><option>净收益分成透明</option>
              <option>日结 USDT</option>
              <option>周结 USDT</option>
              <option>不结转负盈利</option>
              <option>场馆费与扣量可核查</option></template
            >
          </GlassSelect></label
        >
        <label
          >补充诉求（选填）<textarea
            v-model="form.note"
            rows="3"
            maxlength="200"
            placeholder="例如：希望明确流水要求或扣费口径，请勿填写个人资料。"
          ></textarea
          ><small>{{ form.note.length }}/200</small></label
        >
        <p class="svc-note">
          <LockKeyhole :size="14" />正式服务将先私下核验资料，仅向平台展示脱敏需求。
        </p>
        <button class="svc-primary" type="submit">保存需求</button>
      </form>
    </div>
  </BottomDrawer>
</template>
