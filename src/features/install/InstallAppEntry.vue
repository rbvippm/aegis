<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Download,
  X,
  Compass,
  Ellipsis,
  Share,
  SquarePlus,
  Check,
  Copy,
  Monitor,
  Smartphone,
  Info,
} from '@lucide/vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import InstallStepVisual from './InstallStepVisual.vue'
import AegisMark from '@/shared/ui/AegisMark.vue'
import { platformState } from '@/platform'
import { suggestedInstallGuide, isStandaloneWindow, type InstallGuide } from '@/platform/install'
import { appInfo } from '@/shared/app-info'
import { installDismissKey, readInstallDismissal, dismissInstallEntry } from './dismissal'
const open = ref(false)
const standalone = ref(false)
const dismissedUntil = ref(readInstallDismissal())
const clockNow = ref(Date.now())
let dismissalTimer = 0
function scheduleDismissal() {
  window.clearTimeout(dismissalTimer)
  const delay = dismissedUntil.value - clockNow.value
  if (delay > 0) dismissalTimer = window.setTimeout(refreshDismissal, delay)
}
function refreshDismissal() {
  clockNow.value = Date.now()
  dismissedUntil.value = readInstallDismissal(clockNow.value)
  scheduleDismissal()
}
function dismissEntry() {
  open.value = false
  clockNow.value = Date.now()
  dismissedUntil.value = dismissInstallEntry(clockNow.value)
  scheduleDismissal()
}
function dismissalStorageChanged(event: StorageEvent) {
  if (event.key === installDismissKey || event.key === null) refreshDismissal()
}
function visibilityChanged() {
  if (document.visibilityState === 'visible') refreshDismissal()
}
const guide = ref<InstallGuide>(
  suggestedInstallGuide(navigator.userAgent, navigator.maxTouchPoints, window.innerWidth),
)
const detectedGuide = ref(guide.value)
function updateDevice() {
  const next = suggestedInstallGuide(
    navigator.userAgent,
    navigator.maxTouchPoints,
    window.innerWidth,
  )
  if (next !== detectedGuide.value) guide.value = next
  detectedGuide.value = next
}
const deviceLabel = computed(() =>
  guide.value === 'android'
    ? 'Android · Chrome'
    : guide.value === 'desktop'
      ? '电脑浏览器'
      : /iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
        ? 'iPhone / iPad · Safari'
        : '手机界面 · Safari 指引',
)
const copied = ref(false)
const copyError = ref('')
const visible = computed(
  () =>
    platformState.ready &&
    platformState.kind === 'web' &&
    !standalone.value &&
    dismissedUntil.value <= clockNow.value,
)
const isIos = computed(() => guide.value === 'ios26' || guide.value === 'ios18')
const steps = computed(() => {
  const start = {
    title: '用 Safari 打开 Aegis',
    text: `访问 ${appInfo.websiteLabel}。如果在微信等应用内，请先在 Safari 中打开。`,
    icon: Compass,
    action: 'Safari 浏览器',
  }
  const home = {
    title: '添加到主屏幕',
    text: '在共享菜单中向下滑动，找到并点击“添加到主屏幕”。',
    icon: SquarePlus,
    action: '添加到主屏幕',
  }
  const finish = {
    title: '确认添加，完成保存',
    text:
      guide.value === 'ios26'
        ? '名称保留 Aegis，开启“作为网页 App 打开”，再点右上角“添加”。之后从桌面 Aegis 图标进入。'
        : '名称保留 Aegis，点右上角“添加”。之后从桌面 Aegis 图标进入。',
    icon: Check,
    action: guide.value === 'ios26' ? '作为网页 App 打开 → 添加' : 'Aegis → 添加',
  }
  if (guide.value === 'ios26')
    return [
      start,
      {
        title: '打开更多菜单',
        text: '在 Safari 地址栏旁点击“···”。若已显示共享图标，可直接点击共享。',
        icon: Ellipsis,
        action: '···  更多',
      },
      { title: '点击共享', text: '在展开的菜单中选择“共享”。', icon: Share, action: '共享' },
      home,
      finish,
    ]
  if (guide.value === 'ios18')
    return [
      start,
      {
        title: '点击共享图标',
        text: '点 Safari 工具栏中“方框向上箭头”的共享图标。',
        icon: Share,
        action: '共享',
      },
      home,
      finish,
    ]
  if (guide.value === 'android')
    return [
      {
        title: '用 Chrome 打开 Aegis',
        text: `访问 ${appInfo.websiteLabel}。`,
        icon: Compass,
        action: 'Chrome 浏览器',
      },
      {
        title: '打开浏览器菜单',
        text: '点击右上角“⋮”，选择“添加到主屏幕”或“安装应用”。不同浏览器文案可能不同。',
        icon: Ellipsis,
        action: '⋮ → 添加到主屏幕 / 安装应用',
      },
      {
        title: '确认添加',
        text: '按浏览器提示点击“添加”或“安装”，完成后从桌面图标打开 Aegis。',
        icon: Check,
        action: '添加 / 安装',
      },
    ]
  return [
    {
      title: '打开 Aegis 官网',
      text: `使用 Chrome、Edge 或 Safari 访问 ${appInfo.websiteLabel}。`,
      icon: Monitor,
      action: appInfo.websiteLabel,
    },
    {
      title: '保存为应用或快捷方式',
      text: 'Chrome / Edge：在菜单中查找“安装 Aegis”或“将网页安装为应用”。Mac Safari：选择“文件”→“添加到程序坞”。',
      icon: SquarePlus,
      action: '安装应用 / 添加到程序坞',
    },
    {
      title: '确认名称并保存',
      text: '名称保留 Aegis，再点“安装”或“添加”。若没有安装选项，可先收藏官网，或用手机按对应指引保存到桌面。',
      icon: Check,
      action: 'Aegis → 添加',
    },
  ]
})
let media: MediaQueryList | undefined
function updateStandalone() {
  standalone.value = isStandaloneWindow()
  if (standalone.value) open.value = false
}
onMounted(() => {
  refreshDismissal()
  window.addEventListener('storage', dismissalStorageChanged)
  window.addEventListener('focus', refreshDismissal)
  window.addEventListener('pageshow', refreshDismissal)
  document.addEventListener('visibilitychange', visibilityChanged)
  updateStandalone()
  updateDevice()
  window.addEventListener('resize', updateDevice)
  media = matchMedia('(display-mode: standalone)')
  media.addEventListener('change', updateStandalone)
  window.addEventListener('appinstalled', updateStandalone)
})
onBeforeUnmount(() => {
  window.clearTimeout(dismissalTimer)
  window.removeEventListener('storage', dismissalStorageChanged)
  window.removeEventListener('focus', refreshDismissal)
  window.removeEventListener('pageshow', refreshDismissal)
  document.removeEventListener('visibilitychange', visibilityChanged)
  window.removeEventListener('resize', updateDevice)
  media?.removeEventListener('change', updateStandalone)
  window.removeEventListener('appinstalled', updateStandalone)
})
function showGuide() {
  updateDevice()
  open.value = true
  copied.value = false
  copyError.value = ''
}
async function copyWebsite() {
  copied.value = false
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(appInfo.website)
    copied.value = true
  } catch {
    copyError.value = '暂时无法复制，可长按上方官网地址复制。'
  }
}
</script>
<template>
  <div v-if="visible" class="install-entry-space" aria-hidden="true"></div>
  <section v-if="visible" class="install-entry" aria-label="Aegis 官方 APP">
    <span class="install-entry__mark"><AegisMark /></span>
    <div class="install-entry__copy">
      <strong>下载官方 APP</strong><span>添加到桌面，快捷打开</span>
    </div>
    <button
      type="button"
      class="install-entry__get"
      aria-label="下载官方 APP，查看安装步骤"
      aria-haspopup="dialog"
      @click="showGuide"
    >
      <Download :size="15" /><span>获取</span>
    </button>
    <button
      class="install-entry__close"
      type="button"
      aria-label="关闭下载提示，24小时内不再显示"
      title="24小时内不再显示"
      @click="dismissEntry"
    >
      <X :size="16" />
    </button>
  </section>
  <BottomDrawer :open="visible && open" title="添加 Aegis 到桌面" @close="open = false">
    <div class="install-guide">
      <div class="install-guide__overview">
        <div class="install-guide__intro">
          <span class="install-entry__mark"><AegisMark /></span>
          <div>
            <strong>像 APP 一样打开 Aegis</strong>
            <p>保存网页版入口，无需下载安装包。</p>
          </div>
        </div>
        <div class="install-guide__device">
          <span
            ><component :is="guide === 'desktop' ? Monitor : Smartphone" :size="16" />{{
              deviceLabel
            }}</span
          ><span v-if="isIos" class="install-guide__version">{{
            guide === 'ios26' ? '新版界面' : '旧版界面'
          }}</span>
        </div>
        <button
          v-if="isIos"
          class="install-guide__version-switch"
          type="button"
          @click="guide = guide === 'ios26' ? 'ios18' : 'ios26'"
        >
          <Info :size="14" />{{
            guide === 'ios26' ? '界面不同？查看旧版 Safari 图示' : '界面不同？查看新版 Safari 图示'
          }}
        </button>
      </div>
      <div class="install-guide__steps-heading">
        <strong>跟着图示操作</strong><span>{{ steps.length }} 步完成</span>
      </div>
      <ol class="install-guide__steps">
        <li v-for="(step, i) in steps" :key="`${guide}-${i}`">
          <div class="install-guide__step-heading">
            <span class="install-guide__number">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3>{{ step.title }}</h3>
          </div>
          <p>{{ step.text }}</p>
          <InstallStepVisual
            :guide="guide"
            :kind="
              i === 0
                ? 'open'
                : i === steps.length - 1
                  ? 'finish'
                  : guide === 'android' || guide === 'desktop'
                    ? 'menu'
                    : step.icon === Ellipsis
                      ? 'more'
                      : step.icon === Share
                        ? 'share'
                        : 'home'
            "
            :label="`${step.title}操作示意：${step.action}`"
          />
        </li>
      </ol>
      <div class="install-guide__site">
        <span>{{ appInfo.websiteLabel }}</span
        ><button
          type="button"
          :aria-label="copied ? '官网链接已复制' : '复制官网链接'"
          @click="copyWebsite"
        >
          <Check v-if="copied" :size="16" /><Copy v-else :size="16" />{{
            copied ? '已复制' : '复制链接'
          }}
        </button>
      </div>
      <p v-if="copyError" class="install-guide__hint" role="status">{{ copyError }}</p>
      <button class="install-guide__done" type="button" @click="open = false">我知道了</button>
    </div>
  </BottomDrawer>
</template>
<style scoped>
.install-entry-space {
  height: 82px;
}
.install-entry {
  position: fixed;
  z-index: 29;
  left: 50%;
  bottom: calc(94px + var(--ae-safe-bottom));
  transform: translateX(-50%);
  width: min(calc(100% - 24px), 406px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 10px 6px 10px 10px;
  border: 1px solid #cfe2fa;
  border-radius: 20px;
  background: linear-gradient(115deg, #fffffffa, #eef7fff5 55%, #e7f2fff5);
  box-shadow:
    inset 0 1px 1px white,
    inset 0 -1px 1px #b8d3f34d,
    0 6px 22px #397fc329;
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
}
.install-entry__copy {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.install-entry__copy strong {
  font-size: 14px;
  font-weight: 650;
}
.install-entry__copy > span {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ae-muted);
}
.install-entry__mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border: 1px solid white;
  border-radius: 13px;
  background: #f6faff;
}
.install-entry__mark :deep(svg),
.install-entry__mark :deep(img) {
  width: 32px;
  height: 32px;
}
.install-entry > .install-entry__get {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 44px;
  flex-shrink: 0;
  padding: 0 9px;
  border: 1px solid #fff;
  border-radius: 13px;
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}
.install-entry > .install-entry__mark {
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: linear-gradient(145deg, #fff, #e3f0ff);
  box-shadow:
    0 3px 9px #4b93eb14,
    inset 0 1px #fff;
}
.install-entry__close {
  display: grid;
  place-items: center;
  width: 44px;
  min-width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ae-muted);
}
.install-entry__close:active {
  background: #deebfa;
}
@media (max-width: 374px) {
  .install-entry {
    gap: 5px;
    padding-left: 8px;
  }
  .install-entry > .install-entry__mark {
    width: 36px;
    height: 36px;
  }
  .install-entry__copy strong {
    font-size: 13px;
  }
  .install-entry > .install-entry__get {
    padding-inline: 7px;
  }
}
.install-guide {
  padding: 12px 14px 18px;
  color: var(--ae-text);
}
.install-guide__overview {
  padding: 14px 14px 4px;
  border: 1px solid #d8e9fd;
  border-radius: 20px;
  background: linear-gradient(135deg, #fff, #eaf4ff);
  box-shadow: inset 0 1px white;
}
.install-guide__intro {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.install-guide__intro .install-entry__mark {
  width: 46px;
  height: 46px;
  border-radius: 15px;
  background: linear-gradient(145deg, #fff, #e9f3ff);
  box-shadow: 0 3px 12px #4b93eb14;
}
.install-guide__intro strong {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.5;
  letter-spacing: -0.2px;
}
.install-guide__intro p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ae-muted);
  line-height: 1.7;
}
.install-guide__hint {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  color: var(--ae-muted);
  font-size: 12px;
  line-height: 1.7;
  margin: 8px 0;
}
.install-guide__hint > svg {
  flex-shrink: 0;
  margin-top: 3px;
}
.install-guide__device {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 9px 10px;
  border: 1px solid #d7e8fc;
  border-radius: 11px;
  background: #ffffffc9;
}
.install-guide__device > span:first-child {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ae-text);
}
.install-guide__version {
  margin-left: auto;
  padding: 3px 6px;
  border-radius: 6px;
  background: #e7f2ff;
  color: var(--ae-highlight);
  font-size: 12px;
  font-weight: 500;
}
.install-guide__version-switch {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  padding: 4px 0;
  border: 0;
  background: none;
  color: var(--ae-highlight);
  font-size: 12px;
  text-align: left;
}
.install-guide__steps-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin: 20px 2px 10px;
}
.install-guide__steps-heading strong {
  font-size: 14px;
  font-weight: 650;
}
.install-guide__steps-heading > span {
  color: var(--ae-muted);
  font-size: 12px;
}
.install-guide__steps {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: grid;
  gap: 12px;
}
.install-guide__steps li {
  padding: 14px;
  border: 1px solid var(--ae-border);
  border-radius: 18px;
  background: white;
  box-shadow: 0 3px 12px #4b93eb06;
  min-width: 0;
}
.install-guide__step-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 8px;
}
.install-guide__number {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid #fff;
  border-radius: 9px;
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  color: #fff;
  font-size: 12px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.install-guide__steps h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 650;
  line-height: 1.5;
}
.install-guide__steps p {
  margin: 0;
  font-size: 13px;
  line-height: 1.75;
  color: var(--ae-muted);
}
.install-guide__site {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 10px;
  border: 1px solid var(--ae-border);
  border-radius: 12px;
  background: #fff;
}
.install-guide__site > span {
  font-size: 12px;
  word-break: break-all;
  color: var(--ae-muted);
  user-select: all;
}
.install-guide__site > button {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 44px;
  flex-shrink: 0;
  padding: 0 5px;
  border: 0;
  background: none;
  color: var(--ae-highlight);
  font-size: 12px;
}
.install-guide__done {
  width: 100%;
  min-height: 48px;
  margin-top: 12px;
  border: 1px solid #fff;
  border-radius: 14px;
  background: var(--ae-pill);
  box-shadow: var(--ae-pill-shadow);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}
:is(.install-entry, .install-guide) button:focus-visible {
  outline: 2px solid var(--ae-highlight);
  outline-offset: 2px;
}
</style>
