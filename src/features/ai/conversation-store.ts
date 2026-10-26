import { usePlatformFollows } from '@/features/monitoring/follows'
import { useProfile } from '@/features/profile/store'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { requestChat } from './conversation-service'
import type { AiSportsEntry, ChatMessage, Conversation } from './conversation-types'

export const useConversation = defineStore('ai-conversation', () => {
  const platformFollows = usePlatformFollows()
  const profile = useProfile()
  // History is kept in memory for this tab, never persisted or sent to an external service.
  const conversations = ref<Conversation[]>([])
  const activeId = ref('')
  const active = computed(() => conversations.value.find((item) => item.id === activeId.value))
  const messages = computed(() => active.value?.messages ?? [])
  const busy = computed(() => messages.value.some((item) => item.status === 'pending'))
  let controller: AbortController | undefined
  let requestId = ''
  function stop() {
    controller?.abort()
    controller = undefined
    requestId = ''
    messages.value
      .filter((item) => item.status === 'pending')
      .forEach((item) => {
        item.status = 'stopped'
      })
  }
  function newConversation() {
    stop()
    activeId.value = ''
  }
  function restore(id: string) {
    stop()
    if (conversations.value.some((item) => item.id === id)) activeId.value = id
  }
  function remove(id: string) {
    if (activeId.value === id) newConversation()
    conversations.value = conversations.value.filter((item) => item.id !== id)
  }
  async function run(message: ChatMessage, conversation: Conversation) {
    controller = new AbortController()
    const ownController = controller
    const id = crypto.randomUUID()
    requestId = id
    const previous = conversation.messages
      .slice(
        0,
        conversation.messages.findIndex((item) => item.id === message.id),
      )
      .reverse()
      .find((item) => item.answer && item.answer.kind !== 'clarify')?.answer
    try {
      const answer = await requestChat(
        [message.question, message.context].filter(Boolean).join('\n'),
        previous,
        ownController.signal,
        (text) => {
          if (requestId === id) message.stage = text
        },
        {
          follows: [...platformFollows.ids],
          platformUnread: profile.notices.filter((n) => n.type === 'platform' && !n.read).length,
        },
        message.entry,
      )
      if (requestId !== id) return
      message.answer = answer
      message.status = 'complete'
    } catch (error) {
      if (requestId !== id) return
      if (ownController.signal.aborted) message.status = 'stopped'
      else {
        message.status = 'error'
        message.error = error instanceof Error ? error.message : '暂时无法生成回答，请重试。'
      }
    } finally {
      if (requestId === id) {
        controller = undefined
        requestId = ''
      }
    }
  }
  async function send(question: string, context = '', entry?: AiSportsEntry) {
    if (busy.value || !question.trim()) return
    if (!active.value) {
      const conversation = {
        id: crypto.randomUUID(),
        title: question.trim().slice(0, 40),
        messages: [],
      }
      conversations.value.unshift(conversation)
      activeId.value = conversation.id
    }
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      question: question.trim(),
      context,
      entry,
      status: 'pending',
      stage: '正在整理回答…',
    }
    active.value!.messages.push(message)
    // Use the reactive proxy so async updates are observable to the UI.
    await run(active.value!.messages.at(-1)!, active.value!)
  }
  async function retry(id: string) {
    const message = messages.value.find((item) => item.id === id)
    if (!message || busy.value || !active.value) return
    message.status = 'pending'
    message.answer = undefined
    message.error = undefined
    await run(message, active.value)
  }
  return {
    conversations,
    activeId,
    messages,
    busy,
    send,
    stop,
    retry,
    newConversation,
    restore,
    remove,
  }
})
