<script setup lang="ts">
import { computed, ref } from 'vue'
import { Coins, CircleAlert, Link2, Check, ShieldCheck } from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import { usePlatformFollows } from '@/features/monitoring/follows'
import { useProfile } from '@/features/profile/store'
import { formatCents } from '@/features/profile/logic'
import { openPlatformAccount } from '@/shared/lib/platform-account'
import { rebatePercent, rebateLabel } from './rebate'
const props = defineProps<{ platform: string; name?: string; binding?: boolean }>()
const infoOpen = ref(false)
const follows = usePlatformFollows()
const profile = useProfile()
const meta = computed(() => follows.catalog.find((p) => p.id === props.platform))
const rate = computed(() => rebatePercent(meta.value?.commission, meta.value?.playerShare))
const account = computed(() => profile.bindings.find((b) => b.id === props.platform))
const totals = computed(() => {
  const rows = profile.records.filter((r) => r.platform === props.platform)
  return {
    pending: rows.filter((r) => r.status === 'pending').reduce((sum, r) => sum + r.cents, 0),
    settled: rows.filter((r) => r.status === 'settled').reduce((sum, r) => sum + r.cents, 0),
    hasRecords: rows.length > 0,
  }
})
</script>
<template>
  <section
    class="rebate-benefit"
    :class="{ 'rebate-benefit--missing': rate === null }"
    :aria-label="`${name ?? meta?.name ?? '平台'}返水优势`"
  >
    <Coins v-if="rate !== null" :size="18" aria-hidden="true" /><CircleAlert
      v-else
      :size="18"
      aria-hidden="true"
    />
    <div class="rebate-benefit__value">
      <span>Aegis 返利优势</span><strong v-if="rate !== null">{{ rebateLabel(rate) }}</strong
      ><strong v-else class="rebate-benefit__missing">信息待补充</strong>
    </div>
    <button
      class="rebate-benefit__info"
      type="button"
      :aria-label="`${name ?? meta?.name ?? '平台'}返利说明`"
      aria-haspopup="dialog"
      @click.stop="infoOpen = true"
    >
      <CircleAlert :size="17" />
    </button>
    <button
      v-if="binding"
      class="rebate-benefit__bind"
      :class="{ 'rebate-benefit__bind--bound': !!account?.uid }"
      type="button"
      :aria-label="`绑定${name ?? meta?.name ?? '平台'}，了解返利`"
      @click.stop="openPlatformAccount(platform, name ?? meta?.name ?? '平台')"
    >
      <Check v-if="account?.uid" :size="14" /><Link2 v-else :size="14" />{{
        account?.uid ? '已绑定' : '绑定平台'
      }}
    </button>
  </section>
  <BottomDrawer
    :open="infoOpen"
    :title="`${name ?? meta?.name ?? '平台'} · 返利说明`"
    @close="infoOpen = false"
  >
    <div class="rebate-info">
      <section v-if="rate !== null" class="rebate-info__hero" aria-label="返利优势">
        <span class="rebate-info__eyebrow"><Coins :size="17" />Aegis 返利</span>
        <strong>{{ rebateLabel(rate) }}</strong>
        <span class="rebate-info__status"
          ><Check v-if="account?.uid" :size="13" />{{
            account?.uid ? 'UID 已绑定' : '绑定平台后核验资格'
          }}</span
        >
      </section>
      <section v-else class="rebate-info__empty">
        <CircleAlert :size="24" /><strong>返水信息待补充</strong>
        <p>暂未取得完整返水比例与分成条款，确认后展示。</p>
      </section>
      <section v-if="totals.hasRecords" class="rebate-info__totals" aria-label="平台返利结算">
        <div class="rebate-info__pending">
          <span>待结算</span><strong>{{ formatCents(totals.pending) }}</strong
          ><small>USDT</small>
        </div>
        <div>
          <span>累计已结算</span><strong>{{ formatCents(totals.settled) }}</strong
          ><small>USDT</small>
        </div>
        <p>与个人中心的该平台结算记录一致。</p>
      </section>
      <section v-if="rate !== null" class="rebate-info__formula" aria-label="返利计算口径">
        <h3>返利怎么算</h3>
        <div>
          <span
            >渠道佣金<strong>{{ meta?.commission }}%</strong></span
          ><b aria-hidden="true">×</b
          ><span
            >用户分成<strong>{{ meta?.playerShare }}%</strong></span
          >
        </div>
      </section>
      <div class="rebate-info__note">
        <ShieldCheck :size="16" />
        <p>返利来自渠道佣金中的用户分成，并非投注额返还比例；奖励资格与实际结算以核验结果为准。</p>
      </div>
      <p v-if="!totals.hasRecords" class="rebate-info__account-state">
        {{
          account?.uid
            ? account.eligibility === 'verified'
              ? '奖励资格已验证 · 暂无结算记录'
              : 'UID 已绑定 · 奖励资格待核验'
            : '绑定并核验奖励资格后，返利计入个人中心结算记录。'
        }}
      </p>
    </div>
  </BottomDrawer>
</template>
<style scoped>
.rebate-benefit {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0;
  padding: 8px 10px;
  border: 1px solid #d7e8fd;
  border-radius: 14px;
  background: linear-gradient(115deg, #eff7ff, #e7f2ff);
  color: var(--ae-text);
}
.rebate-benefit > svg {
  color: var(--ae-highlight);
  flex-shrink: 0;
}
.rebate-benefit__value {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 8px;
  flex: 1;
  min-width: 0;
}
.rebate-benefit__value > span {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.rebate-benefit__value > strong {
  color: var(--ae-highlight);
  font-size: 20px;
  line-height: 1.3;
  white-space: nowrap;
}
.rebate-benefit button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-shrink: 0;
  min-height: 44px;
  border: 0;
  font: inherit;
  color: var(--ae-highlight);
}
.rebate-benefit .rebate-benefit__info {
  width: 44px;
  padding: 0;
  background: transparent;
  border-radius: 10px;
}
.rebate-benefit .rebate-benefit__bind {
  padding: 0 9px;
  border: 1px solid #bdd9ff;
  border-radius: 11px;
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  color: white;
  font-size: 12px;
  font-weight: 600;
}
.rebate-benefit--missing {
  background: #f5f8fc;
  border-color: #dfe7f0;
}
.rebate-benefit--missing > svg,
.rebate-benefit__value > .rebate-benefit__missing {
  color: var(--ae-muted);
}
.rebate-benefit__value > .rebate-benefit__missing {
  font-size: 12px;
}
.rebate-benefit button:focus-visible {
  outline: 2px solid var(--ae-highlight);
  outline-offset: 2px;
}
.rebate-benefit__info:active {
  background: #e0edff;
}
.rebate-benefit .rebate-benefit__bind--bound {
  background: #e9f7f2;
  border-color: #c2e8da;
  color: #087f6b;
  box-shadow: none;
}
.rebate-info {
  display: grid;
  gap: 12px;
  padding: 12px 16px 16px;
  color: var(--ae-text);
  font-variant-numeric: tabular-nums;
}
.rebate-info__hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px 12px;
  padding: 12px 14px;
  border: 1px solid #d2e5fc;
  border-radius: 15px;
  background: linear-gradient(145deg, #f7fbff, #e5f1ff);
  box-shadow: inset 0 1px #fff;
}
.rebate-info__eyebrow {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ae-muted);
}
.rebate-info__eyebrow svg {
  color: var(--ae-highlight);
}
.rebate-info__hero > strong {
  color: var(--ae-highlight);
  grid-column: 2;
  grid-row: 1 / 3;
  font-size: 28px;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.6px;
}
.rebate-info__status {
  display: flex;
  align-items: center;
  gap: 4px;
  grid-column: 1;
  min-height: 20px;
  font-size: 12px;
  color: var(--ae-muted);
}
.rebate-info__totals {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 0;
  padding: 16px 12px 12px;
  border: 1px solid var(--ae-border);
  border-radius: 16px;
  background: #fff;
}
.rebate-info__totals > div {
  display: grid;
  gap: 6px;
  min-width: 0;
  padding: 0 10px;
}
.rebate-info__totals > div + div {
  border-left: 1px solid var(--ae-border);
}
.rebate-info__totals span {
  color: var(--ae-muted);
  font-size: 12px;
}
.rebate-info__totals strong {
  font-size: 22px;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.6px;
}
.rebate-info__pending strong {
  color: var(--ae-highlight);
}
.rebate-info__totals small {
  color: var(--ae-muted);
  font-size: 11px;
}
.rebate-info__totals > p {
  grid-column: 1/-1;
  text-align: center;
  padding-top: 10px;
  border-top: 1px solid #edf2f9;
  font-size: 11px;
  color: var(--ae-muted);
  margin: 0;
  line-height: 1.6;
}
.rebate-info__formula h3 {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
}
.rebate-info__formula > div {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f4f8fe;
  border-radius: 14px;
}
.rebate-info__formula span {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  color: var(--ae-muted);
}
.rebate-info__formula strong {
  color: var(--ae-text);
  font-size: 16px;
}
.rebate-info__formula b {
  color: #829bb9;
  font-weight: 400;
  font-size: 16px;
}
.rebate-info__note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  color: var(--ae-muted);
}
.rebate-info__note > svg {
  flex-shrink: 0;
  margin-top: 2px;
}
.rebate-info__note p,
.rebate-info__account-state {
  font-size: 12px;
  line-height: 1.8;
  margin: 0;
  color: var(--ae-muted);
}
.rebate-info__empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 22px 16px;
  border: 1px solid var(--ae-border);
  border-radius: 18px;
  background: #f5f8fc;
  text-align: center;
  color: var(--ae-muted);
}
.rebate-info__empty strong {
  font-size: 16px;
  color: var(--ae-text);
}
.rebate-info__empty p {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
}
@media (max-width: 374px) {
  .rebate-info {
    padding-inline: 12px;
  }
  .rebate-info__totals strong {
    font-size: 22px;
  }
  .rebate-info__totals > div {
    padding-inline: 7px;
  }
}
</style>
