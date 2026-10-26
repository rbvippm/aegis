<script setup lang="ts">
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  FileClock,
  MessageSquare,
  RefreshCw,
  Star,
  Send,
} from '@lucide/vue'
import AegisMark from '@/shared/ui/AegisMark.vue'
import { appInfo } from '@/shared/app-info'
defineProps<{ releases?: boolean }>()
const emit = defineEmits<{ feedback: []; releases: []; back: []; messages: []; help: [] }>()
const socialChannels = [
  { label: 'X（推特）', href: 'https://x.com/', path: 'M18.9 2H22l-6.8 7.8L23.2 22h-6.3L12 14.6 5.5 22H2.3l7.9-9L1 2h6.5l4.4 6.7L18.9 2ZM17.8 20h1.7L6.6 3.9H4.8L17.8 20Z' },
  { label: 'Telegram', href: 'https://telegram.org/', path: '' },
  { label: 'Facebook', href: 'https://www.facebook.com/', path: 'M14 22v-9h3l.5-4H14V7c0-1.2.3-2 2-2h2V1.4C17.5 1.2 16 1 14.5 1 11 1 9 3.2 9 7v2H6v4h3v9Z' },
  { label: 'YouTube', href: 'https://www.youtube.com/', path: 'M23 7s-.2-1.7-.9-2.5c-.9-1-1.9-1-2.4-1.1C16.3 3.2 12 3.2 12 3.2s-4.3 0-7.7.2c-.5.1-1.5.1-2.4 1.1C1.2 5.3 1 7 1 7S.8 9 .8 11v2c0 2 .2 4 .2 4s.2 1.7.9 2.5c.9 1 2.1 1 2.7 1.1 2 .2 7.4.2 7.4.2s4.3 0 7.7-.3c.5 0 1.5 0 2.4-1 .7-.8.9-2.5.9-2.5s.2-2 .2-4v-2c0-2-.2-4-.2-4ZM9 16V8l8 4-8 4Z' },
]
const highlights = [
  {
    title: '平台监测',
    text: '按公链、币种、平台与时间筛选资金数据，查看评分依据、出款观测和异常动态。',
  },
  {
    title: '赔率对比',
    text: '同场、同盘口、同选项比较有效报价，展示过期、暂停与缺失报价的排除原因。',
  },
  { title: 'AI 数据分析', text: '结合平台和赛事范围解释数据，展示推荐理由、来源与后续核验入口。' },
  { title: '关注与邀请', text: '关注平台接收站内异常提醒，通过专属邀请码、链接和海报邀请好友。' },
]
</script>
<template>
  <div class="ab-page">
    <template v-if="!releases">
      <section class="ab-brand" aria-label="Aegis 应用信息">
        <span class="ab-mark"><AegisMark /></span>
        <h3>Aegis <span>御盾</span></h3>
        <p>看清平台，再做选择。</p>
        <span class="ab-version">v{{ appInfo.version }}</span>
      </section>
      <section class="ab-menu" aria-label="版本与反馈">
        <button class="ab-row" @click="emit('feedback')">
          <span class="ab-icon"><Star :size="19" /></span
          ><span class="ab-copy"><strong>评价与建议</strong><small>分享你的使用体验</small></span
          ><ChevronRight :size="16" />
        </button>
        <button class="ab-row" @click="emit('releases')">
          <span class="ab-icon"><FileClock :size="19" /></span
          ><span class="ab-copy"
            ><strong>版本日志</strong><small>查看本版本功能与体验更新</small></span
          ><span class="ab-meta">v{{ appInfo.version }}</span
          ><ChevronRight :size="16" />
        </button>
        <a :href="appInfo.website" target="_blank" rel="noopener noreferrer" class="ab-row"
          ><span class="ab-icon"><RefreshCw :size="19" /></span
          ><span class="ab-copy"
            ><strong>版本更新</strong><small>前往官网查看最新版本信息</small></span
          ><ArrowUpRight :size="16"
        /></a>
      </section>
      <section class="ab-channel-section" aria-labelledby="about-channels-title">
        <h3 id="about-channels-title">社交媒体</h3>
        <div class="ab-channels">
          <a
            v-for="channel in socialChannels"
            :key="channel.label"
            :href="channel.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span><svg v-if="channel.path" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="channel.path" /></svg><Send v-else :size="22" /></span>
            <strong>{{ channel.label }}</strong>
            <ArrowUpRight :size="12" />
          </a>
        </div>
        <p class="ab-domain">{{ appInfo.websiteLabel }}</p>
      </section>
      <section class="ab-description">
        <span><MessageSquare :size="16" />以数据为依据</span>
        <p>提供链上资金监测、同盘口赔率对比与可追溯的 AI 分析，帮助你理解平台信息与规则。</p>
      </section>
    </template>
    <template v-else>
      <button class="ab-back" @click="emit('back')"><ChevronLeft :size="16" />返回关于我们</button>
      <section class="ab-release">
        <header>
          <strong>v{{ appInfo.version }}</strong
          ><span>本版本功能</span>
        </header>
        <p>围绕平台数据、赔率对比和 AI 分析，完善查看、解释与跟进的体验。</p>
        <article v-for="item in highlights" :key="item.title">
          <h3>{{ item.title }}</h3>
          <p>{{ item.text }}</p>
        </article>
      </section>
    </template>
  </div>
</template>
<style scoped>
.ab-page {
  color: var(--ae-text);
  padding-bottom: 8px;
}
.ab-brand {
  display: grid;
  justify-items: center;
  gap: 6px;
  padding: 6px 12px 18px;
  text-align: center;
}
.ab-mark {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin-bottom: 2px;
  border: 1px solid #fff;
  border-radius: 20px;
  background: linear-gradient(145deg, #fff, #e9f3ff);
  box-shadow: 0 6px 18px #729ed817;
}
.ab-mark img {
  width: 48px;
  height: 48px;
}
.ab-brand h3 {
  margin: 0;
  font-size: 23px;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.ab-brand h3 span {
  font-size: 14px;
  font-weight: 500;
  color: var(--ae-label);
  margin-left: 3px;
  letter-spacing: 0;
}
.ab-brand p {
  margin: 0;
  font-size: 13px;
  color: var(--ae-muted);
}
.ab-version {
  color: var(--ae-label);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  padding: 2px 8px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 8px;
  background: #f5f9ff;
}
.ab-menu {
  overflow: hidden;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 18px;
  background: white;
}
.ab-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 68px;
  padding: 12px;
  text-align: left;
  text-decoration: none;
  color: var(--ae-text);
  border: 0;
  background: transparent;
}
.ab-row + .ab-row {
  border-top: 1px solid #e8eff9;
}
.ab-icon {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  height: 34px;
  border-radius: 11px;
  background: #eff6ff;
  color: var(--ae-highlight);
}
.ab-copy {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
}
.ab-copy strong {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
}
.ab-copy small {
  font-size: 12px;
  line-height: 1.5;
  color: var(--ae-muted);
}
.ab-row > svg {
  flex-shrink: 0;
  color: var(--ae-label);
}
.ab-meta {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--ae-muted);
}
.ab-channel-section {
  margin: 16px 0;
}
.ab-channel-section > h3 {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ae-muted);
}
.ab-channels {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 12px 6px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 18px;
  background: white;
}
.ab-channels > a,
.ab-channels > button {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 76px;
  padding: 3px 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--ae-text);
  text-decoration: none;
}
.ab-channels > a > span,
.ab-channels > button > span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid #dceafa;
  border-radius: 13px;
  background: #f1f7ff;
  color: var(--ae-highlight);
}
.ab-channels strong {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.5;
}
.ab-channels > a > svg {
  position: absolute;
  top: 4px;
  right: 4px;
  color: var(--ae-muted);
}
.ab-domain {
  margin: 8px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--ae-muted);
}
.ab-description {
  padding: 12px 14px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 16px;
  background: #f7faff;
}
.ab-description > span {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ae-label);
  font-size: 13px;
  font-weight: 600;
}
.ab-description p,
.ab-release p {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--ae-muted);
}
.ab-back {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  padding: 0;
  margin-bottom: 8px;
  border: 0;
  background: none;
  color: var(--ae-highlight);
  font-size: 13px;
}
.ab-release {
  padding: 14px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 18px;
  background: white;
}
.ab-release header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ab-release header > strong {
  font-size: 21px;
  font-variant-numeric: tabular-nums;
}
.ab-release header > span {
  font-size: 12px;
  color: var(--ae-label);
  background: #edf5ff;
  padding: 4px 8px;
  border-radius: 8px;
}
.ab-release article {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #e8eff9;
}
.ab-release h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.ab-row:focus-visible,
.ab-channels :is(a, button):focus-visible {
  outline: 2px solid var(--ae-highlight);
  outline-offset: -3px;
}
</style>
