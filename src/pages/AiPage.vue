<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowUpRight,
  BookOpen,
  ChartNoAxesColumn,
  ChevronRight,
  RefreshCw,
  Copy,
  Database,
  History,
  Mic,
  Paperclip,
  Send,
  Square,
  SquarePen,
  Sparkles,
  Trash2,
  X,
} from '@lucide/vue'
import MessageCenterLink from '@/shared/ui/MessageCenterLink.vue'
import AegisMark from '@/shared/ui/AegisMark.vue'
import AiOrb from '@/shared/ui/AiOrb.vue'
import BottomDrawer from '@/shared/ui/BottomDrawer.vue'
import SportIcon from '@/features/sports/SportIcon.vue'
import ConversationAnswer from '@/features/ai/ConversationAnswer.vue'
import ConversationDetails from '@/features/ai/ConversationDetails.vue'
import { useConversation } from '@/features/ai/conversation-store'
import type { AiSportsEntry, ChatMessage, DetailPanel } from '@/features/ai/conversation-types'
import { resolveProjectScenario } from '@/mocks/ai-project'
import { planningSuggestions } from '@/mocks/ai-planning'
import { aiCapabilityPrompts } from '@/mocks/ai-capabilities'
import { aiSuggestions } from '@/mocks/ai-conversation'
import { dataMode } from '@/shared/api/config'

const chat = useConversation()
const demoPrompts = computed<{ text: string; entry?: AiSportsEntry }[]>(() => {
  const prompts = [
    ...aiSuggestions.map((item) => ({ text: item.text })),
    ...planningSuggestions,
    ...aiCapabilityPrompts,
  ]
  return prompts.filter((item, index) => prompts.findIndex((p) => p.text === item.text) === index)
})
const questionPage = ref(0)
const shortWelcome = ref(false)
const questionsPerPage = computed(() => (shortWelcome.value ? 2 : 3))
const questionPages = computed(() =>
  Math.max(1, Math.ceil(demoPrompts.value.length / questionsPerPage.value)),
)
const visiblePrompts = computed(() =>
  demoPrompts.value.slice(
    questionPage.value * questionsPerPage.value,
    (questionPage.value + 1) * questionsPerPage.value,
  ),
)
watch(questionsPerPage, () => {
  questionPage.value = 0
})
function changeQuestionPage(delta: number) {
  questionPage.value = (questionPage.value + delta + questionPages.value) % questionPages.value
}
let welcomeMedia: MediaQueryList | undefined
function updateWelcomeDensity() {
  shortWelcome.value = welcomeMedia?.matches ?? false
}
onMounted(() => {
  welcomeMedia = matchMedia('(max-height: 700px)')
  updateWelcomeDensity()
  welcomeMedia.addEventListener('change', updateWelcomeDensity)
})
onBeforeUnmount(() => welcomeMedia?.removeEventListener('change', updateWelcomeDensity))
const route = useRoute()
const router = useRouter()
const draft = ref('')
const context = ref('')
const contextDraft = ref('')
const composing = ref(false)
const input = ref<HTMLTextAreaElement>()
const thread = ref<HTMLDivElement>()
const utility = ref<'history' | 'context' | 'voice' | null>(null)
const detail = ref<{ panel: DetailPanel; messageId: string } | null>(null)
const detailAnswer = computed(
  () => chat.messages.find((item) => item.id === detail.value?.messageId)?.answer,
)
const feedback = ref('')
const sourceMode = computed(() => (dataMode === 'demo' ? '关键结论附依据' : '暂时无法生成回答'))
const welcome = computed(() => chat.messages.length === 0)
const attachmentTitle = computed(() =>
  context.value.length > 24 ? context.value.slice(0, 24) + '…' : context.value,
)

function resizeInput() {
  if (!input.value) return
  input.value.style.height = 'auto'
  input.value.style.height = `${Math.min(input.value.scrollHeight, 96)}px`
}
function scrollLatest() {
  const element = thread.value?.querySelector<HTMLElement>('.ac-message:last-child')
  if (thread.value && element) thread.value.scrollTop = element.offsetTop - 10
}
async function send(question = draft.value, entry?: AiSportsEntry) {
  if (!question.trim() || composing.value || chat.busy) return
  const pending = chat.send(question, context.value, entry)
  const conversationId = chat.activeId
  draft.value = ''
  context.value = ''
  feedback.value = ''
  await nextTick()
  resizeInput()
  scrollLatest()
  const startScroll = thread.value?.scrollTop ?? 0
  await pending
  await nextTick()
  // Respect a reader who has scrolled back while the answer was being prepared.
  if (
    conversationId === chat.activeId &&
    Math.abs((thread.value?.scrollTop ?? 0) - startScroll) < 36
  )
    scrollLatest()
}
function keydown(event: KeyboardEvent) {
  if (
    event.key !== 'Enter' ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.isComposing ||
    composing.value
  )
    return
  event.preventDefault()
  void send()
}
async function newChat() {
  questionPage.value = 0
  chat.newConversation()
  draft.value = ''
  context.value = ''
  feedback.value = ''
  detail.value = null
  if (route.query.q) await router.replace({ path: '/ai' })
  await nextTick()
  resizeInput()
  thread.value?.scrollTo({ top: 0 })
}
async function restore(id: string) {
  chat.restore(id)
  draft.value = ''
  context.value = ''
  utility.value = null
  await nextTick()
  scrollLatest()
}
function openDetail(panel: DetailPanel, message: ChatMessage) {
  detail.value = { panel, messageId: message.id }
}
function openContext() {
  contextDraft.value = context.value
  utility.value = 'context'
}
function setContext() {
  context.value = contextDraft.value.trim()
  utility.value = null
}
async function copyAnswer(message: ChatMessage) {
  try {
    if (!navigator.clipboard) throw new Error('Unavailable')
    await navigator.clipboard.writeText(message.answer?.summary ?? '')
    feedback.value = '回答摘要已复制'
  } catch {
    feedback.value = '当前浏览器无法复制，请手动选取文字。'
  }
}
async function retry(message: ChatMessage) {
  await chat.retry(message.id)
}
function pickTool(kind: string) {
  if (kind === '出入金评估') void send(aiSuggestions[2].text)
  else if (kind === '赔率对比') void send(aiSuggestions[1].text)
  else void send(aiSuggestions[0].text)
}
watch(
  () =>
    [
      route.query.q,
      route.query.analyze,
      route.query.submit,
      route.query.fixture,
      route.query.market,
      route.query.selection,
      route.query.source,
      route.query.category,
      route.query.operator,
      route.query.revision,
    ] as const,
  async ([value, analyze, submit]) => {
    if (typeof value !== 'string' || !value.trim()) return
    draft.value = value.slice(0, 2000)
    await nextTick()
    resizeInput()
    // An explicit send action submits any question; plain q remains an editable draft.
    if (
      submit === '1' ||
      (dataMode === 'demo' &&
        analyze === '1' &&
        (resolveProjectScenario(value) || route.query.source === 'sports'))
    ) {
      const entry: AiSportsEntry | undefined =
        route.query.source === 'sports'
          ? {
              source: 'sports',
              fixture: String(route.query.fixture ?? ''),
              market: String(route.query.market ?? ''),
              selection: Number(route.query.selection ?? NaN),
              category: String(route.query.category ?? 'all'),
              operator: String(route.query.operator ?? ''),
              revision: Number(route.query.revision ?? 0),
            }
          : undefined
      chat.newConversation()
      await router.replace({ path: '/ai', query: { ...route.query, analyze: undefined, submit: undefined } })
      await send(value.slice(0, 2000), entry)
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => chat.stop())
</script>

<template>
  <div class="ac-page" :class="{ 'ac-page--welcome': welcome }">
    <header class="ac-header">
      <RouterLink to="/" class="ac-brand" aria-label="Aegis 首页"><AegisMark /></RouterLink>
      <div class="ac-brand-copy">
        <h1>Aegis AI</h1>
        <p>{{ sourceMode }}</p>
      </div>
      <div class="ac-header-actions">
        <MessageCenterLink />
        <button aria-label="对话历史" @click="utility = 'history'"><History :size="20" /></button
        ><button aria-label="新建对话" @click="newChat"><SquarePen :size="19" /></button>
      </div>
    </header>
    <div ref="thread" class="ac-thread" tabindex="0" aria-label="AI 对话内容">
      <section v-if="welcome" class="ac-welcome">
        <div class="ac-hero">
          <AiOrb large />
          <h2>你好，我是 Aegis AI</h2>
          <p>查平台数据、解读变化，也能帮你处理站内事务。</p>
        </div>
        <div class="ac-suggestions" aria-label="推荐问题">
          <button
            v-for="item in visiblePrompts"
            :key="item.text"
            :title="item.text"
            :disabled="chat.busy"
            @click="send(item.text, item.entry)"
          >
            <SportIcon
              v-if="/维拉|曼城|海港|比赛/.test(item.text)"
              sport="football"
              :size="25"
            /><ChartNoAxesColumn
              v-else-if="/赔率|报价|资金|存款|中位数|纯净度/.test(item.text)"
              :size="25"
            /><Sparkles v-else-if="/帮我|如何/.test(item.text)" :size="25" /><Database
              v-else
              :size="25"
            /><span>{{ item.text }}</span
            ><ChevronRight :size="18" />
          </button>
        </div>
        <div class="ac-question-navigation">
          <button aria-label="换一批推荐问题" @click="changeQuestionPage(1)">
            <RefreshCw :size="15" /><span>换一批</span>
          </button>
        </div>
        <div class="ac-capabilities" aria-label="AI 能力">
          <button
            v-for="(label, index) in ['赛事分析', '赔率对比', '出入金评估']"
            :key="label"
            @click="pickTool(label)"
          >
            <span class="ac-capability-icon"
              ><SportIcon v-if="index === 0" sport="football" :size="22" /><ChartNoAxesColumn
                v-else-if="index === 1"
                :size="22" /><Database v-else :size="22" /></span
            ><strong>{{ label }}</strong
            ><small>{{
              ['赛程 · 阵容 · 盘口', '多平台 · 同盘口', '到账 · 费用 · 风险'][index]
            }}</small>
          </button>
        </div>
      </section>
      <div v-else class="ac-messages" role="list" aria-label="对话消息">
        <article
          v-for="message in chat.messages"
          :key="message.id"
          class="ac-message"
          role="listitem"
          :aria-label="`问题：${message.question}`"
        >
          <div class="ac-user-message">
            <p>{{ message.question }}</p>
            <small v-if="message.context"
              ><Paperclip :size="12" />补充背景：{{ message.context }}</small
            >
          </div>
          <div v-if="message.status === 'pending'" class="ac-thinking" role="status">
            <AiOrb />
            <div>
              <span class="ac-thinking-dots"><i></i><i></i><i></i></span>
              <p>{{ message.stage }}</p>
            </div>
          </div>
          <template v-else-if="message.answer && message.status === 'complete'">
            <ConversationAnswer
              :answer="message.answer"
              @detail="openDetail($event, message)"
              @followup="send"
            />
            <div class="ac-message-actions">
              <button
                :aria-label="`复制回答摘要：${message.question}`"
                @click="copyAnswer(message)"
              >
                <Copy :size="15" />复制</button
              ><button :disabled="chat.busy" @click="retry(message)">
                <SquarePen :size="15" />重新生成
              </button>
            </div>
          </template>
          <div
            v-else
            class="ac-card ac-message-state"
            :role="message.status === 'error' ? 'alert' : 'status'"
          >
            <AiOrb />
            <div>
              <h2>{{ message.status === 'error' ? '暂时无法完成回答' : '已停止生成' }}</h2>
              <p>{{ message.error ?? '当前回答尚未生成，可以重新生成或继续提问。' }}</p>
              <button class="ac-text-link" :disabled="chat.busy" @click="retry(message)">
                {{ message.status === 'error' ? '重试' : '重新生成' }}<ArrowUpRight :size="15" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
    <footer class="ac-composer-area">
      <div v-if="context" class="ac-context-chip">
        <Paperclip :size="14" /><span>{{ attachmentTitle }}</span
        ><button aria-label="移除补充背景" @click="context = ''"><X :size="16" /></button>
      </div>
      <p v-if="feedback" role="status" class="ac-feedback">{{ feedback }}</p>
      <form class="ac-composer" aria-label="向 Aegis AI 提问" @submit.prevent="send()">
        <button
          type="button"
          class="ac-composer-tool"
          aria-label="补充问题背景"
          @click="openContext"
        >
          <Paperclip :size="21" />
        </button>
        <textarea
          ref="input"
          v-model="draft"
          rows="1"
          maxlength="2000"
          aria-label="输入你的问题"
          :placeholder="welcome ? '问比赛、查赔率、看出入金…' : '继续追问…'"
          @input="resizeInput"
          @keydown="keydown"
          @compositionstart="composing = true"
          @compositionend="composing = false"
        ></textarea>
        <button
          v-if="!chat.busy && !draft.trim()"
          type="button"
          class="ac-composer-tool ac-mic"
          aria-label="语音输入说明"
          @click="utility = 'voice'"
        >
          <Mic :size="19" />
        </button>
        <button
          v-if="chat.busy"
          type="button"
          class="ac-send"
          aria-label="停止生成"
          @click="chat.stop"
        >
          <Square :size="16" fill="currentColor" />
        </button>
        <button
          v-else
          type="submit"
          class="ac-send"
          :disabled="!draft.trim()"
          aria-label="发送问题"
        >
          <Send :size="20" fill="currentColor" />
        </button>
      </form>
      <p v-if="chat.busy" class="ac-composer-note" role="status">正在整理回答</p>
    </footer>
    <ConversationDetails
      :open="detail !== null"
      :panel="detail?.panel ?? 'analysis'"
      :answer="detailAnswer"
      @close="detail = null"
    />
    <BottomDrawer
      :open="utility !== null"
      :title="
        utility === 'history' ? '对话历史' : utility === 'context' ? '补充问题背景' : '语音输入'
      "
      @close="utility = null"
    >
      <div class="ac-utility">
        <template v-if="utility === 'history'"
          ><p class="ac-card-note">可以回到之前的问题。</p>
          <div v-if="!chat.conversations.length" class="ac-history-empty">
            <BookOpen :size="30" />
            <h2>还没有对话</h2>
            <p>从推荐问题开始，或输入你想了解的内容。</p>
          </div>
          <div
            v-for="conversation in chat.conversations"
            :key="conversation.id"
            class="ac-history-row"
          >
            <button
              :aria-current="chat.activeId === conversation.id ? 'true' : undefined"
              @click="restore(conversation.id)"
            >
              <span>{{ conversation.title }}</span
              ><small
                >{{ conversation.messages.length }} 个问题{{
                  chat.activeId === conversation.id ? ' · 当前对话' : ''
                }}</small
              ></button
            ><button
              :aria-label="`删除对话：${conversation.title}`"
              @click="chat.remove(conversation.id)"
            >
              <Trash2 :size="18" />
            </button></div
        ></template>
        <template v-else-if="utility === 'context'"
          ><p class="ac-prose">补充赛事、盘口或平台背景，用于当前问题。</p>
          <label class="ac-field"
            >背景信息<textarea
              v-model="contextDraft"
              maxlength="3000"
              rows="5"
              placeholder="例如：想比较的平台、链、币种、金额档…"
            ></textarea></label
          ><button class="ac-primary ac-return" @click="setContext">
            添加到当前问题
          </button></template
        >
        <template v-else-if="utility === 'voice'"
          ><div class="ac-history-empty">
            <Mic :size="32" />
            <h2>请使用文字提问</h2>
            <p>语音输入暂不可用。</p>
          </div>
          <button class="ac-primary ac-return" @click="utility = null">
            使用文字输入
          </button></template
        >
      </div>
    </BottomDrawer>
  </div>
</template>

<style src="@/features/ai/conversation.css"></style>

<style scoped>
.ac-demo-groups {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 3px;
  padding: 4px;
  border: 1px solid var(--ae-border, #d7e6f8);
  border-radius: 17px;
  background: white;
}
.ac-demo-groups button {
  min-height: 44px;
  padding: 5px;
  border: 0;
  border-radius: 13px;
  background: transparent;
  color: var(--ae-label);
  font-size: 13px;
  font-weight: 600;
}
.ac-demo-groups button.active {
  background: var(--ae-pill);
  color: white;
  box-shadow: var(--ae-pill-shadow);
}
</style>
