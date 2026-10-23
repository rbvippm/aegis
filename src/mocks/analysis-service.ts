import type { AnalysisService } from '@/shared/contracts/analysis'
import type { DemoScenario } from '@/stores/preferences'
import { makeAnalysis } from './fixtures'
export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已停止', 'AbortError'))
      return
    }
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('已停止', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal.addEventListener('abort', onAbort, { once: true })
  })
}
export function mockAnalysisService(scenario: DemoScenario): AnalysisService {
  return {
    async analyze(request, { signal, onStage }) {
      for (const stage of ['retrieving', 'analyzing', 'ranking'] as const) {
        onStage(stage)
        await abortableDelay(450, signal)
      }
      if (scenario === 'error')
        throw new Error('演示服务暂时不可用，请重试或在“我的”中切换演示场景。')
      if (
        scenario === 'empty' ||
        !/海港|山城|这场|赔率|出入金|出金|平台|阵容|比赛/.test(request.message)
      )
        throw new Error('暂无匹配数据。演示仅覆盖海港队与山城队，请选择示例问题。')
      // Explicitly refuse other named real fixtures instead of inventing a match.
      if (!/海港|山城|这场|平台|赔率|出入金|出金|阵容/.test(request.message))
        throw new Error('请先选择演示赛事：海港队 vs 山城队。')
      return makeAnalysis(request.requestId, scenario)
    },
  }
}
