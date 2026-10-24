export type AnswerKind = 'sports' | 'funding' | 'clarify'
export type DetailPanel = 'analysis' | 'sources' | 'quotes' | 'funding' | 'risk' | 'limits'
export interface ChatSource {
  id: string
  title: string
  type: string
  excerpt: string
  asOf: string
  status: string
}
export interface ChatAnswer {
  kind: AnswerKind
  summary: string
  sources: ChatSource[]
  followups: string[]
}
export interface ChatMessage {
  id: string
  question: string
  context: string
  status: 'pending' | 'complete' | 'stopped' | 'error'
  stage: string
  answer?: ChatAnswer
  error?: string
}
export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
}
