import { dataMode } from '@/shared/api/config'
import { mockChatAnswer } from '@/mocks/ai-conversation'
import type { AnswerKind, ChatAnswer } from './conversation-types'

function wait(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const abort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, 420)
    signal.addEventListener('abort', abort, { once: true })
  })
}
export function resolveChatKind(message: string, previous?: AnswerKind): AnswerKind {
  if (/出金|入金|提现|USDT|TRON|体检|大额/i.test(message)) return 'funding'
  if (/维拉|曼城/.test(message)) return 'sports'
  // Follow-ups inherit context only for the known example prompts, not arbitrary new questions.
  if (previous && ['为什么选受让？', '比较其他平台', '查看报价', '查看平台 B'].includes(message))
    return previous
  return 'clarify'
}
export async function requestChat(
  message: string,
  previous: AnswerKind | undefined,
  signal: AbortSignal,
  stage: (text: string) => void,
): Promise<ChatAnswer> {
  if (dataMode !== 'demo')
    throw new Error('暂时无法生成回答，请稍后重试。')
  stage('正在整理回答…')
  await wait(signal)
  stage('正在生成卡片…')
  await wait(signal)
  if (/大额/.test(message))
    return {
      kind: 'clarify',
      summary:
        '当前记录覆盖小额 <1,000 USDT。大额出金需要单独比较，不能把小额耗时直接用于大额推荐。',
      sources: [],
      followups: ['TRON 小额出金，优先看哪家？'],
    }
  const answer = mockChatAnswer(resolveChatKind(message, previous))
  if (message === '查看平台 B' && previous === 'funding') {
    answer.summary =
      '在此小额记录中，平台 B 的申请到到账中位耗时为 5m08s，共 64 笔记录；平台 A 同口径为 3m24s。费用与风险指标需单独核验。'
  }
  return answer
}
