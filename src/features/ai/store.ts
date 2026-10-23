import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Analysis, AnalysisStage } from '@/shared/contracts/analysis'
import { analysisService } from './service'
import { usePreferences } from '@/stores/preferences'

export const useAnalysis = defineStore('analysis', () => {
  const result = ref<Analysis | null>(null)
  const question = ref('')
  const busy = ref(false)
  const error = ref('')
  const cancelled = ref(false)
  const stage = ref<AnalysisStage>('retrieving')
  let controller: AbortController | null = null
  let activeId = ''
  async function ask(message: string) {
    if (busy.value || !message.trim()) return
    const requestId = crypto.randomUUID()
    activeId = requestId
    controller = new AbortController()
    question.value = message.trim()
    result.value = null
    error.value = ''
    cancelled.value = false
    busy.value = true
    try {
      const response = await analysisService(usePreferences().scenario).analyze(
        {
          requestId,
          message: question.value,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        {
          signal: controller.signal,
          onStage: (value) => {
            if (activeId === requestId) stage.value = value
          },
        },
      )
      if (activeId === requestId) result.value = response
    } catch (cause) {
      if (activeId !== requestId) return
      if (cause instanceof DOMException && cause.name === 'AbortError') cancelled.value = true
      else error.value = cause instanceof Error ? cause.message : '暂时无法完成分析。'
    } finally {
      if (activeId === requestId) {
        busy.value = false
        controller = null
      }
    }
  }
  function stop() {
    controller?.abort()
  }
  function reset() {
    stop()
    activeId = ''
    busy.value = false
    question.value = ''
    result.value = null
    error.value = ''
    cancelled.value = false
  }
  return { result, question, busy, error, cancelled, stage, ask, stop, reset }
})
