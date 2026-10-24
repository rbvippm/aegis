import { AnalysisSchema, type AnalysisService } from '@/shared/contracts/analysis'
import { apiBase, dataMode } from '@/shared/api/config'
import { mockAnalysisService } from '@/mocks/analysis-service'
import type { DemoScenario } from '@/stores/preferences'
export function analysisService(scenario: DemoScenario): AnalysisService {
  if (dataMode === 'demo') return mockAnalysisService(scenario)
  return {
    async analyze(request, { signal, onStage }) {
      onStage('retrieving')
      const response = await fetch(`${apiBase}/ai/analyses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal,
        body: JSON.stringify(request),
      })
      if (!response.ok) throw new Error(`分析接口暂不可用（${response.status}），请稍后重试。`)
      const parsed = AnalysisSchema.safeParse(await response.json())
      if (!parsed.success) throw new Error('接口数据格式不完整，暂时无法展示分析。')
      if (parsed.data.requestId !== request.requestId || parsed.data.demo)
        throw new Error('接口返回了不匹配的结果。')
      return parsed.data
    },
  }
}
