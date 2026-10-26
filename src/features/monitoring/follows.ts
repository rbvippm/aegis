import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { dataMode } from '@/shared/api/config'
import { useProfile } from '@/features/profile/store'
import { monitoringPlatforms } from '@/mocks/monitoring-platforms'
import { analyticsAsOf, analyticsLedger, analyticsCatalog } from '@/mocks/monitoring-analytics'
import { day, money } from './analytics-model'
import { platformActivities, preferredPlatforms } from './activity'
import type { ResearchPlatform } from './research'
export const usePlatformFollows = defineStore('platform-follows', () => {
  const profile = useProfile()
  const ids = ref<string[]>([])
  const catalog: ResearchPlatform[] =
    dataMode === 'demo'
      ? analyticsCatalog.map(
          (meta) =>
            monitoringPlatforms.find((p) => p.id === meta.id) ?? {
              id: meta.id,
              name: meta.name,
              score: null,
              chains: [],
              grade: null,
              taint: null,
              wallet: null,
              flow: null,
              flowPercent: null,
              samples: 0,
              smallMinutes: null,
              largeMinutes: null,
              commission: null,
              playerShare: null,
              windows: {
                '24h': { deposit: '—', amount: 0, change: 0 },
                '7d': { deposit: '—', amount: 0, change: 0 },
                '30d': { deposit: '—', amount: 0, change: 0 },
              },
            },
        )
      : []
  try {
    const saved: unknown = JSON.parse(localStorage.getItem('aegis-platform-follows-v1') ?? '[]')
    if (Array.isArray(saved))
      ids.value = [
        ...new Set(
          saved.filter(
            (id): id is string => typeof id === 'string' && catalog.some((p) => p.id === id),
          ),
        ),
      ]
  } catch {
    /* Session-only preference. */
  }
  const activities =
    dataMode === 'demo' ? platformActivities(analyticsLedger, catalog, analyticsAsOf) : []
  const followed = computed(() => catalog.filter((p) => ids.value.includes(p.id)))
  const preferred = computed(() => preferredPlatforms(catalog, ids.value))
  function toggle(id: string) {
    if (!catalog.some((p) => p.id === id)) return
    ids.value = ids.value.includes(id) ? ids.value.filter((x) => x !== id) : [...ids.value, id]
  }
  watch(
    ids,
    (value) => {
      try {
        localStorage.setItem('aegis-platform-follows-v1', JSON.stringify(value))
      } catch {
        /* Session-only. */
      }
    },
    { deep: true },
  )
  watch(
    [ids, () => profile.preferences.platform],
    () => {
      if (!profile.preferences.platform || dataMode !== 'demo') return
      for (const event of activities.filter(
        (e) => ids.value.includes(e.platform) && e.time > analyticsAsOf - day,
      )) {
        const id = `monitor:${event.id}`
        if (profile.notices.some((n) => n.id === id)) continue
        const name = catalog.find((p) => p.id === event.platform)!.name
        profile.notices.unshift({
          id,
          title: `${name} · ${event.title}`,
          description: `${new Date(event.time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} UTC+8 · ${event.usd === null ? '' : `${money(event.usd)} · `}${event.description}`,
          type: 'platform',
          read: false,
          target: `/monitor?platform=${event.platform}&event=${encodeURIComponent(event.id)}`,
        })
      }
    },
    { deep: true, immediate: true },
  )
  return { ids, catalog, followed, preferred, activities, toggle }
})
