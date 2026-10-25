<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  Crown,
  FileText,
  Headphones,
  Heart,
  Info,
  Link,
  LockKeyhole,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
} from '@lucide/vue'
import MessageCenterLink from '@/shared/ui/MessageCenterLink.vue'
import AegisMark from '@/shared/ui/AegisMark.vue'
import AiOrb from '@/shared/ui/AiOrb.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import ProfileDrawers from './ProfileDrawers.vue'
import SubscriptionBenefits from './SubscriptionBenefits.vue'
import { useProfile } from './store'
import { formatCents, maskUid } from './logic'
import { dataMode } from '@/shared/api/config'
import { useConversation } from '@/features/ai/conversation-store'
import {
  planningMatches as sportsMatches,
  planningOperators as sportsPlatforms,
} from '@/mocks/sports-planning'
import type { ProfilePanel, ProfileTicket } from './types'
import './profile.css'

const profile = useProfile()
const ai = useConversation()
const route = useRoute()
const router = useRouter()
const sections = {
  overview: '我的',
  subscription: '订阅与特权',
  earnings: '收益与绑定',
  tickets: '我的工单',
  messages: '消息中心',
  follows: '我的关注',
  history: 'AI 记录',
}
type Section = keyof typeof sections
const section = computed<Section>(() =>
  String(route.query.section) in sections ? (String(route.query.section) as Section) : 'overview',
)
const panel = ref<ProfilePanel | null>(null)
const platformId = ref('C')
const ticketId = ref('AE-0103')
const selectedTicket = computed(
  () => profile.tickets.find((item) => item.id === ticketId.value) ?? profile.tickets[0],
)
const earningsTab = ref('bindings')
const ticketFilter = ref('all')
const messageFilter = ref('all')
const followsTab = ref('sports')
const followedIds = ref<string[]>([])
const followedPlatforms = ref<string[]>([])
const followedMatches = computed(() =>
  dataMode === 'demo' ? sportsMatches.filter((item) => followedIds.value.includes(item.id)) : [],
)
const visibleTickets = computed(() =>
  profile.tickets.filter(
    (item) =>
      ticketFilter.value === 'all' ||
      (ticketFilter.value === 'processing'
        ? ['materials', 'processing'].includes(item.status)
        : item.status === 'closed'),
  ),
)
const visibleNotices = computed(() =>
  profile.notices.filter(
    (item) => messageFilter.value === 'all' || item.type === messageFilter.value,
  ),
)
const ticketNames = {
  materials: '待补充材料',
  processing: '处理中',
  closed: '已结束',
  draft: '草稿',
}
const draftCount = computed(
  () => profile.tickets.filter((item) => item.status === 'materials').length,
)
function readFollowed() {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('aegis-sports-followed') ?? '[]')
    followedIds.value = Array.isArray(saved)
      ? saved.filter(
          (id): id is string =>
            typeof id === 'string' && sportsMatches.some((item) => item.id === id),
        )
      : []
  } catch {
    followedIds.value = []
  }
}
function unfollow(id: string) {
  followedIds.value = followedIds.value.filter((item) => item !== id)
  try {
    localStorage.setItem('aegis-sports-followed', JSON.stringify(followedIds.value))
  } catch {
    /* Session state remains usable if browser storage is blocked. */
  }
}
function open(kind: ProfilePanel, platform = platformId.value, ticket = ticketId.value) {
  if (
    ['binding', 'bindingInfo', 'ticketForm', 'ticketInfo', 'identity'].includes(kind) &&
    !profile.previewIdentity
  ) {
    panel.value = 'login'
    return
  }
  platformId.value = platform
  ticketId.value = ticket
  panel.value = kind
}
async function navigate(next: string, tab?: string) {
  panel.value = null
  await router.push({
    path: '/me',
    query: next === 'overview' ? {} : { section: next, ...(tab ? { tab } : {}) },
  })
}

function goBack() {
  const previous = router.options.history.state.back
  // Vue Router's history entry survives reloads; never navigate back to an external page.
  if (typeof previous === 'string' && previous.startsWith('/') && !previous.startsWith('//')) {
    router.back()
  } else {
    void router.replace('/me')
  }
}

function ticketAction(ticket: ProfileTicket) {
  ticketId.value = ticket.id
  open('ticketInfo', platformId.value, ticket.id)
}
function showNotice(id: string) {
  const notice = profile.notices.find((item) => item.id === id)
  if (!notice) return
  notice.read = true
  if (notice.target.startsWith('/compare?')) void router.push(notice.target)
  else if (notice.target) void navigate(notice.target)
  else open('about')
}
async function restoreAi(id: string) {
  ai.restore(id)
  await router.push('/ai')
}
watch(
  () => route.fullPath,
  () => {
    panel.value = null
    earningsTab.value = route.query.tab === 'records' ? 'records' : 'bindings'
    readFollowed()
    const requestedPanel = String(route.query.panel ?? '')
    if (requestedPanel === 'binding') {
      const platform = sportsPlatforms.find((p) => p.id === route.query.platform)
      if (platform) {
        if (!profile.bindings.some((b) => b.id === platform.id))
          profile.bindings.push({
            id: platform.id,
            name: platform.name,
            uid: '',
            eligibility: 'unbound',
          })
        open('binding', platform.id)
      }
    }
    if (['help', 'feedback', 'about'].includes(requestedPanel)) open(requestedPanel as ProfilePanel)
  },
  { immediate: true },
)
</script>
<template>
  <div class="pf-page">
    <header v-if="section === 'overview'" class="pf-header">
      <RouterLink to="/" class="pf-brand" aria-label="Aegis 首页"
        ><AegisMark /><span>Aegis</span></RouterLink
      >
      <h1 class="pf-sr">我的</h1>
      <div class="pf-header-actions">
        <MessageCenterLink
          class="pf-icon-button"
          :unread="profile.previewIdentity && profile.unreadCount > 0"
        />
        <button class="pf-icon-button" aria-label="账户设置" @click="open('settings')">
          <Settings :size="22" />
        </button>
      </div>
    </header>
    <header v-else class="pf-header pf-header--sub">
      <button class="pf-icon-button" aria-label="返回上一级" @click="goBack">
        <ChevronLeft :size="22" />
      </button>
      <h1>{{ sections[section] }}</h1>
      <MessageCenterLink v-if="section === 'subscription'" class="pf-icon-button" />
      <button
        v-else
        class="pf-icon-button"
        :aria-label="section === 'tickets' ? '工单通知' : '查看说明'"
        @click="section === 'tickets' ? navigate('messages') : open('method')"
      >
        <Bell v-if="section === 'tickets'" :size="21" /><Info v-else :size="21" />
      </button>
    </header>
    <div class="pf-content">
      <template v-if="section === 'overview'">
        <div class="pf-identity">
          <span class="pf-identity-crystal" aria-hidden="true"><AegisMark /></span>
          <button
            class="pf-avatar"
            aria-label="查看个人资料"
            @click="open(profile.previewIdentity ? 'identity' : 'login')"
          >
            <UserRound :size="28" />
          </button>
          <span class="pf-identity-main"
            ><span class="pf-name"
              ><button
                class="pf-name-button"
                @click="open(profile.previewIdentity ? 'identity' : 'login')"
              >
                {{ profile.previewIdentity ? profile.nickname : '游客' }}</button
              ><RouterLink
                class="pf-subscription-link"
                to="/me?section=subscription"
                aria-label="订阅与特权"
                ><span class="pf-badge pf-subscription-badge"
                  >{{ profile.previewIdentity ? '普通用户' : '未登录'
                  }}<ChevronRight :size="11" /></span></RouterLink></span
            ><span class="pf-user-id">{{
              profile.previewIdentity ? 'ID: AE00128' : '登录后查看个人记录'
            }}</span
            ><span class="pf-connections"
              ><button type="button" aria-label="Telegram" @click="open('telegram')">
                <span><Send :size="12" />Telegram</span></button
              ><button type="button" aria-label="邮箱" @click="open('email')">
                <span><Mail :size="12" />邮箱</span>
              </button></span
            ></span
          >
          <button
            class="pf-identity-more"
            aria-label="编辑个人资料"
            @click="open(profile.previewIdentity ? 'identity' : 'login')"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
        <RouterLink custom to="/me?section=vip" v-slot="{ href, navigate }"
          ><a
            class="pf-vip"
            :href="href"
            :aria-current="route.query.section === 'vip' ? 'page' : undefined"
            @click="navigate"
            ><span class="pf-vip-icon"><Crown :size="22" /></span
            ><span><strong>VIP 服务</strong><small>VIP 转移 · 定制化报价</small></span
            ><ChevronRight :size="16" /></a
        ></RouterLink>
        <section v-if="dataMode === 'demo' && profile.previewIdentity" class="pf-card pf-income">
          <div class="pf-section-heading">
            <h2>我的收益</h2>
            <button class="pf-income-link" @click="navigate('earnings', 'records')">
              查看记录<ChevronRight :size="16" />
            </button>
          </div>
          <div class="pf-income-metrics">
            <div>
              <p>待结算 USDT</p>
              <strong>{{ formatCents(profile.pendingCents) }}</strong>
            </div>
            <div>
              <p>累计已结算 USDT</p>
              <strong>{{ formatCents(profile.settledCents) }}</strong>
            </div>
          </div>
          <p class="pf-helper">收益记录，不是平台钱包余额</p>
        </section>
        <section v-else class="pf-card pf-empty-income">
          <h2>我的收益</h2>
          <p>
            {{ dataMode === 'demo' ? '登录后查看收益与绑定记录。' : '暂无收益记录。' }}
          </p>
          <button class="pf-text-button" @click="open('login')">
            登录与身份说明<ChevronRight :size="16" />
          </button>
        </section>
        <div class="pf-shortcuts" role="group" aria-label="个人中心快捷入口">
          <button @click="navigate('earnings')">
            <span
              ><Link :size="22" /><i v-if="profile.previewIdentity && profile.boundCount">{{
                profile.boundCount
              }}</i></span
            >绑定平台</button
          ><button @click="navigate('follows')">
            <span><Heart :size="22" /></span>我的关注</button
          ><button @click="navigate('history')">
            <span><MessageCircle :size="22" /></span>AI 记录</button
          ><button @click="navigate('tickets')">
            <span
              ><FileText :size="22" /><i
                v-if="profile.previewIdentity && draftCount"
                class="pf-count-warning"
                >{{ draftCount }}</i
              ></span
            >我的工单
          </button>
          <button @click="open('invite')">
            <span><UsersRound :size="22" /></span>邀请好友
          </button>
          <RouterLink to="/me?section=agents"
            ><span><UsersRound :size="22" /></span>代理服务</RouterLink
          >
          <button @click="open('settings')">
            <span><ShieldCheck :size="22" /></span>账户与隐私
          </button>
          <button @click="open('help')">
            <span><Headphones :size="22" /></span>帮助与客服
          </button>
        </div>
        <div class="pf-menu pf-menu--utility">
          <button @click="open('feedback')">
            <span class="pf-menu-icon"><FileText :size="18" /></span><span>意见反馈</span
            ><ChevronRight :size="14" /></button
          ><button @click="open('about')">
            <span class="pf-menu-icon"><Info :size="18" /></span><span>关于我们</span
            ><ChevronRight :size="14" />
          </button>
        </div>
        <p class="pf-version">version：v1.0.0</p>
      </template>
      <StatePanel
        v-else-if="dataMode !== 'demo'"
        title="暂无个人记录"
        description="登录后查看账户、收益、绑定和工单。"
      />
      <section v-else-if="!profile.previewIdentity && section !== 'follows'" class="pf-empty">
        <UserRound :size="32" />
        <h2>登录后查看个人记录</h2>
        <p>登录后查看收益、绑定和工单。</p>
        <button class="pf-primary" @click="open('login')">登录</button>
      </section>
      <SubscriptionBenefits v-else-if="section === 'subscription'" />
      <template v-else-if="section === 'earnings'">
        <section class="pf-card pf-summary">
          <p><Info :size="14" />仅记录收益，由平台或人工结算</p>
          <div class="pf-income-metrics">
            <div>
              <p>待结算 USDT</p>
              <strong>{{ formatCents(profile.pendingCents) }}</strong>
            </div>
            <div>
              <p>累计已结算 USDT</p>
              <strong>{{ formatCents(profile.settledCents) }}</strong>
            </div>
          </div>
        </section>
        <div class="pf-tabs" aria-label="收益视图">
          <button
            :class="{ active: earningsTab === 'records' }"
            :aria-pressed="earningsTab === 'records'"
            @click="earningsTab = 'records'"
          >
            收益明细</button
          ><button
            :class="{ active: earningsTab === 'bindings' }"
            :aria-pressed="earningsTab === 'bindings'"
            @click="earningsTab = 'bindings'"
          >
            绑定平台
          </button>
        </div>
        <template v-if="earningsTab === 'bindings'"
          ><div class="pf-section-heading">
            <h2>我的平台</h2>
            <button class="pf-small-button" @click="open('binding', 'C')">
              <Plus :size="14" />添加 UID
            </button>
          </div>
          <article
            v-for="binding in profile.bindings"
            :key="binding.id"
            class="pf-card pf-platform"
            :aria-label="binding.name"
          >
            <div class="pf-platform-top">
              <span class="pf-letter" :class="`pf-letter--${binding.id}`">{{ binding.id }}</span>
              <div>
                <h3>{{ binding.name }}</h3>
                <p>
                  {{
                    binding.uid ? `UID ${maskUid(binding.uid)}` : '尚未绑定 · 奖励资格将单独核验'
                  }}
                </p>
              </div>
              <span v-if="binding.uid" class="pf-badge pf-badge--blue">UID 已绑定</span
              ><button
                v-else
                class="pf-small-button"
                :aria-label="`绑定${binding.name} UID`"
                @click="open('binding', binding.id)"
              >
                绑定 UID
              </button>
            </div>
            <template v-if="binding.uid"
              ><div class="pf-platform-row">
                <span>奖励资格</span
                ><span
                  class="pf-badge"
                  :class="
                    binding.eligibility === 'verified' ? 'pf-badge--green' : 'pf-badge--amber'
                  "
                  >{{ binding.eligibility === 'verified' ? '✓ 已验证' : '待验证' }}</span
                >
              </div>
              <template v-if="binding.eligibility === 'verified'"
                ><div class="pf-platform-row"><span>结算方式</span><span>平台结算</span></div>
                <button
                  class="pf-text-button pf-platform-link"
                  @click="open('bindingInfo', binding.id)"
                >
                  查看绑定详情<ChevronRight :size="16" /></button></template
              ><template v-else
                ><p class="pf-platform-note">绑定 UID 不等于返水已开通</p>
                <button class="pf-small-button" @click="open('bindingInfo', binding.id)">
                  查看验证要求<ChevronRight :size="13" /></button></template
            ></template>
          </article>
          <div class="pf-info">
            <Info :size="15" /><span>收益资格、比例与结算规则，以核验结果为准。</span>
          </div>
          <section class="pf-card pf-settlement-preview">
            <button class="pf-section-heading pf-plain" @click="earningsTab = 'records'">
              <h3>结算记录</h3>
              <ChevronRight :size="16" />
            </button>
            <p><span>本期返水</span><span>待核对</span></p>
            <p><span>邀请奖励</span><span>规则待公布</span></p>
          </section></template
        >
        <template v-else
          ><div class="pf-info">
            <Info :size="15" /><span>只展示站外结算记录，无充值、提现或领取操作。</span>
          </div>
          <article v-for="record in profile.records" :key="record.id" class="pf-card pf-record">
            <div>
              <h3>{{ record.label }} · 平台 {{ record.platform }}</h3>
              <p>{{ record.date }} · UTC+8</p>
            </div>
            <div>
              <strong>{{ formatCents(record.cents) }}</strong
              ><small>USDT · {{ record.status === 'settled' ? '已结算' : '待核对' }}</small>
            </div>
          </article>
          <button class="pf-text-button" @click="open('method')">
            查看来源与收益口径<ChevronRight :size="16" /></button
        ></template>
      </template>
      <template v-else-if="section === 'tickets'">
        <div class="pf-private"><LockKeyhole :size="15" />工单与证据默认私密</div>
        <div class="pf-tabs pf-tabs--three" aria-label="工单筛选">
          <button
            v-for="(label, key) in { all: '全部', processing: '处理中', closed: '已结束' }"
            :key="key"
            :class="{ active: ticketFilter === key }"
            :aria-pressed="ticketFilter === key"
            @click="ticketFilter = key"
          >
            {{ label }}
          </button>
        </div>
        <div class="pf-section-heading">
          <h2>我的维权</h2>
          <button class="pf-small-button" @click="open('ticketForm')">
            <Plus :size="14" />新建工单
          </button>
        </div>
        <article
          v-for="ticket in visibleTickets"
          :key="ticket.id"
          class="pf-card pf-ticket"
          :aria-label="ticket.id"
        >
          <button class="pf-ticket-title" @click="ticketId = ticket.id">
            <h3>平台 {{ ticket.platform }} · {{ ticket.category }}</h3>
            <span
              class="pf-badge"
              :class="ticket.status === 'materials' ? 'pf-badge--amber' : 'pf-badge--blue'"
              >{{ ticketNames[ticket.status] }}</span
            >
          </button>
          <div class="pf-ticket-date">
            <span>{{ ticket.id }}</span
            ><span>{{ ticket.date }}</span>
          </div>
          <p>{{ ticket.description }}</p>
          <p v-if="ticket.supplement" class="pf-helper">已补充材料</p>
          <button
            v-if="ticket.status === 'materials' || ticket.status === 'draft'"
            class="pf-text-button"
            @click="ticketAction(ticket)"
          >
            {{ ticket.status === 'draft' ? '查看草稿' : '补充材料' }}<ChevronRight :size="16" />
          </button>
        </article>
        <section v-if="!visibleTickets.length" class="pf-empty">
          <FileText :size="30" />
          <h3>暂无已结束工单</h3>
          <button class="pf-text-button" @click="ticketFilter = 'all'">
            查看全部工单<ChevronRight :size="16" />
          </button>
        </section>
        <section v-if="selectedTicket && visibleTickets.length" class="pf-card pf-timeline">
          <div class="pf-section-heading">
            <h3>处理进度</h3>
            <small>{{ selectedTicket.id }}</small>
          </div>
          <ol v-if="selectedTicket.status !== 'draft'">
            <li class="done">
              <strong>已提交</strong>
              <p>材料已接收</p>
            </li>
            <li class="current">
              <strong>{{ selectedTicket.status === 'materials' ? '待补充材料' : '审核中' }}</strong>
              <p>核对范围与证据</p>
            </li>
            <li>
              <strong>等待反馈</strong>
              <p>以实际处理进度为准</p>
            </li>
          </ol>
          <ol v-else>
            <li class="current">
              <strong>草稿</strong>
              <p>已保存，等待提交</p>
            </li>
            <li>
              <strong>处理中</strong>
              <p>等待进一步反馈</p>
            </li>
          </ol>
          <button class="pf-text-button" @click="open('notifications')">
            有新进展时，通知我<ChevronRight :size="16" />
          </button>
        </section>
        <RouterLink
          class="pf-card pf-ai-help"
          to="/ai?analyze=1&amp;q=帮我整理出金进度咨询的事实和材料，不要自动提交"
          ><AiOrb /><span
            ><strong>让 AI 帮我整理事实</strong><small>整理描述与材料，不自动提交工单</small></span
          ><ChevronRight :size="16"
        /></RouterLink>
        <p class="pf-bottom-note"><ShieldCheck :size="12" />工单内容仅自己可见</p>
      </template>
      <template v-else-if="section === 'messages'"
        ><div class="pf-message-center">
          <div class="pf-section-heading pf-message-heading">
            <div>
              <h2>我的消息</h2>
              <span class="pf-message-count">{{
                profile.unreadCount ? `${profile.unreadCount} 条未读` : '全部已读'
              }}</span>
            </div>
            <button
              class="pf-message-read-all"
              :disabled="!profile.unreadCount"
              @click="profile.notices.forEach((item) => (item.read = true))"
            >
              全部标为已读
            </button>
          </div>
          <div class="pf-tabs pf-tabs--four">
            <button
              v-for="(label, key) in {
                all: '全部',
                platform: '平台',
                ticket: '工单',
                system: '系统',
              }"
              :key="key"
              :class="{ active: messageFilter === key }"
              :aria-pressed="messageFilter === key"
              @click="messageFilter = key"
            >
              {{ label }}
            </button>
          </div>
          <button
            v-for="notice in visibleNotices"
            :key="notice.id"
            class="pf-card pf-notice"
            :class="{ 'pf-notice--unread': !notice.read }"
            @click="showNotice(notice.id)"
          >
            <span class="pf-message-icon" :class="`pf-message-icon--${notice.type}`"
              ><component
                :is="
                  notice.type === 'ticket'
                    ? FileText
                    : notice.type === 'platform'
                      ? ShieldCheck
                      : Bell
                "
                :size="19" /><i
                class="pf-notice-mark"
                :class="{ read: notice.read }"
                :aria-label="notice.read ? '已读' : '未读'"
              ></i></span
            ><span class="pf-message-copy"
              ><span class="pf-message-kind">{{
                { platform: '平台通知', ticket: '工单进度', system: '系统通知' }[notice.type]
              }}</span
              ><strong>{{ notice.title }}</strong
              ><small>{{ notice.description }}</small></span
            ><ChevronRight class="pf-message-chevron" :size="15" />
          </button>
          <p v-if="!visibleNotices.length" class="pf-empty">暂无消息</p>
          <button class="pf-text-button pf-message-preferences" @click="open('notifications')">
            <Settings :size="17" /><span>通知渠道与偏好</span><ChevronRight :size="16" />
          </button>
        </div>
      </template>
      <template v-else-if="section === 'follows'"
        ><div class="pf-tabs">
          <button :class="{ active: followsTab === 'sports' }" @click="followsTab = 'sports'">
            赛事</button
          ><button
            :class="{ active: followsTab === 'platforms' }"
            @click="followsTab = 'platforms'"
          >
            平台
          </button>
        </div>
        <template v-if="followsTab === 'sports'"
          ><article v-for="match in followedMatches" :key="match.id" class="pf-card">
            <div class="pf-section-heading">
              <h3>{{ match.home }} vs {{ match.away }}</h3>
              <button class="pf-small-button" @click="unfollow(match.id)">取消关注</button>
            </div>
            <p class="pf-helper">来自体育对比页的本机关注记录</p>
          </article>
          <section v-if="!followedMatches.length" class="pf-empty">
            <Heart :size="30" />
            <h3>暂无关注赛事</h3>
            <p>在体育对比页点击关注后，会同步显示在这里。</p>
          </section>
          <RouterLink class="pf-primary pf-wide" to="/compare">去体育对比页</RouterLink></template
        ><template v-else
          ><p class="pf-helper">关注的平台会出现在这里。</p>
          <article v-for="item in profile.bindings" :key="item.id" class="pf-card pf-platform-top">
            <span class="pf-letter" :class="`pf-letter--${item.id}`">{{ item.id }}</span>
            <h3>{{ item.name }}</h3>
            <button
              class="pf-small-button"
              @click="
                followedPlatforms = followedPlatforms.includes(item.id)
                  ? followedPlatforms.filter((id) => id !== item.id)
                  : [...followedPlatforms, item.id]
              "
            >
              {{ followedPlatforms.includes(item.id) ? '取消关注' : '关注平台' }}
            </button>
          </article>
          <RouterLink class="pf-text-button" to="/monitor"
            >打开平台监测<ChevronRight :size="16" /></RouterLink></template
      ></template>
      <template v-else-if="section === 'history'"
        ><p class="pf-helper">AI 对话会显示在这里。</p>
        <button
          v-for="conversation in ai.conversations"
          :key="conversation.id"
          class="pf-card pf-history"
          @click="restoreAi(conversation.id)"
        >
          <MessageCircle :size="22" /><span
            ><strong>{{ conversation.title }}</strong
            ><small>{{ conversation.messages.length }} 个问题</small></span
          ><ChevronRight :size="16" />
        </button>
        <section v-if="!ai.conversations.length" class="pf-empty">
          <MessageCircle :size="30" />
          <h3>还没有 AI 对话</h3>
          <p>发送问题后，可在这里恢复当前标签页的记录。</p>
        </section>
        <RouterLink to="/ai" class="pf-primary pf-wide">前往 Aegis AI</RouterLink></template
      >
    </div>
    <ProfileDrawers
      :panel="panel"
      :platform-id="platformId"
      :ticket-id="ticketId"
      @close="panel = null"
      @open="open"
      @navigate="navigate"
    />
  </div>
</template>
