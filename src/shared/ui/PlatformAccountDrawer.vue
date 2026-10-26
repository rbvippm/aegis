<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  Link2,
  ShieldCheck,
  UserRound,
} from '@lucide/vue'
import BottomDrawer from './BottomDrawer.vue'
import { accountPlatform } from '@/shared/lib/platform-account'
const route = useRoute()
const step = ref(0)
const username = ref('')
const consent = ref(false)
const inputId = useId()
const stepHeading = ref<HTMLHeadingElement>()
const steps = ['选择账户', '账户标识', '授权确认']
const inviteCode = 'aegis1688'
const copied = ref(false)
let copyTimer = 0
const accountName = computed(() => username.value.trim())
const canContinue = computed(() => accountName.value.length > 0)
watch(accountPlatform, () => {
  step.value = 0
  username.value = ''
  consent.value = false
  copied.value = false
  window.clearTimeout(copyTimer)
})
onBeforeUnmount(() => window.clearTimeout(copyTimer))
async function copyInvite() {
  try {
    await navigator.clipboard.writeText(inviteCode)
  } catch {
    const field = document.createElement('textarea')
    field.value = inviteCode
    field.setAttribute('readonly', '')
    field.style.position = 'fixed'
    field.style.left = '-999px'
    document.body.append(field)
    field.select()
    document.execCommand('copy')
    field.remove()
  }
  copied.value = true
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}
watch(
  () => route.fullPath,
  () => {
    accountPlatform.value = null
  },
)
async function previous() {
  step.value = Math.max(0, step.value - 1)
  consent.value = false
  await nextTick()
  stepHeading.value?.focus({ preventScroll: true })
}
async function next() {
  if (step.value === 1 && !canContinue.value) return
  step.value = Math.min(2, step.value + 1)
  consent.value = false
  await nextTick()
  stepHeading.value?.focus({ preventScroll: true })
}
</script>

<template>
  <BottomDrawer
    class="account-association-drawer"
    :open="accountPlatform !== null"
    :title="`${accountPlatform?.name ?? '平台'} · 账户关联`"
    @close="accountPlatform = null"
  >
    <div class="account-association">
      <ol class="account-association__steps" aria-label="账户关联步骤">
        <li
          v-for="(label, i) in steps"
          :key="label"
          :aria-current="i === step ? 'step' : undefined"
          :class="{ complete: i < step }"
        >
          <span class="account-association__step-number"
            ><Check v-if="i < step" :size="14" aria-hidden="true" /><template v-else>{{
              i + 1
            }}</template></span
          >
          <span>{{ label }}</span>
        </li>
      </ol>

      <section v-if="step === 0" class="account-association__stage">
        <div class="account-association__lead">
          <span class="account-association__symbol"><Link2 :size="24" aria-hidden="true" /></span>
          <div>
            <h3 ref="stepHeading" tabindex="-1">关联已有账户</h3>
            <p>填写账户标识，核对信息后前往账户页面。</p>
          </div>
        </div>
        <div class="account-association__overview">
          <div>
            <UserRound :size="18" aria-hidden="true" /><span
              ><small>账户标识</small><strong>用户名 / UID</strong></span
            >
          </div>
          <div>
            <ShieldCheck :size="18" aria-hidden="true" /><span
              ><small>授权范围</small><strong>账户标识、关联状态</strong></span
            >
          </div>
        </div>
        <div class="account-association__invite">
          <span>邀请码</span>
          <button
            type="button"
            :aria-label="copied ? '已复制邀请码' : '复制邀请码'"
            @click="copyInvite"
          >
            <strong>{{ inviteCode }}</strong
            ><Check v-if="copied" :size="16" aria-hidden="true" /><Copy
              v-else
              :size="16"
              aria-hidden="true"
            />
          </button>
        </div>
        <div class="account-association__actions">
          <button type="button" class="account-association__primary" @click="next">
            我已有账户，继续关联<ArrowRight :size="17" aria-hidden="true" />
          </button>
          <a
            class="account-association__secondary"
            href="https://www.google.com"
            target="_blank"
            rel="noopener noreferrer"
            >去创建账户<ArrowUpRight :size="16" aria-hidden="true"
          /></a>
        </div>
      </section>

      <form v-else-if="step === 1" class="account-association__stage" @submit.prevent="next">
        <div class="account-association__lead">
          <span class="account-association__symbol"
            ><UserRound :size="24" aria-hidden="true"
          /></span>
          <div>
            <h3 ref="stepHeading" tabindex="-1">填写账户标识</h3>
            <p>使用平台个人资料页中的用户名或 UID。</p>
          </div>
        </div>
        <div class="account-association__field">
          <label :for="inputId">用户名 / UID</label>
          <input
            :id="inputId"
            v-model="username"
            type="text"
            maxlength="64"
            autocomplete="off"
            autocapitalize="off"
            :spellcheck="false"
            placeholder="请输入用户名或 UID"
            :aria-describedby="`${inputId}-hint`"
          />
          <p :id="`${inputId}-hint`" class="account-association__hint">
            请按原样填写，勿输入密码或验证码。
          </p>
        </div>
        <div class="account-association__actions">
          <button type="submit" class="account-association__primary" :disabled="!canContinue">
            下一步<ArrowRight :size="17" aria-hidden="true" />
          </button>
          <button type="button" class="account-association__back" @click="previous">
            <ArrowLeft :size="16" aria-hidden="true" />上一步
          </button>
        </div>
      </form>

      <section v-else class="account-association__stage">
        <h3 ref="stepHeading" tabindex="-1">确认关联信息</h3>
        <dl class="account-association__summary">
          <div>
            <dt>平台</dt>
            <dd>{{ accountPlatform?.name }}</dd>
          </div>
          <div>
            <dt>用户名 / UID</dt>
            <dd>{{ accountName }}</dd>
          </div>
          <div>
            <dt>授权范围</dt>
            <dd>账户标识、关联状态</dd>
          </div>
        </dl>
        <div class="account-association__privacy">
          <ShieldCheck :size="18" aria-hidden="true" />
          <p>请在账户页面核对授权范围。无需提供密码、验证码或 API 密钥。</p>
        </div>
        <label class="account-association__consent" :class="{ checked: consent }">
          <input v-model="consent" type="checkbox" />
          <span class="account-association__checkmark" aria-hidden="true"
            ><Check :size="14"
          /></span>
          <span>我已核对账户标识和授权范围</span>
        </label>
        <div class="account-association__actions">
          <a
            v-if="consent"
            class="account-association__primary"
            href="https://www.google.com"
            target="_blank"
            rel="noopener noreferrer"
            >前往账户授权<ArrowUpRight :size="17" aria-hidden="true"
          /></a>
          <button v-else type="button" class="account-association__primary" disabled>
            前往账户授权<ArrowUpRight :size="17" aria-hidden="true" />
          </button>
          <button type="button" class="account-association__back" @click="previous">
            <ArrowLeft :size="16" aria-hidden="true" />上一步
          </button>
        </div>
      </section>
      <p class="account-association__destination">
        <Globe :size="14" aria-hidden="true" />示例跳转 · www.google.com
      </p>
    </div>
  </BottomDrawer>
</template>

<style scoped>
.account-association-drawer :deep(.ae-drawer__body) {
  padding-bottom: calc(16px + env(safe-area-inset-bottom, 0px));
}
.account-association {
  display: grid;
  gap: 18px;
  padding: 16px 16px 0;
  color: var(--ae-text);
  font-size: 14px;
  line-height: 1.6;
}
.account-association__steps {
  display: flex;
  margin: 0;
  padding: 12px 4px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 16px;
  background: var(--ae-surface);
  box-shadow: inset 0 1px #fff;
  list-style: none;
}
.account-association__steps li {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--ae-muted);
  font-size: 12px;
  font-weight: 500;
}
.account-association__steps li:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 12px;
  left: calc(50% + 20px);
  width: calc(100% - 40px);
  height: 1px;
  background: var(--ae-line-strong);
}
.account-association__steps li.complete::after {
  background: var(--ae-highlight);
}
.account-association__step-number {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ae-bg);
  border: 1px solid var(--ae-line-strong);
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.account-association__steps li[aria-current='step'] {
  color: var(--ae-highlight);
  font-weight: 600;
}
.account-association__steps li[aria-current='step'] .account-association__step-number {
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  border-color: transparent;
  color: white;
}
.account-association__steps li.complete .account-association__step-number {
  color: var(--ae-highlight);
}
.account-association__stage {
  display: grid;
  gap: 16px;
  min-width: 0;
}
.account-association__lead {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 2px;
}
.account-association__lead > div {
  min-width: 0;
}
.account-association h3 {
  margin: 0;
  font-size: 17px;
  line-height: 1.45;
  font-weight: 650;
}
.account-association h3:focus {
  outline: none;
}
.account-association p {
  margin: 5px 0 0;
  color: var(--ae-muted);
}
.account-association__symbol {
  display: grid;
  place-items: center;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: var(--ae-highlight);
  background: linear-gradient(145deg, var(--ae-surface), var(--ae-bg));
  border: 1px solid var(--ae-line-strong);
  box-shadow:
    inset 0 1px #fff,
    0 3px 8px #4b93eb12;
}
.account-association__overview {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 16px;
  background: var(--ae-surface);
}
.account-association__overview > div {
  display: flex;
  align-items: center;
  gap: 10px;
}
.account-association__overview > div + div {
  padding-top: 12px;
  border-top: 1px solid var(--ae-line);
}
.account-association__overview svg {
  flex-shrink: 0;
  color: var(--ae-highlight);
}
.account-association__overview span {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px 12px;
}
.account-association__overview small {
  font-size: 12px;
  color: var(--ae-muted);
}
.account-association__overview strong {
  font-size: 14px;
  font-weight: 500;
}
.account-association__invite {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 6px 6px 6px 14px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 16px;
  background: #f7fbff;
}
.account-association__invite > span {
  font-size: 13px;
  font-weight: 500;
  color: var(--ae-muted);
}
.account-association__invite button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 12px;
  background: #fff;
  color: #14213d;
  cursor: pointer;
}
.account-association__invite strong {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.3px;
}
.account-association__invite svg {
  color: var(--ae-highlight);
}
.account-association__actions {
  display: grid;
  gap: 8px;
}
.account-association__primary,
.account-association__secondary,
.account-association__back {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
  min-height: 44px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 14px;
  font: inherit;
  font-weight: 600;
  line-height: 1.5;
  text-decoration: none;
  cursor: pointer;
  transition:
    transform 150ms ease,
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
}
.account-association__actions svg {
  flex-shrink: 0;
}
.account-association__primary {
  min-height: 48px;
  border: 1px solid transparent;
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  color: white;
}
.account-association__primary:disabled {
  background: #eaf1fa;
  color: var(--ae-muted);
  border-color: var(--ae-line-strong);
  box-shadow: none;
  cursor: default;
}
.account-association__secondary {
  border: 1px solid var(--ae-line-strong);
  background: var(--ae-surface);
  color: var(--ae-highlight);
  box-shadow: inset 0 1px #fff;
}
.account-association__back {
  border: 1px solid transparent;
  background: transparent;
  color: var(--ae-muted);
  font-weight: 500;
}
.account-association__field {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 16px;
  background: var(--ae-surface);
}
.account-association__field label {
  font-size: 13px;
  font-weight: 600;
}
.account-association__field input {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 48px;
  padding: 11px 12px;
  font: inherit;
  font-size: 16px;
  color: var(--ae-text);
  background: var(--ae-bg);
  border: 1px solid var(--ae-line-strong);
  border-radius: 12px;
  transition:
    border-color 150ms ease,
    box-shadow 150ms ease;
}
.account-association__field input::placeholder {
  color: var(--ae-muted);
}
.account-association__field input:focus {
  border-color: var(--ae-highlight);
  box-shadow: 0 0 0 3px #0864ff12;
}
.account-association .account-association__hint {
  margin: 0;
  font-size: 12px;
}
.account-association__summary {
  margin: 0;
  padding: 2px 14px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 16px;
  background: var(--ae-surface);
}
.account-association__summary > div {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 11px 0;
}
.account-association__summary > div + div {
  border-top: 1px solid var(--ae-line);
}
.account-association dt {
  flex-shrink: 0;
  color: var(--ae-muted);
  font-size: 13px;
}
.account-association dd {
  margin: 0;
  min-width: 0;
  text-align: right;
  overflow-wrap: anywhere;
  font-weight: 500;
}
.account-association__privacy {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 0 2px;
}
.account-association__privacy svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--ae-label);
}
.account-association__privacy p {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
}
.account-association__consent {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid var(--ae-line-strong);
  border-radius: 14px;
  background: var(--ae-surface);
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background-color 150ms ease;
}
.account-association__consent.checked {
  border-color: #abcfff;
  background: #edf5ff;
}
.account-association__consent input {
  position: absolute;
  left: 12px;
  width: 20px;
  height: 20px;
  margin: 0;
  opacity: 0;
}
.account-association__checkmark {
  display: grid;
  place-items: center;
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  border: 1px solid #a4bbd3;
  border-radius: 6px;
  background: var(--ae-surface);
}
.account-association__checkmark svg {
  opacity: 0;
}
.account-association__consent input:checked + .account-association__checkmark {
  background: var(--ae-pill);
  border-color: transparent;
  color: white;
  box-shadow: inset 0 1px #ffffffb3;
}
.account-association__consent input:checked + .account-association__checkmark svg {
  opacity: 1;
}
.account-association__consent:has(input:focus-visible) {
  outline: 2px solid var(--ae-highlight);
  outline-offset: 2px;
}
.account-association .account-association__destination {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin: -2px 0 0;
  padding-top: 12px;
  border-top: 1px solid var(--ae-line-strong);
  color: var(--ae-muted);
  font-size: 12px;
}
.account-association :is(button, a, input):focus-visible {
  outline: 2px solid var(--ae-highlight);
  outline-offset: 2px;
}
.account-association__field input:focus-visible {
  outline-offset: 0;
  outline-width: 1px;
}
.account-association :is(button:not(:disabled), a):active {
  transform: scale(0.98);
}
@media (hover: hover) {
  .account-association__secondary:hover,
  .account-association__back:hover {
    background: var(--ae-bg);
  }
  .account-association__consent:hover {
    border-color: #abcfff;
  }
}
@media (prefers-reduced-motion: reduce) {
  .account-association :is(button, a, input),
  .account-association__consent {
    transition: none;
  }
  .account-association :is(button, a):active {
    transform: none;
  }
}
</style>
