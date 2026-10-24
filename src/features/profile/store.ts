import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { dataMode } from '@/shared/api/config'
import {
  profileBindings,
  profileNotices,
  profileSettlements,
  profileTickets,
} from '@/mocks/profile'
import { totalCents, validateTicket, validateUid } from './logic'
import type { EvidenceFile, TicketInput } from './types'
export const useProfile = defineStore('profile-center', () => {
  const previewIdentity = ref(dataMode === 'demo')
  const nickname = ref('御盾用户')
  const bindings = ref(dataMode === 'demo' ? structuredClone(profileBindings) : [])
  const records = ref(dataMode === 'demo' ? structuredClone(profileSettlements) : [])
  const tickets = ref(dataMode === 'demo' ? structuredClone(profileTickets) : [])
  const notices = ref(dataMode === 'demo' ? structuredClone(profileNotices) : [])
  const feedback = ref<{ category: string; content: string; contact: string }[]>([])
  const preferences = ref({
    platform: true,
    odds: true,
    ticket: true,
    system: true,
    telegram: false,
    email: false,
  })
  const boundCount = computed(() => bindings.value.filter((item) => item.uid).length)
  const unreadCount = computed(() => notices.value.filter((item) => !item.read).length)
  const pendingCents = computed(() => totalCents(records.value, 'pending'))
  const settledCents = computed(() => totalCents(records.value, 'settled'))
  function guard() {
    return dataMode !== 'demo'
      ? '真实服务尚未接入，未发送或保存任何资料。'
      : !previewIdentity.value
        ? '请先进入示例身份或等待真实登录服务接入。'
        : ''
  }
  function bind(platform: string, uid: string) {
    const error = guard() || validateUid(uid)
    if (error) return error
    const item = bindings.value.find((binding) => binding.id === platform)
    if (!item) return '请选择平台。'
    item.uid = uid.trim()
    item.eligibility = 'pending'
    return ''
  }
  function saveTicket(input: TicketInput) {
    const error = guard() || validateTicket(input)
    if (error) return { error }
    const id = `LOCAL-${crypto.randomUUID().slice(0, 8)}`
    tickets.value.unshift({
      id,
      platform: input.platform,
      category: input.category,
      description: input.description.trim(),
      status: 'draft',
      date: '当前会话',
      amount: input.amount,
      example: false,
      evidence: input.evidence.map((item) => ({ ...item })),
    })
    return { id, error: '' }
  }
  function supplement(id: string, text: string, files: EvidenceFile[]) {
    const error =
      guard() ||
      validateTicket({
        platform: tickets.value.find((item) => item.id === id)?.platform ?? '',
        category: '补充材料',
        description: text,
        amount: '',
        evidence: files,
      })
    if (error) return error
    const ticket = tickets.value.find((item) => item.id === id)
    if (!ticket) return '工单不存在。'
    ticket.supplement = text.trim()
    ticket.evidence = files.map((item) => ({ ...item }))
    return ''
  }
  function saveFeedback(category: string, content: string, contact: string) {
    if (dataMode !== 'demo') return '反馈服务尚未接入，未提交反馈。'
    if (content.trim().length < 10 || content.length > 2000) return '请填写 10–2000 字的反馈意见。'
    feedback.value.push({ category, content: content.trim(), contact: contact.trim() })
    return ''
  }
  function logout() {
    previewIdentity.value = false
    feedback.value = []
    bindings.value = dataMode === 'demo' ? structuredClone(profileBindings) : []
    tickets.value = dataMode === 'demo' ? structuredClone(profileTickets) : []
    nickname.value = '御盾用户'
  }
  return {
    previewIdentity,
    nickname,
    bindings,
    records,
    tickets,
    notices,
    feedback,
    preferences,
    boundCount,
    unreadCount,
    pendingCents,
    settledCents,
    bind,
    saveTicket,
    supplement,
    saveFeedback,
    logout,
  }
})
