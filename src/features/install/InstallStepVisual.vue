<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronLeft,
  Ellipsis,
  Share,
  SquarePlus,
  Copy,
  Plus,
  Check,
  MousePointer2,
} from '@lucide/vue'
import AegisMark from '@/shared/ui/AegisMark.vue'
import type { InstallGuide } from '@/platform/install'
const props = defineProps<{ kind: string; guide: InstallGuide; label: string }>()
const isNewIos = computed(() => props.guide === 'ios26')
</script>
<template>
  <figure class="install-visual" role="img" :aria-label="label">
    <template v-if="kind === 'open'">
      <div class="install-visual__address">
        <span class="install-visual__lock">✓</span>aegisuu.vercel.app<span>↻</span>
      </div>
      <div class="install-visual__brand">
        <AegisMark /><strong>Aegis</strong><span>链上监测 · AI 分析 · 赔率对比</span>
      </div>
      <div class="install-visual__caption"><Check :size="13" />先在浏览器打开官网</div>
    </template>
    <template v-else-if="kind === 'more' || kind === 'share'">
      <div class="install-visual__mini-content"><span></span><span></span></div>
      <div class="install-visual__toolbar">
        <ChevronLeft :size="17" /><span class="install-visual__url">aegisuu.vercel.app</span
        ><span v-if="kind === 'more'" class="install-visual__focus"><Ellipsis :size="21" /></span
        ><span v-else class="install-visual__focus"><Share :size="20" /></span>
      </div>
      <div
        v-if="kind === 'share' && isNewIos"
        class="install-visual__row install-visual__row--focus"
      >
        <Share :size="18" /><strong>共享</strong><MousePointer2 :size="15" />
      </div>
      <div class="install-visual__caption">
        <MousePointer2 :size="13" />{{ kind === 'more' ? '点地址栏旁的“···”' : '点方框向上箭头' }}
      </div>
    </template>
    <template v-else-if="kind === 'home' || kind === 'menu'">
      <div class="install-visual__sheet-head">
        <span class="install-visual__app-icon"><AegisMark /></span
        ><strong>{{ kind === 'home' ? 'Aegis · 共享' : '浏览器菜单' }}</strong
        ><Ellipsis :size="17" />
      </div>
      <div class="install-visual__row">
        <Copy :size="16" /><span>{{ kind === 'home' ? '拷贝' : '新建标签页' }}</span>
      </div>
      <div class="install-visual__row install-visual__row--focus">
        <SquarePlus :size="18" /><strong>{{
          kind === 'home'
            ? '添加到主屏幕'
            : guide === 'android'
              ? '添加到主屏幕 / 安装应用'
              : '安装 Aegis / 添加到程序坞'
        }}</strong
        ><MousePointer2 :size="15" />
      </div>
      <div class="install-visual__caption">
        {{ kind === 'home' ? '向下滑动共享菜单可找到此项' : '菜单名称会随浏览器不同而变化' }}
      </div>
    </template>
    <template v-else>
      <div class="install-visual__sheet-head">
        <span>取消</span><strong>{{ guide === 'desktop' ? '安装 Aegis' : '添加到主屏幕' }}</strong
        ><span class="install-visual__add"
          >{{ guide === 'desktop' ? '安装' : '添加' }}<Plus :size="12"
        /></span>
      </div>
      <div class="install-visual__saved-app">
        <span class="install-visual__app-icon"><AegisMark /></span>
        <div><strong>Aegis</strong><span>aegisuu.vercel.app</span></div>
        <MousePointer2 :size="16" />
      </div>
      <div v-if="isNewIos" class="install-visual__toggle-row">
        <span>作为网页 App 打开</span><span class="install-visual__toggle"><i></i></span>
      </div>
      <div class="install-visual__caption">
        <Check :size="13" />{{
          isNewIos ? '保持开启，再点击右上角“添加”' : '确认后，从桌面 Aegis 图标打开'
        }}
      </div>
    </template>
    <figcaption>操作示意</figcaption>
  </figure>
</template>
<style scoped>
.install-visual {
  position: relative;
  margin: 12px 0 0;
  padding: 14px 12px 25px;
  border: 1px solid #d7e8fc;
  border-radius: 13px;
  background: linear-gradient(145deg, #eff6ff, #f9fcff);
  box-shadow: inset 0 1px white;
  color: var(--ae-text);
  overflow: hidden;
}
.install-visual__address {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 9px;
  background: #e8f0fa;
  color: var(--ae-muted);
  font-size: 12px;
}
.install-visual__address > span:last-child {
  margin-left: auto;
}
.install-visual__lock {
  color: #087f6b;
}
.install-visual__brand {
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  gap: 3px 7px;
  padding: 14px 2px;
}
.install-visual__brand :deep(img),
.install-visual__brand :deep(svg) {
  width: 30px;
  height: 30px;
  grid-row: span 2;
}
.install-visual__brand strong {
  font-size: 16px;
}
.install-visual__brand > span {
  font-size: 11px;
  color: var(--ae-muted);
}
.install-visual__mini-content {
  display: grid;
  gap: 6px;
  padding: 4px 2px 14px;
}
.install-visual__mini-content > span {
  height: 5px;
  border-radius: 4px;
  background: #dceafa;
  width: 65%;
}
.install-visual__mini-content > span:last-child {
  width: 45%;
}
.install-visual__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 12px;
  background: #e9f1fc;
}
.install-visual__toolbar > svg {
  color: var(--ae-muted);
  flex-shrink: 0;
}
.install-visual__url {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  text-align: center;
  color: var(--ae-muted);
}
.install-visual__focus {
  display: grid;
  place-items: center;
  width: 32px;
  height: 30px;
  border: 2px solid var(--ae-highlight);
  border-radius: 9px;
  background: white;
  color: var(--ae-highlight);
  box-shadow: 0 0 0 3px #dcecff;
}
.install-visual__caption {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--ae-muted);
  text-align: center;
}
.install-visual__caption svg {
  flex-shrink: 0;
  color: var(--ae-highlight);
}
.install-visual__sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding-bottom: 10px;
  font-size: 12px;
  color: var(--ae-muted);
}
.install-visual__sheet-head > strong {
  flex: 1;
  text-align: center;
  color: var(--ae-text);
  font-size: 12px;
  font-weight: 600;
}
.install-visual__app-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e0ebf9;
  border-radius: 9px;
  background: #fff;
  flex-shrink: 0;
}
.install-visual__app-icon :deep(img),
.install-visual__app-icon :deep(svg) {
  width: 24px;
  height: 24px;
}
.install-visual__row {
  display: flex;
  align-items: center;
  gap: 7px;
  min-height: 32px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--ae-muted);
}
.install-visual__row svg {
  flex-shrink: 0;
}
.install-visual__row--focus {
  border: 2px solid var(--ae-highlight);
  border-radius: 10px;
  background: #eaf3ff;
  box-shadow: 0 0 0 3px #dcecff;
  color: var(--ae-highlight);
}
.install-visual__row--focus > strong {
  font-size: 13px;
  font-weight: 650;
  flex: 1;
}
.install-visual__add {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 7px;
  border: 2px solid var(--ae-highlight);
  border-radius: 8px;
  background: #e9f3ff;
  color: var(--ae-highlight);
  font-size: 12px;
  font-weight: 600;
}
.install-visual__saved-app {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
  border-top: 1px solid #e1eaf6;
}
.install-visual__saved-app > div {
  flex: 1;
  display: grid;
  gap: 3px;
}
.install-visual__saved-app strong {
  font-size: 13px;
}
.install-visual__saved-app > div > span {
  font-size: 11px;
  color: var(--ae-muted);
}
.install-visual__saved-app > svg {
  color: var(--ae-highlight);
}
.install-visual__toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 9px 0;
  border-top: 1px solid #e1eaf6;
  font-size: 12px;
}
.install-visual__toggle {
  width: 30px;
  height: 18px;
  border-radius: 10px;
  padding: 2px;
  background: #087f6b;
  box-sizing: border-box;
}
.install-visual__toggle i {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  margin-left: auto;
}
.install-visual figcaption {
  position: absolute;
  right: 10px;
  bottom: 5px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #e6effb;
  font-size: 10px;
  color: #526581;
}
</style>
