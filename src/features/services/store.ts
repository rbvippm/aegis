import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dataMode } from '@/shared/api/config'
import type { AnonymousRequest, PlatformId, ServiceKind } from './types'

// Deliberately session-only: no identity, credentials, files or financial records are persisted.
export const useServiceRequests = defineStore('service-requests', () => {
  const requests = ref<Partial<Record<ServiceKind, AnonymousRequest>>>({})
  const comparison = ref<PlatformId[]>([])
  function save(request: AnonymousRequest) {
    if (dataMode !== 'demo') return false
    requests.value[request.kind] = { ...request, note: request.note.trim().slice(0, 200) }
    return true
  }
  function remove(kind: ServiceKind) {
    delete requests.value[kind]
  }
  function toggleComparison(id: PlatformId) {
    comparison.value = comparison.value.includes(id)
      ? comparison.value.filter((item) => item !== id)
      : [...comparison.value, id]
  }
  return { requests, comparison, save, remove, toggleComparison }
})
