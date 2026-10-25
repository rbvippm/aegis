import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { useProfile } from '@/features/profile/store'
import { planningMatches, planningOperators } from '@/mocks/sports-planning'
export interface PlanningReminder {
  id: string
  matchId: string
  marketId: string
  operator: string
  selection: string
  type: 'price' | 'line' | 'status' | 'kickoff'
  target: string
  cooldown: string
  window: string
  merge: boolean
  enabled: boolean
  telegram: boolean
}
function read<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}
export const useSportsTracking = defineStore('sports-planning-tracking', () => {
  const saved = read<unknown>('aegis-planning-reminders', [])
  const reminders = ref<PlanningReminder[]>(
    Array.isArray(saved)
      ? saved.filter(
          (r) =>
            r &&
            typeof r.id === 'string' &&
            planningMatches.some((f) => f.id === r.matchId) &&
            typeof r.marketId === 'string' &&
            ['price', 'line', 'status', 'kickoff'].includes(r.type) &&
            typeof r.target === 'string' &&
            typeof r.enabled === 'boolean',
        )
      : [],
  )
  const botPreview = ref(read<boolean>('aegis-bot-preview', false) === true)
  const target = ref(read<string>('aegis-bot-preview-target', '私聊'))
  const profile = useProfile()
  watch(
    reminders,
    (v) => {
      try {
        localStorage.setItem('aegis-planning-reminders', JSON.stringify(v))
      } catch {
        /* Session only. */
      }
    },
    { deep: true },
  )
  watch([botPreview, target], () => {
    try {
      localStorage.setItem('aegis-bot-preview', JSON.stringify(botPreview.value))
      localStorage.setItem('aegis-bot-preview-target', JSON.stringify(target.value))
    } catch {
      /* Session only. */
    }
  })
  function notify(r: PlanningReminder, test = false) {
    const f = planningMatches.find((f) => f.id === r.matchId)!
    const market = f.markets.find((m) => m.id === r.marketId)
    const name = planningOperators.find((p) => p.id === r.operator)?.name ?? '全部平台'
    profile.saveSportsNotice(
      `planning-${r.id}${test ? '-test' : ''}`,
      `${f.home} vs ${f.away} · ${test ? '测试通知' : '提醒设置'}`,
      `${f.league} · ${market?.label ?? ''} · ${market?.scope ?? ''} · ${market?.line ?? ''}；${name} · ${r.selection} · ${{ price: '赔率达到', line: '盘口跨档', status: '锁盘 / 恢复', kickoff: '开赛前' }[r.type]} ${r.target}；观察 ${r.window} · 冷却 ${r.cooldown} · ${r.merge ? '合并连续变化' : '逐条记录'}；${test ? '站内与 Bot 消息预览，未向外发送' : '设置已保存'}`,
      `/compare?panel=reminders&match=${f.id}`,
    )
  }
  function save(r: PlanningReminder) {
    const index = reminders.value.findIndex((x) => x.id === r.id)
    if (index < 0) reminders.value.push({ ...r })
    else reminders.value[index] = { ...r }
    notify(r)
  }
  function remove(id: string) {
    reminders.value = reminders.value.filter((r) => r.id !== id)
    profile.removeSportsNotice(`planning-${id}`)
    profile.removeSportsNotice(`planning-${id}-test`)
  }
  return { reminders, botPreview, target, save, remove, notify }
})
